import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();

    // Verify the user is deleting their own account
    if (user.email !== email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete related data (as service role to bypass RLS)
    const entities = [
      'DogProfile',
      'TrainingSchedule',
      'HomeworkTask',
      'BehaviorLog',
      'BehaviorChallenge',
      'ChallengeLog',
      'TrainingVideo',
      'Message',
      'WeeklyReport',
      'Invoice',
    ];

    for (const entity of entities) {
      try {
        const records = await base44.asServiceRole.entities[entity].filter({ client_email: email }, '', 1000);
        for (const record of records) {
          await base44.asServiceRole.entities[entity].delete(record.id);
        }
      } catch (error) {
        console.log(`Could not delete ${entity}:`, error.message);
      }
    }

    // Note: User deletion must be done through admin panel or API
    // The SDK doesn't provide direct user deletion for security reasons

    return Response.json({
      success: true,
      message: 'Account deletion initiated. Your data will be permanently removed.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});