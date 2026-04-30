import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { client_email, dog_name, week_start, week_end } = await req.json();
    if (!client_email || !week_start || !week_end) {
      return Response.json({ error: 'client_email, week_start, week_end required' }, { status: 400 });
    }

    // Fetch behavior logs for this client/dog/week
    const allLogs = await base44.asServiceRole.entities.BehaviorLog.filter({ client_email });
    const logs = allLogs.filter(l => l.log_date >= week_start && l.log_date <= week_end &&
      (!dog_name || l.dog_name === dog_name));

    if (logs.length === 0) {
      return Response.json({ error: 'No behavior logs found for this period.' }, { status: 404 });
    }

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
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([b]) => b);

    const logsText = logs.map(l =>
      `Date: ${l.log_date}, Mood: ${l.overall_mood || 'N/A'}, Practiced: ${l.practice_done ? 'Yes' : 'No'} (${l.duration_minutes || 0} min), Behaviors: ${(l.behaviors_observed || []).join(', ') || 'none noted'}, Notes: "${l.notes || ''}"`
    ).join('\n');

    const prompt = `You are an expert dog trainer assistant reviewing a client's weekly behavior log for their dog "${dog_name || 'their dog'}".

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
      aiSummary = `This week ${dog_name || 'your dog'} had ${logs.length} logged sessions with ${practiceDays} practice days. Keep up the consistent work!`;
    }

    // Check if report already exists — update or create
    const existing = await base44.asServiceRole.entities.WeeklyReport.filter({ client_email, week_start });
    let report;
    if (existing.length > 0) {
      report = await base44.asServiceRole.entities.WeeklyReport.update(existing[0].id, {
        dog_name: dog_name || undefined,
        week_end,
        total_logs: logs.length,
        practice_days: practiceDays,
        total_practice_minutes: totalMinutes,
        mood_breakdown: moodBreakdown,
        top_behaviors: topBehaviors,
        ai_summary: aiSummary,
      });
      report = { ...existing[0], ai_summary: aiSummary, total_logs: logs.length, practice_days: practiceDays, total_practice_minutes: totalMinutes, top_behaviors: topBehaviors };
    } else {
      report = await base44.asServiceRole.entities.WeeklyReport.create({
        client_email,
        dog_name: dog_name || undefined,
        week_start,
        week_end,
        total_logs: logs.length,
        practice_days: practiceDays,
        total_practice_minutes: totalMinutes,
        mood_breakdown: moodBreakdown,
        top_behaviors: topBehaviors,
        ai_summary: aiSummary,
      });
    }

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});