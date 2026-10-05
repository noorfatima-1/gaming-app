import { Router } from "express";
import { getSupabase } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminAuth";
import { store } from "../store/RedisStore";

const router = Router();

// All admin routes require auth + admin check
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats - Dashboard stats
router.get("/stats", async (_req, res) => {
  try {
    const supabase = getSupabase();

    // Total users
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Games today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: gamesToday } = await supabase
      .from("game_results")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    // Total games
    const { count: totalGames } = await supabase
      .from("game_results")
      .select("*", { count: "exact", head: true });

    // Active rooms from store
    const activeRooms = store.getActiveRoomCount();

    res.json({
      totalUsers: userCount || 0,
      gamesToday: gamesToday || 0,
      totalGames: totalGames || 0,
      activeRooms,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/admin/users?page=1&limit=20
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const supabase = getSupabase();
    const { data, error, count } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    res.json({
      data: data || [],
      page,
      limit,
      total: count || 0,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/admin/games?page=1&limit=20
router.get("/games", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const supabase = getSupabase();
    const { data, error, count } = await supabase
      .from("game_results")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch games" });
    }

    res.json({
      data: data || [],
      page,
      limit,
      total: count || 0,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

export default router;
