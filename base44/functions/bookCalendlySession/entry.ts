import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventTypeId, startTime, clientEmail } = await req.json();

    if (!eventTypeId || !startTime) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const CONNECTOR_ID = '69f0c9bf39998d128b643a8e';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Create Calendly event
    const bookingRes = await fetch('https://api.calendly.com/scheduled_events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: `https://api.calendly.com/event_types/${eventTypeId}`,
        start_time: startTime,
        invitees: [{ email: clientEmail || user.email, name: user.full_name }],
      }),
    });

    if (!bookingRes.ok) {
      const error = await bookingRes.text();
      console.error('Calendly booking error:', error);
      return Response.json({ error: 'Failed to book session' }, { status: 400 });
    }

    const event = await bookingRes.json();
    const eventId = event.resource.id;

    // Sync to TrainingSchedule
    const schedules = await base44.entities.TrainingSchedule.filter({ client_email: clientEmail || user.email });
    const schedule = schedules[0];

    if (schedule) {
      await base44.entities.TrainingSchedule.update(schedule.id, {
        sessions_total: (schedule.sessions_total || 0) + 1,
      });
    } else {
      // Create new schedule if none exists
      await base44.entities.TrainingSchedule.create({
        client_email: clientEmail || user.email,
        program: '1-on-1 Coaching',
        start_date: new Date(startTime).toISOString().split('T')[0],
        sessions_total: 1,
        sessions_completed: 0,
        status: 'active',
      });
    }

    // Create TrainingSession record
    const sessionDate = new Date(startTime);
    const sessionTime = sessionDate.toTimeString().slice(0, 5);

    const session = await base44.entities.TrainingSession.create({
      client_email: clientEmail || user.email,
      schedule_id: schedule?.id,
      session_date: sessionDate.toISOString().split('T')[0],
      session_time: sessionTime,
      duration_minutes: 60,
      completed: false,
    });

    return Response.json({
      success: true,
      eventId,
      sessionId: session.id,
      event: event.resource,
    });
  } catch (error) {
    console.error('bookCalendlySession error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});