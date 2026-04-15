"use client";

/**
 * useFavorites — lightweight result-selection hook.
 *
 * Storage: localStorage["aisaas_favorites_v1"]
 * Schema:  Record<groupKey, jobId>
 *          groupKey = "${moduleName}::${inputPayload}"
 *
 * Semantics: one "chosen" variation per prompt family.
 *   - isFavorite(gk, id)   → is this job the chosen one for its group?
 *   - getFavoriteJobId(gk)  → which job is chosen for this group? (null if none)
 *   - toggleFavorite(gk, id) → select this job (deselects if already selected)
 *
 * Migration path: when the backend adds a PATCH /api/jobs/{id}/pin endpoint,
 * replace the localStorage read/write inside this file. The hook API stays identical,
 * and NO UI component needs to change.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "aisaas_favorites_v1";

// groupKey → jobId: the user's "chosen" variation for each prompt family.
type Store = Record<string, string>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore — storage might be disabled (private mode, quota exceeded).
  }
}

export function useFavorites() {
  // Start empty to avoid SSR/hydration mismatch.
  // After mount, read actual localStorage data.
  const [store, setStore] = useState<Store>({});

  useEffect(() => {
    setStore(readStore());
  }, []);

  const commit = useCallback((next: Store) => {
    writeStore(next);
    setStore(next);
  }, []);

  /** Is `jobId` the chosen result for `groupKey`? */
  const isFavorite = useCallback(
    (groupKey: string, jobId: string) => store[groupKey] === jobId,
    [store]
  );

  /** Which jobId is chosen for `groupKey`? null if none. */
  const getFavoriteJobId = useCallback(
    (groupKey: string): string | null => store[groupKey] ?? null,
    [store]
  );

  /**
   * Toggle: if `jobId` is already selected for `groupKey`, deselect it.
   * Otherwise, select it (replacing any previous selection for that group).
   */
  const toggleFavorite = useCallback(
    (groupKey: string, jobId: string) => {
      const next = { ...store };
      if (next[groupKey] === jobId) {
        delete next[groupKey];
      } else {
        next[groupKey] = jobId;
      }
      commit(next);
    },
    [store, commit]
  );

  return { isFavorite, getFavoriteJobId, toggleFavorite };
}

// ─── Shared types (imported by UI components) ─────────────────────────────────

/** Pre-bound favorites API passed to child components. */
export type FavoritesApi = {
  isFavorite: (groupKey: string, jobId: string) => boolean;
  toggleFavorite: (groupKey: string, jobId: string) => void;
};

/** Build the groupKey used for localStorage and VariationGroup.key. */
export function buildGroupKey(moduleName: string, inputPayload: string | null): string | null {
  if (!inputPayload) return null;
  return `${moduleName}::${inputPayload}`;
}
