import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const XP_PER_LEVEL = 100; // XP needed to level up increases by 10% each level

function calculateXpForLevel(level) {
  return Math.floor(XP_PER_LEVEL * Math.pow(1.1, level - 1));
}

function calculateLevelFromXp(totalXp) {
  let level = 1;
  let xpUsed = 0;
  
  while (xpUsed + calculateXpForLevel(level) <= totalXp) {
    xpUsed += calculateXpForLevel(level);
    level++;
  }
  
  const xpInLevel = totalXp - xpUsed;
  const xpNeeded = calculateXpForLevel(level);
  const progress = Math.round((xpInLevel / xpNeeded) * 100);
  
  return { level, xpInLevel, progress };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_email, xp_amount, reason } = await req.json();

    if (!client_email || !xp_amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create user level record
    let userLevel = await base44.entities.UserLevel.filter({ client_email }).then(r => r[0]);
    
    if (!userLevel) {
      userLevel = await base44.entities.UserLevel.create({
        client_email,
        current_level: 1,
        total_xp: 0,
        xp_in_level: 0,
        level_progress_percent: 0,
      });
    }

    // Add XP
    const newTotalXp = userLevel.total_xp + xp_amount;
    const { level, xpInLevel, progress } = calculateLevelFromXp(newTotalXp);
    const leveledUp = level > userLevel.current_level;

    // Update user level
    await base44.entities.UserLevel.update(userLevel.id, {
      total_xp: newTotalXp,
      current_level: level,
      xp_in_level: xpInLevel,
      level_progress_percent: progress,
      last_level_up_date: leveledUp ? new Date().toISOString() : userLevel.last_level_up_date,
    });

    return Response.json({
      success: true,
      newLevel: level,
      newTotalXp,
      xpInLevel,
      progress,
      leveledUp,
      reason,
      message: leveledUp ? `🎉 Level up to ${level}!` : `+${xp_amount} XP`
    });
  } catch (error) {
    console.error('XP update failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});