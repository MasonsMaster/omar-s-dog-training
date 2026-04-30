import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active training schedules
    const schedules = await base44.asServiceRole.entities.TrainingSchedule.filter(
      { status: "active" },
      "-created_date",
      500
    );

    if (schedules.length === 0) {
      return Response.json({ success: true, reminders_sent: 0 });
    }

    const reminders_sent = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Check each schedule for sessions 24 hours away
    for (const schedule of schedules) {
      const sessions = await base44.asServiceRole.entities.TrainingSession.filter(
        { schedule_id: schedule.id, completed: false },
        "session_date",
        100
      );

      for (const session of sessions) {
        const sessionDate = new Date(session.session_date);
        const sessionTime = session.session_time || "10:00";
        const [hours, minutes] = sessionTime.split(":").map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);

        // Check if session is within 24 hours
        const timeDiff = sessionDate.getTime() - now.getTime();
        const hoursUntilSession = timeDiff / (1000 * 60 * 60);

        if (hoursUntilSession > 23 && hoursUntilSession < 25) {
          // Session is ~24 hours away, send reminder
          const clientEmail = schedule.client_email;

          // Fetch client user info
          const users = await base44.asServiceRole.entities.User.filter(
            { email: clientEmail }
          );
          const clientName = users[0]?.full_name || clientEmail;

          // Build goal/focus areas text
          const focusAreas = session.focus_areas?.length
            ? session.focus_areas.join(", ")
            : "Training and practice";

          // Get recent behavior logs for this client
          const recentLogs = await base44.asServiceRole.entities.BehaviorLog.filter(
            { client_email: clientEmail },
            "-log_date",
            3
          );

          const logSummary = recentLogs.length
            ? `Recent logs: ${recentLogs.map(l => `${l.log_date} (${l.overall_mood || 'no mood'})`).join(" | ")}`
            : "No recent logs yet. Start logging today!";

          // Format session date
          const formattedDate = new Date(session.session_date).toLocaleDateString(
            "en-US",
            { weekday: "long", month: "short", day: "numeric" }
          );

          // Email subject and body
          const emailSubject = `🐾 Your Training Session Is Tomorrow! (${formattedDate} at ${sessionTime})`;
          const emailBody = `Hi ${clientName},

Your training session is scheduled for tomorrow:

📅 Date: ${formattedDate}
⏰ Time: ${sessionTime}
🎯 Focus Areas: ${focusAreas}

This session builds on your recent progress. Here's a quick overview:
${logSummary}

Please be ready 5 minutes early. If you have any questions or need to reschedule, reply to this email or call (321) 830-6272.

See you tomorrow! 🐕
- Omar's Dog Training™

P.S. Keep logging your daily observations to track progress and unlock behavior mastery!`;

          // Send email reminder
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: clientEmail,
              subject: emailSubject,
              body: emailBody,
              from_name: "Omar's Dog Training",
            });

            reminders_sent.push({
              client: clientEmail,
              session: session.id,
              sent_at: new Date().toISOString(),
              method: "email",
            });

            console.log(`Session reminder sent to ${clientEmail} for session ${session.id}`);
          } catch (emailError) {
            console.error(`Failed to send email to ${clientEmail}:`, emailError);
          }
        }
      }
    }

    return Response.json({
      success: true,
      reminders_sent: reminders_sent.length,
      details: reminders_sent,
    });
  } catch (error) {
    console.error("Error in sendSessionReminders:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});