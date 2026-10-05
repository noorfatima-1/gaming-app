import { Router } from "express";
import { getSupabase } from "../lib/supabase";

const router = Router();

// GET /api/history/:userId?page=1&limit=20
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const supabase = getSupabase();

    const { data, error, count } = await supabase
      .from("player_scores")
      .select(`
        id,
        score,
        rank,
        created_at,
        game_results!inner (
          id,
          room_id,
          game_type,
          rounds,
          player_count,
          duration_seconds,
          created_at
        )
      `, { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch history" });
    }

    // Transform to flat structure
    const history = (data || []).map((row: any) => ({
      id: row.game_results.id,
      room_id: row.game_results.room_id,
      game_type: row.game_results.game_type,
      played_at: row.game_results.created_at,
      rounds: row.game_results.rounds,
      player_count: row.game_results.player_count,
      duration_seconds: row.game_results.duration_seconds,
      player_score: row.score,
      player_rank: row.rank,
    }));

    res.json({
      data: history,
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
