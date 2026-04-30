import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MASTERY_LEVELS = {
  1: { name: "Novice", icon: "🌱", color: "green", description: "Just starting out" },
  2: { name: "Intermediate", icon: "📈", color: "blue", description: "Making progress" },
  3: { name: "Advanced", icon: "⭐", color: "purple", description: "Getting skilled" },
  4: { name: "Expert", icon: "🎯", color: "orange", description: "Highly proficient" },
  5: { name: "Master", icon: "👑", color: "gold", description: "Complete mastery" },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { clientEmail } = body;

    if (!clientEmail) {
      return Response.json({ error: "clientEmail required" }, { status: 400 });
    }

    // Fetch all behavior logs for the client (last 60 days)
    const logs = await base44.asServiceRole.entities.BehaviorLog.filter(
      { client_email: clientEmail },
      "-log_date",
      200
    );

    // Get existing mastery records
    const masteries = await base44.asServiceRole.entities.BehaviorMastery.filter(
      { client_email: clientEmail }
    );

    const milestones = [];
    const behaviors = new Set();

    // Extract unique behaviors from logs
    logs.forEach(log => {
      log.behaviors_observed?.forEach(b => behaviors.add(b));
    });

    // Check each behavior for milestones
    for (const behavior of behaviors) {
      const behaviorLogs = logs.filter(log =>
        log.behaviors_observed?.includes(behavior)
      );

      if (behaviorLogs.length === 0) continue;

      const existingMastery = masteries.find(
        m => m.behavior_name === behavior
      );

      // Calculate streak (consecutive days with this behavior)
      const sortedLogs = behaviorLogs.sort((a, b) =>
        new Date(b.log_date) - new Date(a.log_date)
      );

      let streak = 0;
      let currentDate = new Date();
      for (const log of sortedLogs) {
        const logDate = new Date(log.log_date);
        const diffDays = Math.floor(
          (currentDate - logDate) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === streak) {
          streak++;
          currentDate = logDate;
        } else {
          break;
        }
      }

      // Check for 7-day streak milestone
      if (streak >= 7) {
        const existing = await base44.asServiceRole.entities.BehaviorMilestone.filter({
          client_email: clientEmail,
          behavior_name: behavior,
          milestone_type: "7_day_streak",
        });

        if (existing.length === 0) {
          const milestone = await base44.asServiceRole.entities.BehaviorMilestone.create({
            client_email: clientEmail,
            behavior_name: behavior,
            milestone_type: "7_day_streak",
            consecutive_days: streak,
            earned_date: new Date().toISOString(),
            xp_earned: 50,
            description: `7-day logging streak for ${behavior}!`,
          });

          milestones.push(milestone);

          // Award XP
          const userLevels = await base44.asServiceRole.entities.UserLevel.filter({
            client_email: clientEmail,
          });
          if (userLevels.length > 0) {
            const userLevel = userLevels[0];
            await base44.asServiceRole.entities.UserLevel.update(userLevel.id, {
              total_xp: (userLevel.total_xp || 0) + 50,
            });
          }
        }
      }

      // Update or create mastery level
      const improvementScore = Math.min(
        100,
        (streak / 7) * 100 + (behaviorLogs.length / 2)
      );

      let masteryLevel = 1;
      if (streak >= 7) masteryLevel = 2;
      if (streak >= 14) masteryLevel = 3;
      if (streak >= 21) masteryLevel = 4;
      if (streak >= 30) masteryLevel = 5;

      if (existingMastery) {
        await base44.asServiceRole.entities.BehaviorMastery.update(
          existingMastery.id,
          {
            mastery_level: Math.max(existingMastery.mastery_level, masteryLevel),
            total_logs: behaviorLogs.length,
            streak_days: streak,
            improvement_score: improvementScore,
            last_logged: sortedLogs[0]?.log_date,
          }
        );
      } else {
        await base44.asServiceRole.entities.BehaviorMastery.create({
          client_email: clientEmail,
          behavior_name: behavior,
          mastery_level: masteryLevel,
          total_logs: behaviorLogs.length,
          streak_days: streak,
          improvement_score: improvementScore,
          unlocked_date: streak >= 7 ? new Date().toISOString() : null,
          last_logged: sortedLogs[0]?.log_date,
        });
      }
    }

    return Response.json({
      success: true,
      milestonesUnlocked: milestones.length,
      details: milestones,
    });
  } catch (error) {
    console.error("Error checking milestones:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});