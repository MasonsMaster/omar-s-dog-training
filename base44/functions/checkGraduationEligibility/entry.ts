import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Configuration
const REQUIRED_SESSIONS = 6; // Minimum sessions to graduate
const MINIMUM_RATING = 7.0; // Minimum average rating required

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active training schedules
    const schedules = await base44.asServiceRole.entities.TrainingSchedule.filter(
      { status: 'active' },
      '-created_date',
      500
    );

    const graduations = [];

    for (const schedule of schedules) {
      const clientEmail = schedule.client_email;

      // Get all completed sessions for this schedule
      const sessions = await base44.asServiceRole.entities.TrainingSession.filter(
        { schedule_id: schedule.id, completed: true },
        'session_date',
        100
      );

      if (sessions.length < REQUIRED_SESSIONS) {
        continue;
      }

      // Calculate average rating
      const sessionsWithRatings = sessions.filter(s => s.overall_session_rating);
      if (sessionsWithRatings.length === 0) continue;

      const avgRating =
        sessionsWithRatings.reduce((sum, s) => sum + s.overall_session_rating, 0) /
        sessionsWithRatings.length;

      if (avgRating < MINIMUM_RATING) {
        continue;
      }

      // Check if certificate already issued
      const existingCerts = await base44.asServiceRole.entities.GraduationCertificate.filter({
        client_email: clientEmail,
        dog_name: schedule.dog_name,
      });

      if (existingCerts.length > 0) {
        console.log(`Certificate already issued for ${clientEmail}`);
        continue;
      }

      // Get client info
      const users = await base44.asServiceRole.entities.User.filter(
        { email: clientEmail }
      );
      const clientName = users[0]?.full_name || clientEmail;

      // Generate and send certificate
      try {
        const certRes = await base44.asServiceRole.functions.invoke(
          'generateGraduationCertificate',
          {
            clientEmail,
            clientName,
            dogName: schedule.dog_name,
            sessionsCompleted: sessions.length,
            averageRating: avgRating,
          }
        );

        if (certRes.data.success) {
          graduations.push({
            client: clientEmail,
            dog: schedule.dog_name,
            sessions: sessions.length,
            avgRating: avgRating.toFixed(1),
          });

          console.log(
            `✓ Graduation certificate issued to ${clientEmail} for ${schedule.dog_name}`
          );
        }
      } catch (certError) {
        console.error(`Failed to issue certificate for ${clientEmail}:`, certError);
      }
    }

    return Response.json({
      success: true,
      graduations_issued: graduations.length,
      details: graduations,
      criteria: {
        min_sessions: REQUIRED_SESSIONS,
        min_average_rating: MINIMUM_RATING,
      },
    });
  } catch (error) {
    console.error('Error in checkGraduationEligibility:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});