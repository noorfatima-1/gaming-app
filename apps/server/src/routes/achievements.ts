import { Router } from "express";
import { getSupabase } from "../lib/supabase";

const router = Router();

// GET /api/achievements - Get all achievement definitions
router.get("/", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("category");

    if (error) {
      return res.status(500).json({ error: "Failed to fetch achievements" });
    }

    res.json(data || []);
  } catch {
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

// GET /api/achievements/:userId - Get user's unlocked achievements
router.get("/:userId", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_achievements")
      .select(`
        achievement_id,
        unlocked_at,
        achievement:achievements (*)
      `)
      .eq("user_id", req.params.userId)
      .order("unlocked_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch user achievements" });
    }

    res.json(data || []);
  } catch {
    res.status(500).json({ error: "Failed to fetch user achievements" });
  }
});

export default router;
