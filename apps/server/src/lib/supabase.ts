import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
    console.log("Initializing Supabase with URL:", supabaseUrl ? "SET" : "MISSING");
    _supabase = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        transport: ws as any,
      },
    });
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
