import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { report_id } = await req.json();
    if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });

    const report = await base44.asServiceRole.entities.WeeklyReport.get(report_id);
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

    const { client_email, dog_name, week_start, week_end, total_logs, practice_days,
            total_practice_minutes, top_behaviors, ai_summary, trainer_notes, mood_breakdown } = report;

    const moodEmoji = { great: "🌟", good: "😊", neutral: "😐", rough: "😔", very_rough: "😣" };
    const dominantMood = mood_breakdown
      ? Object.entries(mood_breakdown).sort((a, b) => b[1] - a[1])[0]?.[0]
      : null;

    const body = `
<div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #1a3a3a; padding: 28px 32px; border-radius: 12px 12px 0 0;">
    <div style="font-size: 22px; font-weight: 900; color: #fff;">Omar's Dog Training™</div>
    <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Weekly Progress Report</div>
  </div>
  <div style="background: #fff; border: 1px solid #e8e0d8; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 20px; font-size: 18px; font-weight: 700;">
      ${dog_name ? `${dog_name}'s` : 'Your'} Week in Review ${dominantMood ? moodEmoji[dominantMood] : '🐾'}
    </p>
    <p style="margin: 0 0 8px; font-size: 13px; color: #888;">Week of ${week_start} – ${week_end}</p>

    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
      <div style="flex:1; background: #faf8f5; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="font-size: 24px; font-weight: 900; color: #8B2E2E;">${total_logs || 0}</div>
        <div style="font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Days Logged</div>
      </div>
      <div style="flex:1; background: #faf8f5; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="font-size: 24px; font-weight: 900; color: #8B2E2E;">${practice_days || 0}</div>
        <div style="font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Practice Days</div>
      </div>
      <div style="flex:1; background: #faf8f5; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="font-size: 24px; font-weight: 900; color: #8B2E2E;">${total_practice_minutes || 0}</div>
        <div style="font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Total Minutes</div>
      </div>
    </div>

    ${(top_behaviors || []).length > 0 ? `
    <p style="font-size: 13px; font-weight: 700; margin: 0 0 8px;">Focus areas this week:</p>
    <p style="margin: 0 0 20px; font-size: 13px; color: #555;">${top_behaviors.join(' · ')}</p>
    ` : ''}

    <div style="background: #f4f9f4; border-left: 4px solid #22c55e; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: ${trainer_notes ? '20px' : '24px'};">
      <div style="font-size: 12px; font-weight: 700; color: #16a34a; margin-bottom: 6px;">✨ Weekly Analysis</div>
      <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.7;">${ai_summary || ''}</p>
    </div>

    ${trainer_notes ? `
    <div style="background: #faf8f5; border-left: 4px solid #8B2E2E; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #8B2E2E; margin-bottom: 6px;">📋 Trainer Notes from Omar</div>
      <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.7;">${trainer_notes}</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin-bottom: 20px;">
      <a href="https://omarsdogtraining.com/my-dashboard" style="display: inline-block; background: #8B2E2E; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 50px;">
        View My Dashboard →
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #888; line-height: 1.6;">
      Keep up the great work — consistency is everything! 🐾<br/>
      <strong>— Omar</strong> · (321) 830-6272
    </p>
  </div>
</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: "Omar's Dog Training™",
      to: client_email,
      subject: `📊 Your weekly training report${dog_name ? ` — ${dog_name}` : ''} (${week_start})`,
      body,
    });

    return Response.json({ success: true, sent_to: client_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});