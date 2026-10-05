import { Router } from "express";
import { getSupabase } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/friends - Get user's friends and pending requests
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const supabase = getSupabase();

    // Get all friendships where user is involved
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        requester:profiles!friendships_requester_id_fkey (
          id, username, display_name, avatar_url, level, is_online
        ),
        addressee:profiles!friendships_addressee_id_fkey (
          id, username, display_name, avatar_url, level, is_online
        )
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch friends" });
    }

    // Transform: attach the "other" user as "friend"
    const friendships = (data || []).map((f: any) => ({
      id: f.id,
      requester_id: f.requester_id,
      addressee_id: f.addressee_id,
      status: f.status,
      created_at: f.created_at,
      friend: f.requester_id === userId ? f.addressee : f.requester,
    }));

    res.json(friendships);
  } catch {
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// POST /api/friends - Send friend request
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { addressee_id } = req.body;

    if (!addressee_id || addressee_id === userId) {
      return res.status(400).json({ error: "Invalid friend request" });
    }

    const supabase = getSupabase();

    // Check if friendship already exists (in either direction)
    const { data: existing } = await supabase
      .from("friendships")
      .select("id, status")
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${userId})`
      );

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Friend request already exists" });
    }

    const { data, error } = await supabase
      .from("friendships")
      .insert({ requester_id: userId, addressee_id })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to send friend request" });
    }

    // Create notification for the addressee
    await supabase.from("notifications").insert({
      user_id: addressee_id,
      type: "friend_request",
      title: "New Friend Request",
      body: "Someone wants to be your friend!",
      data: { friendship_id: data.id, from_user_id: userId },
    });

    res.status(201).json(data);
  } catch {
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// PATCH /api/friends/:id - Accept/decline friend request
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'declined'" });
    }

    const supabase = getSupabase();

    // Verify the user is the addressee (only they can accept/decline)
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (!friendship) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (friendship.addressee_id !== req.user!.id) {
      return res.status(403).json({ error: "Only the recipient can respond to a friend request" });
    }

    const { data, error } = await supabase
      .from("friendships")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to update friend request" });
    }

    // If accepted, create achievement check for both users
    if (status === "accepted") {
      // Notify the requester
      await supabase.from("notifications").insert({
        user_id: friendship.requester_id,
        type: "friend_request",
        title: "Friend Request Accepted",
        body: "Your friend request was accepted!",
        data: { friendship_id: data.id },
      });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to update friend request" });
  }
});

export default router;
