"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const THROTTLE_MS = 2000; // Throttle activity updates to once per 2 seconds

const STORAGE_KEY_LAST_ACTIVITY = "stoxify_last_activity_timestamp";
const STORAGE_KEY_AUTO_LOGOUT_SIGNAL = "stoxify_auto_logout_signal";
const STORAGE_KEY_INACTIVITY_NOTICE = "stoxify_inactivity_logout_notice";

/**
 * Checks if a user or admin session appears active in client storage / cookies.
 */
function isUserLoggedIn(): boolean {
  if (typeof document === "undefined") return false;

  // Check user info cookie
  const hasUserCookie = document.cookie.split("; ").some((c) => c.startsWith("stoxify_user_info="));
  if (hasUserCookie) return true;

  // Check if last activity timestamp exists in localStorage
  const hasLastActivity = Boolean(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY));
  return hasLastActivity;
}

export function SessionTimeoutManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleTimeoutRef = useRef<((remainingMs: number) => void) | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isLoggingOutRef = useRef<boolean>(false);

  // ── 1. Clear & Schedule Timer ──────────────────────────────────────────────
  const clearInactivityTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── 2. Perform Auto Logout ─────────────────────────────────────────────────
  const performAutoLogout = useCallback(
    async (isCrossTabSignal = false) => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      clearInactivityTimer();

      // Set inactivity notice flag before calling logout
      try {
        localStorage.setItem(STORAGE_KEY_INACTIVITY_NOTICE, "true");
        sessionStorage.setItem(STORAGE_KEY_INACTIVITY_NOTICE, "true");
        localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);

        if (!isCrossTabSignal) {
          localStorage.setItem(STORAGE_KEY_AUTO_LOGOUT_SIGNAL, Date.now().toString());
        }
      } catch {
        // LocalStorage access fail-safe
      }

      // Determine logout endpoint based on current route
      const isAdminRoute = pathname?.startsWith("/admin");
      const logoutUrl = isAdminRoute ? "/api/admin/logout" : "/api/auth/logout";

      try {
        await fetch(logoutUrl, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
      } catch (err) {
        console.error("Auto-logout API call failed:", err);
      } finally {
        // Show notification toast immediately
        toast.info(
          "You have been signed out due to prolonged inactivity. Please sign in again to continue.",
          {
            duration: 8000,
            id: "inactivity-logout-toast",
          }
        );

        // Redirect to login / landing
        const targetUrl = isAdminRoute ? "/admin/login" : "/";
        window.location.href = targetUrl;
      }
    },
    [clearInactivityTimer, pathname]
  );

  // ── 3. Schedule Timeout Check ──────────────────────────────────────────────
  const scheduleTimeout = useCallback(
    (remainingMs: number) => {
      clearInactivityTimer();

      if (remainingMs <= 0) {
        void performAutoLogout();
        return;
      }

      timerRef.current = setTimeout(() => {
        const storedLastStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
        const storedLast = storedLastStr ? parseInt(storedLastStr, 10) : 0;
        const now = Date.now();
        const elapsed = now - storedLast;

        if (storedLast > 0 && elapsed >= INACTIVITY_TIMEOUT_MS) {
          void performAutoLogout();
        } else if (storedLast > 0 && scheduleTimeoutRef.current) {
          // Reschedule for remaining time if timestamp was updated elsewhere
          scheduleTimeoutRef.current(INACTIVITY_TIMEOUT_MS - elapsed);
        }
      }, remainingMs);
    },
    [clearInactivityTimer, performAutoLogout]
  );

  useEffect(() => {
    scheduleTimeoutRef.current = scheduleTimeout;
  }, [scheduleTimeout]);

  // ── 4. Record Activity ──────────────────────────────────────────────────────
  const registerActivity = useCallback(() => {
    if (!isUserLoggedIn()) return;

    const now = Date.now();
    // Throttle timestamp writes to localStorage
    if (now - lastUpdateRef.current < THROTTLE_MS) return;

    lastUpdateRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
    } catch {
      // Ignore quota error
    }

    scheduleTimeout(INACTIVITY_TIMEOUT_MS);
  }, [scheduleTimeout]);

  // ── 5. Check Inactivity Notice on Mount / Navigation ─────────────────────
  useEffect(() => {
    try {
      const noticeInLocal = localStorage.getItem(STORAGE_KEY_INACTIVITY_NOTICE);
      const noticeInSession = sessionStorage.getItem(STORAGE_KEY_INACTIVITY_NOTICE);

      if (noticeInLocal === "true" || noticeInSession === "true") {
        localStorage.removeItem(STORAGE_KEY_INACTIVITY_NOTICE);
        sessionStorage.removeItem(STORAGE_KEY_INACTIVITY_NOTICE);

        // Show toast after a slight tick so DOM / Sonner toaster is mounted
        setTimeout(() => {
          toast.info(
            "You have been signed out due to prolonged inactivity. Please sign in again to continue.",
            {
              duration: 8000,
              id: "inactivity-logout-toast",
            }
          );
        }, 100);
      }
    } catch {
      // LocalStorage access fail-safe
    }
  }, []);

  // ── 6. Activity Listeners & Initial Timer Setup ─────────────────────────────
  useEffect(() => {
    if (!isUserLoggedIn()) {
      clearInactivityTimer();
      return;
    }

    const storedLastStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    const now = Date.now();
    let initialLastActivity = storedLastStr ? parseInt(storedLastStr, 10) : 0;

    if (!initialLastActivity || isNaN(initialLastActivity)) {
      initialLastActivity = now;
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
    }

    const elapsed = now - initialLastActivity;
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      void performAutoLogout();
      return;
    }

    scheduleTimeout(INACTIVITY_TIMEOUT_MS - elapsed);

    // Event handlers
    const handleUserActivity = () => {
      registerActivity();
    };

    const handleVisibilityOrFocus = () => {
      if (!isUserLoggedIn()) return;
      const lastStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
      const lastTime = lastStr ? parseInt(lastStr, 10) : 0;
      const currentTime = Date.now();

      if (lastTime > 0 && currentTime - lastTime >= INACTIVITY_TIMEOUT_MS) {
        void performAutoLogout();
      } else if (lastTime > 0) {
        scheduleTimeout(INACTIVITY_TIMEOUT_MS - (currentTime - lastTime));
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LAST_ACTIVITY && e.newValue) {
        const newTimestamp = parseInt(e.newValue, 10);
        if (!isNaN(newTimestamp)) {
          const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - newTimestamp);
          scheduleTimeout(remaining);
        }
      } else if (e.key === STORAGE_KEY_AUTO_LOGOUT_SIGNAL && e.newValue) {
        void performAutoLogout(true);
      }
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "touchmove",
      "click",
      "scroll",
      "wheel",
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      clearInactivityTimer();
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [clearInactivityTimer, performAutoLogout, registerActivity, scheduleTimeout]);

  // ── 7. Route / Path Navigation Trigger ─────────────────────────────────────
  useEffect(() => {
    registerActivity();
  }, [pathname, searchParams, registerActivity]);

  return null;
}
