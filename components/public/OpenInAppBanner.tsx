"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=in.stoxify.stoxify";
const APP_STORE_URL = "https://apps.apple.com/app/stoxify/id0000000000";

type Platform = "ios" | "android" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac; the touch-point check disambiguates.
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/.test(ua)) return "android";
  return null;
}

/**
 * "Open in app" banner for the public analyst page.
 *
 * Android App Links and iOS Universal Links normally hand a
 * https://stoxify.in/a/<username> tap straight to the app, and when the app
 * isn't installed the web page is the correct destination — neither case needs
 * this banner. It exists for the case in between: in-app browsers (Telegram's
 * especially, and this page is mostly reached from a Telegram broadcast) render
 * the page inside a webview that never consults the OS link handlers, so an
 * installed app is bypassed entirely.
 *
 * The escape hatch is the custom scheme. Navigating to stoxify://a/<username>
 * leaves the webview and reaches the app if it is installed; if it isn't,
 * nothing happens and the page stays put, so a timer sends the user to the
 * store instead. `visibilityState` is what distinguishes the two — the page is
 * hidden once the app takes over, and the store redirect is skipped.
 *
 * Desktop renders nothing.
 */
export function OpenInAppBanner({ username }: { username: string }) {
  const [platform, setPlatform] = useState<Platform>(null);
  const [dismissed, setDismissed] = useState(false);

  // Platform detection must run client-side; deciding during SSR would bake one
  // visitor's UA into the cached page.
  useEffect(() => setPlatform(detectPlatform()), []);

  if (!platform || dismissed) return null;

  const openApp = () => {
    const storeUrl = platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    let settled = false;

    // If the app takes over, the page is backgrounded before the timer fires.
    const onHide = () => {
      if (document.visibilityState === "hidden") settled = true;
    };
    document.addEventListener("visibilitychange", onHide);

    window.location.href = `stoxify://a/${encodeURIComponent(username)}`;

    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      if (!settled && document.visibilityState === "visible") {
        window.location.href = storeUrl;
      }
    }, 1200);
  };

  return (
    <div className="sticky top-[68px] z-30 bg-[var(--brand)] text-white">
      <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 py-2.5">
        <Smartphone className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <p className="flex-1 text-sm font-medium leading-tight">
          Get live trade alerts in the StoXify app
        </p>
        <button
          type="button"
          onClick={openApp}
          className="flex-shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[var(--brand)] transition-opacity hover:opacity-90"
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex-shrink-0 p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
