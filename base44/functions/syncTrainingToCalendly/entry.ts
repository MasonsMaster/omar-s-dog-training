import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { schedule } = await req.json();
    if (!schedule || !schedule.dog_name || !schedule.program || !schedule.start_date) {
      return Response.json({ error: 'Missing schedule data' }, { status: 400 });
    }

    // Get Calendly connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('calendly');

    // Fetch user's Calendly ID
    const userRes = await fetch('https://api.calendly.com/users/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const userData = await userRes.json();
    const calendarUrl = userData.resource?.calendar_url;

    if (!calendarUrl) {
      return Response.json({ error: 'Calendar URL not found' }, { status: 400 });
    }

    // Create event
    const startDate = new Date(schedule.start_date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const eventRes = await fetch('https://api.calendly.com/scheduled_events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: calendarUrl,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        invitees_counter: {
          limit: 1
        }
      })
    });

    if (!eventRes.ok) {
      console.error('Calendly event creation failed:', await eventRes.text());
      return Response.json({ 
        error: 'Failed to create Calendly event',
        calendlyError: await eventRes.text()
      }, { status: 500 });
    }

    const eventData = await eventRes.json();
    
    return Response.json({ 
      success: true,
      event: eventData.resource,
      scheduleName: `${schedule.dog_name} - ${schedule.program}`
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});