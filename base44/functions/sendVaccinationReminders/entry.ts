import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { differenceInDays, parseISO } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all dog profiles
    const dogs = await base44.asServiceRole.entities.DogProfile.list('', 500);
    const sentNotifications = [];

    for (const dog of dogs) {
      if (!dog.vaccinations || dog.vaccinations.length === 0) continue;

      for (const vax of dog.vaccinations) {
        if (!vax.expiry_date) continue;

        const daysUntilExpiry = differenceInDays(parseISO(vax.expiry_date), new Date());

        // Send reminder 10 days before expiry
        if (daysUntilExpiry === 10 && daysUntilExpiry > 0) {
          const cacheKey = `vax-reminder-${dog.id}-${vax.name}-${vax.expiry_date}`;
          if (!localStorage.getItem(cacheKey)) {
            await base44.functions.invoke('sendPushNotification', {
              clientEmail: dog.client_email,
              title: 'Vaccination Expiring Soon',
              body: `${dog.name}'s ${vax.name} vaccination expires in 10 days`,
              type: 'vaccination_reminder',
              data: {
                dogName: dog.name,
                vaccination: vax.name,
                expiryDate: vax.expiry_date,
                url: '/account',
              },
              requireInteraction: true,
            });
            localStorage.setItem(cacheKey, 'sent');
            sentNotifications.push(`${dog.name} - ${vax.name}`);
          }
        }
      }
    }

    return Response.json({
      success: true,
      sent: sentNotifications.length,
      reminders: sentNotifications,
    });
  } catch (error) {
    console.error('Error sending vaccination reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});