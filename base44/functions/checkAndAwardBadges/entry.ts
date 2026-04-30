import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_email } = await req.json();

    if (!client_email) {
      return Response.json({ error: 'Missing client_email' }, { status: 400 });
    }

    // Get active badges
    const badges = await base44.entities.Badge.filter({ is_active: true });

    // Get user's current badges
    const userBadges = await base44.entities.UserBadge.filter({ client_email });
    const earnedBadgeIds = new Set(userBadges.map(b => b.badge_id));

    // Get user data for checking conditions
    const [schedules, homework, logs, dogProfiles] = await Promise.all([
      base44.entities.TrainingSchedule.filter({ client_email }),
      base44.entities.HomeworkTask.filter({ client_email }),
      base44.entities.BehaviorLog.filter({ client_email }),
      base44.entities.DogProfile.filter({ client_email }),
    ]);

    const newBadges = [];

    for (const badge of badges) {
      // Skip if already earned
      if (earnedBadgeIds.has(badge.id)) continue;

      let shouldAward = false;

      if (badge.trigger_type === 'session_count') {
        shouldAward = schedules.length >= badge.trigger_value;
      } else if (badge.trigger_type === 'vaccination_current') {
        // Check if all dogs have current vaccinations
        shouldAward = dogProfiles.length > 0 && dogProfiles.every(d => d.vaccination_current);
      } else if (badge.trigger_type === 'homework_streak') {
        // Check homework completion rate
        const completedHw = homework.filter(h => h.completed).length;
        shouldAward = homework.length > 0 && (completedHw / homework.length) >= 0.8;
      } else if (badge.trigger_type === 'behavior_improvement') {
        // Check if behavior logs show improvement
        const recentLogs = logs.slice(-10);
        const hasImprovement = recentLogs.some(l => l.overall_mood === 'great' || l.overall_mood === 'good');
        shouldAward = recentLogs.length > 0 && hasImprovement;
      }

      if (shouldAward) {
        // Award badge
        await base44.entities.UserBadge.create({
          client_email,
          badge_id: badge.id,
          badge_name: badge.name,
          earned_date: new Date().toISOString(),
          xp_earned: badge.xp_reward || 10,
        });

        // Award XP
        await base44.functions.invoke('updateUserXP', {
          client_email,
          xp_amount: badge.xp_reward || 10,
          reason: `Badge earned: ${badge.name}`,
        });

        newBadges.push({
          name: badge.name,
          icon: badge.icon,
          xp: badge.xp_reward || 10,
        });
      }
    }

    return Response.json({
      success: true,
      newBadgesCount: newBadges.length,
      newBadges,
    });
  } catch (error) {
    console.error('Badge check failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});