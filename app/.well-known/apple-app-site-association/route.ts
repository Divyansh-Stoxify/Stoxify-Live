/**
 * iOS Universal Links — apple-app-site-association (AASA).
 *
 * iOS fetches https://stoxify.in/.well-known/apple-app-site-association when
 * the app is installed and matches the requesting bundle against `appIDs`. Only
 * on a match does a https://stoxify.in/a/<username> tap open StoXify instead of
 * Safari. Like assetlinks.json, a failed match degrades to the web page.
 *
 * Apple's requirements this file exists to satisfy:
 *   • served over HTTPS with NO redirect
 *   • content-type application/json
 *   • NO .json extension in the path
 * The last two are why this is a route handler — a file in public/ would need
 * the extension and would be served as a static asset.
 *
 * ── Filling in the App ID ────────────────────────────────────────────────────
 * APPLE_APP_ID is "<TeamID>.<BundleID>", e.g. "A1B2C3D4E5.in.stoxify.stoxify".
 * The Team ID is at developer.apple.com ▸ Membership details ▸ Team ID.
 *
 * Paths are scoped to /a/* so the trader dashboard and marketing pages keep
 * opening in the browser.
 *
 * Verify once deployed:
 *   curl -sI https://stoxify.in/.well-known/apple-app-site-association
 *     → 200, content-type: application/json, no Location header
 *   https://search.developer.apple.com/appsearch-validation-tool/
 */

const APPLE_APP_ID = process.env.APPLE_APP_ID ?? "";

export const dynamic = "force-static";

export function GET() {
  const body = {
    applinks: {
      // `details[].appIDs` supersedes the legacy `apps` key, which must still be
      // present and empty for older iOS versions.
      apps: [],
      details: APPLE_APP_ID
        ? [
            {
              appIDs: [APPLE_APP_ID],
              components: [
                {
                  "/": "/a/*",
                  comment: "Short analyst links shared via Telegram and referrals",
                },
                {
                  "/": "/profiles/*",
                  comment: "Canonical analyst page, as shared from a browser URL bar",
                },
              ],
            },
          ]
        : [],
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
    },
  });
}
