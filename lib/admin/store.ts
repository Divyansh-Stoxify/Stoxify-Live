"use client";

import { create } from "zustand";

import type { AdminSessionPayload, AdminUser } from "@/lib/admin/session-shared";

type AdminAuthState = {
  error: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  powers: string[];
  roles: string[];
  user: AdminUser | null;
  can: (power: string) => boolean;
  hasAll: (powers: string[]) => boolean;
  hasAny: (powers: string[]) => boolean;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
  setSession: (payload: AdminSessionPayload) => void;
};

function normalizeList(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string")))
    : [];
}

export const useAdminStore = create<AdminAuthState>((set, get) => ({
  error: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  powers: [],
  roles: [],
  user: null,
  can: (power) => get().powers.includes(power),
  hasAll: (powers) => powers.every((power) => get().powers.includes(power)),
  hasAny: (powers) => powers.length === 0 || powers.some((power) => get().powers.includes(power)),
  hydrate: async () => {
    set({ error: null, isLoading: true });
    try {
      const response = await fetch("/api/admin/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => ({}))) as AdminSessionPayload;

      if (!response.ok || !payload.authenticated || !payload.user) {
        set({
          error: payload.error ?? null,
          isAuthenticated: false,
          isHydrated: true,
          isLoading: false,
          powers: [],
          roles: [],
          user: null,
        });
        return;
      }

      get().setSession(payload);
      set({ isHydrated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to load admin session.",
        isAuthenticated: false,
        isHydrated: true,
        isLoading: false,
        powers: [],
        roles: [],
        user: null,
      });
    }
  },
  logout: async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => undefined);

    set({
      error: null,
      isAuthenticated: false,
      isHydrated: true,
      isLoading: false,
      powers: [],
      roles: [],
      user: null,
    });
  },
  setSession: (payload) => {
    set({
      error: payload.error ?? null,
      isAuthenticated: Boolean(payload.user && (payload.authenticated ?? payload.ok ?? true)),
      isHydrated: true,
      isLoading: false,
      powers: normalizeList(payload.powers),
      roles: normalizeList(payload.roles),
      user: payload.user ?? null,
    });
  },
}));
