import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, newStartTime, clientEmail } = await req.json();

    if (!eventId || !newStartTime) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const CONNECTOR_ID = '69f0c9bf39998d128b643a8e';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Reschedule on Calendly
    const rescheduleRes = await fetch(`https://api.calendly.com/scheduled_events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_time: newStartTime,
      }),
    });

    if (!rescheduleRes.ok) {
      const error = await rescheduleRes.text();
      console.error('Calendly reschedule error:', error);
      return Response.json({ error: 'Failed to reschedule session' }, { status: 400 });
    }

    const event = await rescheduleRes.json();

    // Update TrainingSession
    const sessions = await base44.entities.TrainingSession.filter({ 
      client_email: clientEmail || user.email 
    });

    const session = sessions.find(s => s.event_id === eventId);
    if (session) {
      const newDate = new Date(newStartTime);
      const newTime = newDate.toTimeString().slice(0, 5);
      
      await base44.entities.TrainingSession.update(session.id, {
        session_date: newDate.toISOString().split('T')[0],
        session_time: newTime,
      });
    }

    return Response.json({
      success: true,
      eventId,
      event: event.resource,
    });
  } catch (error) {
    console.error('rescheduleCalendlySession error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});