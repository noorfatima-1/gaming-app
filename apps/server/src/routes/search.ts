import { Router } from "express";
import { getSupabase } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { sanitizeString } from "../lib/validation";

const router = Router();

// GET /api/search/users?q=username
router.get("/users", requireAuth, async (req, res) => {
  try {
    const query = sanitizeString((req.query.q as string) || "", 30);
    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, level, is_online")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq("id", req.user!.id)
      .limit(20);

    if (error) {
      return res.status(500).json({ error: "Search failed" });
    }

    res.json(data || []);
  } catch {
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
