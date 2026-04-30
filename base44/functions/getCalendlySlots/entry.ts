import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("calendly");

    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // Get current user URI
    const meRes = await fetch("https://api.calendly.com/users/me", { headers });
    const meData = await meRes.json();
    const userUri = meData.resource?.uri;
    if (!userUri) return Response.json({ error: "Could not get Calendly user" }, { status: 500 });

    // Get event types
    const etRes = await fetch(`https://api.calendly.com/event_types?user=${encodeURIComponent(userUri)}&active=true`, { headers });
    const etData = await etRes.json();
    const eventTypes = (etData.collection || []).filter(et => et.active);

    // For each active event type, fetch available slots for the next 7 days
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60 * 1000); // +5 min buffer
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

    const results = await Promise.all(
      eventTypes.map(async (et) => {
        const params = new URLSearchParams({
          event_type: et.uri,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        });
        const avRes = await fetch(`https://api.calendly.com/event_type_available_times?${params}`, { headers });
        const avData = await avRes.json();
        return {
          id: et.uri,
          name: et.name,
          duration: et.duration,
          description: et.description_plain,
          booking_url: et.scheduling_url,
          color: et.color,
          slots: (avData.collection || []).slice(0, 20).map(s => ({
            start_time: s.start_time,
            invitees_remaining: s.invitees_remaining,
          })),
        };
      })
    );

    return Response.json({ event_types: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});