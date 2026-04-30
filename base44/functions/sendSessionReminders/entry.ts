import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { addHours, subHours, isBefore, parseISO } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active training schedules
    const schedules = await base44.asServiceRole.entities.TrainingSchedule.filter({
      status: 'active',
    });

    const now = new Date();
    const reminders24h = [];
    const reminders1h = [];

    for (const schedule of schedules) {
      if (!schedule.start_date) continue;

      const sessionDate = parseISO(schedule.start_date);
      const in24Hours = addHours(now, 24);
      const in1Hour = addHours(now, 1);
      const justAfter = addHours(now, 0.5);

      // Check for 24-hour reminder
      if (isBefore(sessionDate, in24Hours) && isBefore(now, sessionDate)) {
        if (!localStorage.getItem(`reminder-24h-${schedule.id}`)) {
          reminders24h.push(schedule);
        }
      }

      // Check for 1-hour reminder
      if (isBefore(sessionDate, in1Hour) && isBefore(justAfter, sessionDate)) {
        if (!localStorage.getItem(`reminder-1h-${schedule.id}`)) {
          reminders1h.push(schedule);
        }
      }
    }

    // Send 24-hour reminders
    for (const schedule of reminders24h) {
      await base44.functions.invoke('sendPushNotification', {
        clientEmail: schedule.client_email,
        title: 'Upcoming Training Session',
        body: `${schedule.dog_name || 'Your dog'}'s training session is in 24 hours`,
        type: 'session_reminder_24h',
        data: {
          scheduleId: schedule.id,
          url: '/my-dashboard',
        },
      });
      localStorage.setItem(`reminder-24h-${schedule.id}`, 'sent');
    }

    // Send 1-hour reminders
    for (const schedule of reminders1h) {
      await base44.functions.invoke('sendPushNotification', {
        clientEmail: schedule.client_email,
        title: 'Training Session Starting Soon',
        body: `Your training session starts in 1 hour!`,
        type: 'session_reminder_1h',
        data: {
          scheduleId: schedule.id,
          url: '/my-dashboard',
        },
        requireInteraction: true,
      });
      localStorage.setItem(`reminder-1h-${schedule.id}`, 'sent');
    }

    return Response.json({
      success: true,
      sent24h: reminders24h.length,
      sent1h: reminders1h.length,
    });
  } catch (error) {
    console.error('Error sending session reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});