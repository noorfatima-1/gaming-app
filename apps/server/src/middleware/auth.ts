import { Request, Response, NextFunction } from "express";
import { getSupabase } from "../lib/supabase";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

// Verifies Supabase JWT from Authorization header
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = { id: data.user.id, email: data.user.email || "" };
    next();
  } catch {
    return res.status(401).json({ error: "Authentication failed" });
  }
}

// Optional auth - sets req.user if valid token present, but doesn't require it
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser(token);
    if (data.user) {
      req.user = { id: data.user.id, email: data.user.email || "" };
    }
  } catch {
    // Ignore auth errors for optional auth
  }

  next();
}
