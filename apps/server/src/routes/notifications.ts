import { Router } from "express";
import { getSupabase } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/notifications - Get user's notifications
router.get("/", requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }

    res.json(data || []);
  } catch {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", req.params.id)
      .eq("user_id", req.user!.id);

    if (error) {
      return res.status(500).json({ error: "Failed to mark notification as read" });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", req.user!.id)
      .eq("is_read", false);

    if (error) {
      return res.status(500).json({ error: "Failed to mark all as read" });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

export default router;
