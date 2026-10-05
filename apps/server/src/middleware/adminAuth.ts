import { Request, Response, NextFunction } from "express";
import { getSupabase } from "../lib/supabase";

// Checks if the authenticated user has admin privileges
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", req.user.id)
      .single();

    if (error || !data?.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch {
    return res.status(500).json({ error: "Failed to verify admin status" });
  }
}
