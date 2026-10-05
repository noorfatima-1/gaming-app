import { getSupabase } from "./supabase";
import { XP_PER_LEVEL, XP_REWARDS } from "shared";

interface GameResult {
  userId: string;
  score: number;
  rank: number;
  gameType: string;
}

// Check and award achievements after a game ends
export async function checkAchievements(results: GameResult[]): Promise<void> {
  const supabase = getSupabase();

  for (const result of results) {
    if (!result.userId) continue;

    try {
      // Get user's current stats
      const { data: stats } = await supabase
        .from("player_scores")
        .select("id, score, rank")
        .eq("user_id", result.userId);

      const totalGames = stats?.length || 0;
      const totalWins = stats?.filter((s) => s.rank === 1).length || 0;
      const totalScore = stats?.reduce((sum, s) => sum + s.score, 0) || 0;

      // Get already unlocked achievements
      const { data: unlocked } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", result.userId);

      const unlockedIds = new Set((unlocked || []).map((a) => a.achievement_id));
      const newAchievements: string[] = [];

      // Check conditions
      if (totalGames >= 1 && !unlockedIds.has("first_game")) newAchievements.push("first_game");
      if (totalGames >= 10 && !unlockedIds.has("play_10")) newAchievements.push("play_10");
      if (totalGames >= 50 && !unlockedIds.has("play_50")) newAchievements.push("play_50");
      if (totalWins >= 1 && !unlockedIds.has("first_win")) newAchievements.push("first_win");
      if (totalWins >= 5 && !unlockedIds.has("win_5")) newAchievements.push("win_5");
      if (totalScore >= 500 && !unlockedIds.has("score_500")) newAchievements.push("score_500");
      if (totalScore >= 2000 && !unlockedIds.has("score_2000")) newAchievements.push("score_2000");

      // Award new achievements
      if (newAchievements.length > 0) {
        // Get achievement details for XP rewards
        const { data: achievementDefs } = await supabase
          .from("achievements")
          .select("*")
          .in("id", newAchievements);

        // Insert user achievements
        await supabase.from("user_achievements").insert(
          newAchievements.map((id) => ({
            user_id: result.userId,
            achievement_id: id,
          }))
        );

        // Calculate total XP from new achievements
        let bonusXp = 0;
        for (const def of achievementDefs || []) {
          bonusXp += def.xp_reward;

          // Create notification
          await supabase.from("notifications").insert({
            user_id: result.userId,
            type: "achievement",
            title: `Achievement Unlocked: ${def.name}`,
            body: def.description,
            data: { achievement_id: def.id, xp_reward: def.xp_reward },
          });
        }

        // Award XP from achievements
        if (bonusXp > 0) {
          await awardXP(result.userId, bonusXp);
        }
      }

      // Award game XP
      const gameXp = result.rank === 1 ? XP_REWARDS.GAME_WON : XP_REWARDS.GAME_PLAYED;
      await awardXP(result.userId, gameXp);
    } catch (err) {
      console.error(`Failed to check achievements for ${result.userId}:`, err);
    }
  }
}

async function awardXP(userId: string, amount: number): Promise<void> {
  const supabase = getSupabase();

  try {
    // Get current XP and level
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, level")
      .eq("id", userId)
      .single();

    if (!profile) return;

    let newXp = profile.xp + amount;
    let newLevel = profile.level;

    // Level up if needed
    while (newXp >= XP_PER_LEVEL) {
      newXp -= XP_PER_LEVEL;
      newLevel++;
    }

    await supabase
      .from("profiles")
      .update({ xp: newXp, level: newLevel })
      .eq("id", userId);
  } catch (err) {
    console.error(`Failed to award XP to ${userId}:`, err);
  }
}

// Check friend-related achievements
export async function checkFriendAchievement(userId: string): Promise<void> {
  const supabase = getSupabase();

  try {
    const { data: unlocked } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId)
      .eq("achievement_id", "make_friend");

    if (unlocked && unlocked.length > 0) return;

    const { data: friends } = await supabase
      .from("friendships")
      .select("id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .limit(1);

    if (friends && friends.length > 0) {
      await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: "make_friend",
      });

      const { data: achievement } = await supabase
        .from("achievements")
        .select("*")
        .eq("id", "make_friend")
        .single();

      if (achievement) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "achievement",
          title: `Achievement Unlocked: ${achievement.name}`,
          body: achievement.description,
          data: { achievement_id: achievement.id, xp_reward: achievement.xp_reward },
        });
        await awardXP(userId, achievement.xp_reward);
      }
    }
  } catch (err) {
    console.error(`Failed to check friend achievement for ${userId}:`, err);
  }
}
