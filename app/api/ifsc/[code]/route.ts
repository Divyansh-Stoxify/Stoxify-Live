import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ code: string }> };

/**
 * GET /api/ifsc/:code — resolve an IFSC to its bank and branch.
 *
 * Proxied server-side rather than called from the browser so the lookup isn't
 * subject to third-party CORS behaviour and the analyst's IP never reaches the
 * directory. The upstream is free and keyless.
 *
 * A failed lookup is a 404, not an error: the submit flow treats an unresolved
 * IFSC as "couldn't confirm the branch", never as a blocker.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid IFSC format" }, { status: 400 });
  }

  try {
    // Endpoint is /<IFSC> — an /IFSC/<code> prefix 404s.
    const upstream = await fetch(`https://ifsc.razorpay.com/${code.toUpperCase()}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "IFSC not found" }, { status: 404 });
    }

    const data = await upstream.json();
    return NextResponse.json(
      {
        ifsc: data.IFSC,
        bank: data.BANK,
        branch: data.BRANCH,
        city: data.CITY,
      },
      { status: 200, headers: { "Cache-Control": "private, max-age=3600" } }
    );
  } catch {
    return NextResponse.json({ error: "Lookup unavailable" }, { status: 503 });
  }
}
