"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const INTERVAL_MS = 20000;

export function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function ping() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    ping();
    const interval = setInterval(ping, INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return null;
}
