import { NextRequest, NextResponse } from "next/server";

/**
 * Hosts this deployment answers on, as `hostname[:port]`.
 *
 * Comparison is host-based rather than full-origin because the scheme is not
 * reliable behind a TLS-terminating proxy: Azure Container Apps ingress (and the
 * nginx in docker-compose) hand the container plain HTTP, so `nextUrl.origin` is
 * `http://…` while the browser's `Origin` header says `https://…`, and a naive
 * string compare 403s every POST. The scheme carries no CSRF signal anyway — the
 * protection comes from the host, which a cross-site attacker cannot forge:
 * browsers derive `Host` from the URL actually being fetched, and
 * `X-Forwarded-Host` is not CORS-safelisted so it cannot be attached to a
 * cross-origin request without a preflight this app never approves.
 */
function allowedHosts(request: NextRequest): Set<string> {
  const hosts = new Set<string>([request.nextUrl.host]);

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) hosts.add(forwardedHost);

  const host = request.headers.get("host");
  if (host) hosts.add(host);

  // Escape hatch for hostnames that never reach the app as Host (e.g. a CDN in
  // front of the ingress). Accepts absolute origins or bare hosts.
  for (const extra of (process.env.ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = extra.trim();
    if (!trimmed) continue;
    try {
      hosts.add(new URL(trimmed).host);
    } catch {
      hosts.add(trimmed);
    }
  }

  return hosts;
}

export function rejectCrossOriginPost(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }

    if (originHost && allowedHosts(request).has(originHost)) {
      return null;
    }
  }

  console.warn(
    "[csrf] rejected origin=%s allowedHosts=%s nextUrlHost=%s host=%s xfh=%s",
    origin,
    [...allowedHosts(request)].join("|"),
    request.nextUrl.host,
    request.headers.get("host"),
    request.headers.get("x-forwarded-host")
  );

  return NextResponse.json({ error: "Invalid request origin", code: "FORBIDDEN" }, { status: 403 });
}
