import { Router } from "express";
import { getSupabase } from "../lib/supabase";

const router = Router();

// GET /api/leaderboard?game=draw-and-guess&limit=50
router.get("/", async (req, res) => {
  try {
    const game = (req.query.game as string) || "";
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const supabase = getSupabase();

    let query = supabase
      .from("player_stats")
      .select("*")
      .order("total_score", { ascending: false })
      .limit(limit);

    if (game) {
      query = query.eq("game_type", game);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }

    res.json(data || []);
  } catch {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
