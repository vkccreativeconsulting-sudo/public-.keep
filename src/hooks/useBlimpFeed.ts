"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlimpApiResponse } from "@/lib/aircraft/types";

export interface FeedState {
  data: BlimpApiResponse | null;
  error: string | null;
  fetching: boolean;
  lastFetchedAt: number | null;
  consecutiveFailures: number;
}

/**
 * Polls /api/blimp. Pauses while the tab is hidden, backs off on failures,
 * and refetches immediately when the tab becomes visible again.
 */
export function useBlimpFeed(pollMs: number, demo: boolean) {
  const [state, setState] = useState<FeedState>({ data: null, error: null, fetching: false, lastFetchedAt: null, consecutiveFailures: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failures = useRef(0);
  const alive = useRef(true);

  const schedule = useCallback(
    (delay: number, run: () => void) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(run, delay);
    },
    [],
  );

  const load = useCallback(async () => {
    if (!alive.current) return;
    setState((s) => ({ ...s, fetching: true }));
    let nextDelay = pollMs;
    try {
      const res = await fetch(`/api/blimp${demo ? "?demo=1" : ""}`, { cache: "no-store", headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const json = (await res.json()) as BlimpApiResponse;
      failures.current = 0;
      nextDelay = Math.max(pollMs, Math.min(json.nextPollMs || pollMs, 60_000));
      if (!alive.current) return;
      setState({ data: json, error: null, fetching: false, lastFetchedAt: Date.now(), consecutiveFailures: 0 });
    } catch (err) {
      failures.current += 1;
      nextDelay = Math.min(pollMs * 2 ** Math.min(failures.current, 3), 90_000);
      if (!alive.current) return;
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "network error", fetching: false, consecutiveFailures: failures.current }));
    } finally {
      if (alive.current && document.visibilityState !== "hidden") schedule(nextDelay, load);
    }
  }, [demo, pollMs, schedule]);

  useEffect(() => {
    alive.current = true;
    void load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
      else if (timer.current) clearTimeout(timer.current);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive.current = false;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  return { ...state, refresh: load };
}
