import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled admin job
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate last week's date range (Mon–Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) - 7);
    lastMonday.setHours(0, 0, 0, 0);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    const weekStart = lastMonday.toISOString().split('T')[0];
    const weekEnd = lastSunday.toISOString().split('T')[0];

    // Fetch all behavior logs for last week
    const allLogs = await base44.asServiceRole.entities.BehaviorLog.list();
    const weekLogs = allLogs.filter(log => log.log_date >= weekStart && log.log_date <= weekEnd);

    if (weekLogs.length === 0) {
      return Response.json({ generated: 0, message: 'No logs found for last week.' });
    }

    // Group logs by client_email + dog_name
    const grouped = {};
    for (const log of weekLogs) {
      const key = `${log.client_email}::${log.dog_name || ''}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    }

    let generated = 0;
    const errors = [];

    for (const [key, logs] of Object.entries(grouped)) {
      if (logs.length < 3) continue; // Need at least 3 logs for a meaningful report

      const [clientEmail, dogName] = key.split('::');

      // Skip if report already exists for this week
      const existing = await base44.asServiceRole.entities.WeeklyReport.filter({
        client_email: clientEmail,
        week_start: weekStart,
      });
      if (existing.length > 0) continue;

      // Compute stats
      const practiceDays = logs.filter(l => l.practice_done).length;
      const totalMinutes = logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

      const moodBreakdown = {};
      for (const log of logs) {
        if (log.overall_mood) moodBreakdown[log.overall_mood] = (moodBreakdown[log.overall_mood] || 0) + 1;
      }

      const behaviorCounts = {};
      for (const log of logs) {
        for (const b of (log.behaviors_observed || [])) {
          behaviorCounts[b] = (behaviorCounts[b] || 0) + 1;
        }
      }
      const topBehaviors = Object.entries(behaviorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([b]) => b);

      // Build AI summary prompt
      const logsText = logs.map(l =>
        `Date: ${l.log_date}, Mood: ${l.overall_mood || 'N/A'}, Practiced: ${l.practice_done ? 'Yes' : 'No'} (${l.duration_minutes || 0} min), Behaviors: ${(l.behaviors_observed || []).join(', ') || 'none noted'}, Notes: "${l.notes || ''}"`
      ).join('\n');

      const prompt = `You are an expert dog trainer assistant reviewing a client's weekly behavior log for their dog "${dogName || 'their dog'}".

Weekly logs:
${logsText}

Stats: ${logs.length} logs, ${practiceDays} practice days, ${totalMinutes} total practice minutes.
Mood distribution: ${JSON.stringify(moodBreakdown)}
Top behaviors: ${topBehaviors.join(', ')}

Write a concise, encouraging weekly trend summary (3–4 sentences) for the client. Highlight: 1) Overall progress trend, 2) Key behavior patterns, 3) One specific actionable recommendation for next week. Be warm and specific to the data provided.`;

      let aiSummary = "";
      try {
        aiSummary = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
      } catch (e) {
        aiSummary = `This week ${dogName || 'your dog'} had ${logs.length} logged sessions with ${practiceDays} practice days. Keep up the consistent work!`;
      }

      // Save the report
      await base44.asServiceRole.entities.WeeklyReport.create({
        client_email: clientEmail,
        dog_name: dogName || undefined,
        week_start: weekStart,
        week_end: weekEnd,
        total_logs: logs.length,
        practice_days: practiceDays,
        total_practice_minutes: totalMinutes,
        mood_breakdown: moodBreakdown,
        top_behaviors: topBehaviors,
        ai_summary: aiSummary,
      });

      // Send email to client
      try {
        const moodEmoji = {
          great: "🌟", good: "😊", neutral: "😐", rough: "😔", very_rough: "😣"
        };
        const dominantMood = Object.entries(moodBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0];

        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: "Omar's Dog Training™",
          to: clientEmail,
          subject: `📊 Your weekly training report is ready${dogName ? ` — ${dogName}` : ''}`,
          body: `
<div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #1a3a3a; padding: 28px 32px; border-radius: 12px 12px 0 0;">
    <div style="font-size: 22px; font-weight: 900; color: #fff;">Omar's Dog Training™</div>
    <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Weekly Progress Report</div>
  </div>
  <div style="background: #fff; border: 1px solid #e8e0d8; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 20px; font-size: 18px; font-weight: 700;">
      ${dogName ? `${dogName}'s` : 'Your'} Week in Review ${dominantMood ? moodEmoji[dominantMood] : '🐾'}
    </p>

    <div style="display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: #faf8f5; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="font-size: 24px; font-weight: 900; color: #8B2E2E;">${logs.length}</div>
        <div style="font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Days Logged</div>
      </div>
      <div style="background: #faf8f5; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="font-size: 24px; font-weight: 900; color: #8B2E2E;">${practiceDays}</div>
        <div style="font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Practice Days</div>
      </div>
      <div style="background: #faf8f5; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="font-size: 24px; font-weight: 900; color: #8B2E2E;">${totalMinutes}</div>
        <div style="font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Total Minutes</div>
      </div>
    </div>

    ${topBehaviors.length > 0 ? `
    <p style="font-size: 13px; font-weight: 700; margin: 0 0 8px;">Focus areas this week:</p>
    <p style="margin: 0 0 20px; font-size: 13px; color: #555;">${topBehaviors.join(' · ')}</p>
    ` : ''}

    <div style="background: #f4f9f4; border-left: 4px solid #22c55e; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #16a34a; margin-bottom: 6px;">✨ AI Trend Analysis</div>
      <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.7;">${aiSummary}</p>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
      <a href="https://omarsdogtraining.com/my-dashboard" style="display: inline-block; background: #8B2E2E; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 50px;">
        View Full Report →
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #888; line-height: 1.6;">
      Keep up the great work! Consistency is everything. 🐾<br/>
      <strong>— Omar</strong> · (321) 830-6272
    </p>
  </div>
</div>`,
        });
      } catch (e) {
        errors.push({ email: clientEmail, emailError: e.message });
      }

      generated++;
    }

    return Response.json({
      generated,
      week: `${weekStart} to ${weekEnd}`,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated ${generated} weekly report(s).`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});