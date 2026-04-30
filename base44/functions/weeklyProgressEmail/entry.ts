import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled invocation (no user context) via service role
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all active training schedules
    const schedules = await base44.asServiceRole.entities.TrainingSchedule.filter({ status: 'active' });

    if (!schedules || schedules.length === 0) {
      return Response.json({ sent: 0, message: 'No active schedules found.' });
    }

    // Group schedules by client email
    const byClient = {};
    for (const s of schedules) {
      if (!s.client_email) continue;
      if (!byClient[s.client_email]) byClient[s.client_email] = [];
      byClient[s.client_email].push(s);
    }

    const clientEmails = Object.keys(byClient);
    let sent = 0;

    for (const email of clientEmails) {
      const clientSchedules = byClient[email];

      // Fetch homework for this client
      const allHW = await base44.asServiceRole.entities.HomeworkTask.filter({ client_email: email });

      // Split into completed this week vs pending
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const completedThisWeek = allHW.filter((t) => {
        if (!t.completed || !t.completed_date) return false;
        return new Date(t.completed_date) >= oneWeekAgo;
      });

      const pendingTasks = allHW.filter((t) => !t.completed);

      // Upcoming sessions: sessions remaining
      const totalRemaining = clientSchedules.reduce((sum, s) => {
        const remaining = (s.sessions_total || 0) - (s.sessions_completed || 0);
        return sum + Math.max(0, remaining);
      }, 0);

      // Build email body
      const firstName = email.split('@')[0]; // fallback if no name stored

      const programLines = clientSchedules.map((s) => {
        const pct = s.sessions_total
          ? Math.round((s.sessions_completed / s.sessions_total) * 100)
          : 0;
        return `• ${s.dog_name ? s.dog_name + ' — ' : ''}${s.program}: ${s.sessions_completed || 0}/${s.sessions_total || '?'} sessions (${pct}% complete)`;
      }).join('\n');

      const completedLines = completedThisWeek.length > 0
        ? completedThisWeek.map((t) => `  ✅ ${t.title}`).join('\n')
        : '  (No tasks completed this week — keep it up!)';

      const pendingLines = pendingTasks.length > 0
        ? pendingTasks.slice(0, 5).map((t) => {
            const due = t.due_date ? ` (due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` : '';
            return `  📋 ${t.title}${due}`;
          }).join('\n')
        : '  🎉 All caught up! No pending tasks.';

      const upcomingNote = totalRemaining > 0
        ? `You have ${totalRemaining} session${totalRemaining > 1 ? 's' : ''} remaining across your active program${clientSchedules.length > 1 ? 's' : ''}.`
        : 'You have completed all sessions in your current program — great work!';

      const subject = `🐾 Your Weekly Training Update — Omar's Dog Training`;

      const body = `Hi there,

Here's your weekly training progress summary from Omar's Dog Training™.

━━━━━━━━━━━━━━━━━━━━
📊 PROGRAM PROGRESS
━━━━━━━━━━━━━━━━━━━━
${programLines}

${upcomingNote}

━━━━━━━━━━━━━━━━━━━━
✅ HOMEWORK COMPLETED THIS WEEK
━━━━━━━━━━━━━━━━━━━━
${completedLines}

━━━━━━━━━━━━━━━━━━━━
📋 PENDING HOMEWORK
━━━━━━━━━━━━━━━━━━━━
${pendingLines}

━━━━━━━━━━━━━━━━━━━━
📅 UPCOMING SESSIONS
━━━━━━━━━━━━━━━━━━━━
View your upcoming appointments and book sessions in your client portal:
👉 https://omarsdogtraining.com/my-dashboard

Questions? Reach out anytime:
📞 (321) 830-6272
✉️  info@omarsdogtraining.com

Keep up the great work — consistency is everything!

— Omar & The Team
Omar's Dog Training™ · Brevard County, FL
Better Dogs Start With Better Leaders™`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        from_name: "Omar's Dog Training",
        subject,
        body,
      });

      sent++;
    }

    return Response.json({ sent, total_clients: clientEmails.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});