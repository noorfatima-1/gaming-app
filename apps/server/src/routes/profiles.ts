import { Router } from "express";
import { getSupabase } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { sanitizeString } from "../lib/validation";

const router = Router();

// GET /api/profiles/:id - Get public profile
router.get("/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, level, xp, coins, is_online, last_seen, created_at")
      .eq("id", req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /api/profiles/me - Update own profile
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { display_name, bio, avatar_url } = req.body;
    const updates: Record<string, unknown> = {};

    if (display_name !== undefined) {
      const clean = sanitizeString(display_name, 30);
      if (!clean || clean.length < 1) {
        return res.status(400).json({ error: "Display name must be 1-30 characters" });
      }
      updates.display_name = clean;
      updates.username = clean;
    }

    if (bio !== undefined) {
      updates.bio = sanitizeString(bio, 200);
    }

    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.user!.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to update profile" });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// DELETE /api/profiles/me - Delete own account and all data
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user!.id;

    // Delete user data from all tables (cascades handle most via FK)
    await supabase.from("notifications").delete().eq("user_id", userId);
    await supabase.from("user_achievements").delete().eq("user_id", userId);
    await supabase.from("friendships").delete().or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    await supabase.from("player_scores").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);

    // Delete the auth user via admin API
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Failed to delete auth user:", error.message);
      return res.status(500).json({ error: "Failed to delete account" });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// POST /api/profiles/me/avatar - Upload avatar
router.post("/me/avatar", requireAuth, async (req, res) => {
  try {
    const { avatar_data, content_type } = req.body;
    if (!avatar_data || !content_type) {
      return res.status(400).json({ error: "Missing avatar_data or content_type" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(content_type)) {
      return res.status(400).json({ error: "Invalid image type. Use JPEG, PNG, or WebP." });
    }

    const supabase = getSupabase();
    const userId = req.user!.id;
    const ext = content_type.split("/")[1];
    const filePath = `${userId}/avatar.${ext}`;

    // Decode base64
    const buffer = Buffer.from(avatar_data, "base64");

    // Max 2MB
    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Max 2MB." });
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, { contentType: content_type, upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError.message);
      return res.status(500).json({ error: "Failed to upload avatar" });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatar_url = urlData.publicUrl;

    // Update profile
    await supabase.from("profiles").update({ avatar_url }).eq("id", userId);

    res.json({ avatar_url });
  } catch {
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

export default router;
