/**
 * Android App Links — digital asset link verification.
 *
 * Android fetches https://stoxify.in/.well-known/assetlinks.json when the app
 * is installed. Only if the installed APK's signing certificate SHA-256 appears
 * below does tapping a https://stoxify.in/a/<username> link open the StoXify
 * app instead of the browser. Verification is silent: when it fails, links keep
 * working on the web, which is why this is safe to ship before the app is live.
 *
 * Served from a route handler rather than public/ so the JSON content-type is
 * explicit and the payload can be assembled from env vars.
 *
 * ── Filling in the fingerprints ──────────────────────────────────────────────
 * ANDROID_CERT_FINGERPRINTS is a comma-separated list of SHA-256 fingerprints
 * (uppercase hex, colon-separated). You almost always need TWO:
 *
 *   1. Your upload/release keystore:
 *        keytool -list -v -keystore <release.jks> -alias <alias> \
 *          | grep 'SHA256:'
 *
 *   2. The Play App Signing certificate, if the app ships via Google Play.
 *      Play re-signs every upload, so the fingerprint on users' devices is
 *      Google's, not yours. Copy it from:
 *        Play Console ▸ Release ▸ Setup ▸ App signing ▸
 *        "App signing key certificate" ▸ SHA-256 certificate fingerprint
 *
 * Omitting #2 is the single most common reason App Links verify in testing and
 * then silently fail for every real Play install.
 *
 * Verify once deployed:
 *   https://developers.google.com/digital-asset-links/tools/generator
 *   adb shell pm get-app-links in.stoxify.stoxify
 */

const PACKAGE_NAME = process.env.ANDROID_PACKAGE_NAME ?? "in.stoxify.stoxify";

const FINGERPRINTS = (process.env.ANDROID_CERT_FINGERPRINTS ?? "")
  .split(",")
  .map((fp) => fp.trim().toUpperCase())
  .filter(Boolean);

// Static: no request input, and the fingerprints are build-time config.
export const dynamic = "force-static";

export function GET() {
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: FINGERPRINTS,
      },
    },
  ];

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      // Android caches this aggressively; keep it short enough that adding the
      // Play fingerprint later doesn't take days to propagate.
      "cache-control": "public, max-age=300",
    },
  });
}
