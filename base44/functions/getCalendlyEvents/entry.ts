import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f0c9bf39998d128b643a8e";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Get current user info
    const meRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const meData = await meRes.json();
    const userUri = meData.resource?.uri;
    if (!userUri) return Response.json({ events: [] });

    // Fetch scheduled events for the next 60 days
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const eventsRes = await fetch(
      `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${now.toISOString()}&max_start_time=${future.toISOString()}&status=active&count=20`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const eventsData = await eventsRes.json();
    const events = eventsData.collection || [];

    // Fetch invitee details for each event (limited to first 10)
    const enriched = await Promise.all(
      events.slice(0, 10).map(async (evt) => {
        try {
          const invRes = await fetch(`${evt.uri}/invitees`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const invData = await invRes.json();
          return { ...evt, invitees: invData.collection || [] };
        } catch {
          return { ...evt, invitees: [] };
        }
      })
    );

    return Response.json({ events: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});