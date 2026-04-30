import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f0c9bf39998d128b643a8e";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled/admin job — verify admin or allow service role context
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the Calendly access token from the shared connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("calendly");

    // Fetch the Calendly user URI
    const meRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const meData = await meRes.json();
    const userUri = meData.resource?.uri;
    if (!userUri) return Response.json({ sent: 0, message: 'Could not resolve Calendly user' });

    // Fetch events in the 23–25 hour window from now
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const eventsRes = await fetch(
      `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${windowStart.toISOString()}&max_start_time=${windowEnd.toISOString()}&status=active&count=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const eventsData = await eventsRes.json();
    const events = eventsData.collection || [];

    if (events.length === 0) {
      return Response.json({ sent: 0, message: 'No upcoming appointments in the 24-hour window.' });
    }

    let sent = 0;
    const errors = [];

    for (const evt of events) {
      // Fetch invitees for this event
      const invRes = await fetch(`${evt.uri}/invitees`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const invData = await invRes.json();
      const invitees = invData.collection || [];

      for (const invitee of invitees) {
        if (!invitee.email) continue;

        const sessionTime = new Date(evt.start_time);
        const dateStr = sessionTime.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          timeZone: 'America/New_York'
        });
        const timeStr = sessionTime.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short'
        });

        const locationType = evt.location?.type || '';
        const locationLine = locationType === 'physical'
          ? `📍 <strong>Location:</strong> ${evt.location?.location || 'Animal Wellness World, Merritt Island'}`
          : locationType === 'outbound_call' || locationType === 'inbound_call'
          ? `📞 <strong>Format:</strong> Phone Call`
          : `💻 <strong>Format:</strong> Virtual Session`;

        const body = `
<div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #8B2E2E; padding: 28px 32px; border-radius: 12px 12px 0 0;">
    <div style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.5px;">Omar's Dog Training™</div>
    <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Session Reminder</div>
  </div>

  <div style="background: #fff; border: 1px solid #e8e0d8; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700;">Hey ${invitee.name?.split(' ')[0] || 'there'}! 👋</p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">
      Your training session with Omar is coming up <strong>tomorrow</strong>. Here's everything you need to know:
    </p>

    <div style="background: #faf8f5; border: 1px solid #e8e0d8; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
      <div style="margin-bottom: 10px; font-size: 14px;">📅 <strong>Date:</strong> ${dateStr}</div>
      <div style="margin-bottom: 10px; font-size: 14px;">⏰ <strong>Time:</strong> ${timeStr}</div>
      <div style="margin-bottom: 0; font-size: 14px;">${locationLine}</div>
    </div>

    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #333;">Before your session:</p>
    <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
      <li>Make sure your dog has been walked and isn't overly hungry</li>
      <li>Bring high-value treats your dog loves</li>
      <li>Have your slip lead ready</li>
      <li>Review any homework tasks from your dashboard</li>
    </ul>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://omarsdogtraining.com/my-dashboard" style="display: inline-block; background: #8B2E2E; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 50px;">
        View My Dashboard →
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #888; line-height: 1.6;">
      Need to reschedule? Reply to this email or call <strong>(321) 830-6272</strong> as soon as possible.<br/>
      See you tomorrow! 🐾 <strong>— Omar</strong>
    </p>
  </div>
</div>`;

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: "Omar's Dog Training™",
            to: invitee.email,
            subject: `⏰ Reminder: Your training session is tomorrow at ${timeStr}`,
            body,
          });
          sent++;
        } catch (e) {
          errors.push({ email: invitee.email, error: e.message });
        }
      }
    }

    return Response.json({
      sent,
      events_checked: events.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Sent ${sent} reminder email(s) for ${events.length} upcoming session(s).`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});