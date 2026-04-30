import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, clientEmail } = await req.json();

    if (!eventId) {
      return Response.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const CONNECTOR_ID = '69f0c9bf39998d128b643a8e';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Cancel on Calendly
    const cancelRes = await fetch(`https://api.calendly.com/scheduled_events/${eventId}/cancellation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Client requested cancellation',
      }),
    });

    if (!cancelRes.ok && cancelRes.status !== 204) {
      const error = await cancelRes.text();
      console.error('Calendly cancel error:', error);
      return Response.json({ error: 'Failed to cancel session' }, { status: 400 });
    }

    // Update TrainingSession to mark as cancelled
    const sessions = await base44.entities.TrainingSession.filter({ 
      client_email: clientEmail || user.email 
    });

    const session = sessions.find(s => s.event_id === eventId);
    if (session) {
      await base44.entities.TrainingSession.update(session.id, {
        completed: false,
        status: 'cancelled',
      });
    }

    return Response.json({
      success: true,
      eventId,
      message: 'Session cancelled successfully',
    });
  } catch (error) {
    console.error('cancelCalendlySession error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});