import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { subDays, parseISO, differenceInDays } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all user levels
    const userLevels = await base44.asServiceRole.entities.UserLevel.list(undefined, 1000);
    console.log(`Calculating streaks for ${userLevels.length} users`);

    let updated = 0;

    for (const userLevel of userLevels) {
      try {
        const clientEmail = userLevel.client_email;

        // Get all behavior logs for this client from past 90 days
        const thirtyDaysAgo = subDays(new Date(), 90);
        const logs = await base44.asServiceRole.entities.BehaviorLog.filter({
          client_email: clientEmail
        }, "-log_date", 500);

        const recentLogs = logs.filter(log => {
          const logDate = parseISO(log.log_date);
          return logDate >= thirtyDaysAgo;
        });

        if (recentLogs.length === 0) {
          // No recent activity, reset streak
          await base44.asServiceRole.entities.UserLevel.update(userLevel.id, {
            current_streak: 0,
            last_activity_date: null,
          });
          continue;
        }

        // Sort logs by date (newest first)
        const sortedLogs = recentLogs.sort((a, b) => 
          parseISO(b.log_date).getTime() - parseISO(a.log_date).getTime()
        );

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
          const checkDate = subDays(today, i);
          checkDate.setHours(0, 0, 0, 0);
          
          const hasLogOnDate = sortedLogs.some(log => {
            const logDate = parseISO(log.log_date);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === checkDate.getTime();
          });

          if (hasLogOnDate) {
            currentStreak++;
          } else if (i > 0) {
            // Streak broken (but allow today to be empty)
            break;
          }
        }

        // Get longest streak ever
        let longestStreak = currentStreak;
        let tempStreak = 0;
        const allLogs = await base44.asServiceRole.entities.BehaviorLog.filter({
          client_email: clientEmail
        }, "-log_date", 1000);

        const sortedAllLogs = allLogs.sort((a, b) =>
          parseISO(b.log_date).getTime() - parseISO(a.log_date).getTime()
        );

        for (let i = 0; i < 365; i++) {
          const checkDate = subDays(today, i);
          checkDate.setHours(0, 0, 0, 0);
          
          const hasLogOnDate = sortedAllLogs.some(log => {
            const logDate = parseISO(log.log_date);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === checkDate.getTime();
          });

          if (hasLogOnDate) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }

        // Update user level
        const lastActivityDate = sortedLogs[0]?.log_date;
        await base44.asServiceRole.entities.UserLevel.update(userLevel.id, {
          current_streak: currentStreak,
          longest_streak: Math.max(userLevel.longest_streak || 0, longestStreak),
          last_activity_date: lastActivityDate,
        });

        updated++;
        console.log(`✓ ${clientEmail}: streak=${currentStreak}, longest=${Math.max(userLevel.longest_streak || 0, longestStreak)}`);
      } catch (error) {
        console.error(`✗ Error processing ${userLevel.client_email}:`, error.message);
      }
    }

    return Response.json({
      message: `Updated streaks for ${updated} users`,
      total: userLevels.length,
    });
  } catch (error) {
    console.error("Streak calculation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});