import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { writeUserTokenCookies } from "@/lib/auth/server-session";

type RegisterAnalystRequestBody = {
  name?: string;
  email?: string;
  phone?: string;
  sebi_license_number?: string;
  sebi_license_doc_url?: string;
  company_name?: string;
  company_location?: string;
  business_type?: string;
  website?: string;
  registration_type?: string;
  asset_under_research_cr?: number;
  number_of_clients?: number;
  registration_token?: string;
};

const ERROR_MAP: Record<string, string> = {
  EMAIL_EXISTS: "An account with this email already exists. Try logging in.",
  SEBI_EXISTS: "This SEBI Registration Number has already been registered.",
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  let body: RegisterAnalystRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  // Basic check for required fields
  if (
    !body.name ||
    !body.email ||
    !body.phone ||
    !body.sebi_license_number ||
    !body.company_name ||
    !body.company_location ||
    !body.business_type ||
    !body.registration_type ||
    body.asset_under_research_cr === undefined ||
    body.number_of_clients === undefined ||
    !body.registration_token
  ) {
    return NextResponse.json(
      { error: "All required registration details must be filled", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? `user-web-${randomUUID()}`;

  let response: Response;
  try {
    response = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/analysts/onboard",
      method: "POST",
      deviceId,
      body: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        sebi_license_number: body.sebi_license_number.trim(),
        sebi_license_doc_url: body.sebi_license_doc_url || "https://stoxify.in/placeholder-doc.pdf",
        company_name: body.company_name.trim(),
        company_location: body.company_location.trim(),
        business_type: body.business_type,
        website: body.website?.trim() || "",
        registration_type:
          body.registration_type === "Research Analyst"
            ? "research_analyst"
            : body.registration_type === "Investment Advisor"
              ? "investment_advisors"
              : body.registration_type,
        asset_under_research_cr: Number(body.asset_under_research_cr),
        number_of_clients: Number(body.number_of_clients),
        registration_token: body.registration_token,
      },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the user service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const data = (await response.json().catch(() => ({}))) as {
    user_id?: string;
    email?: string;
    state?: string;
    error?: string;
    message?: string;
    code?: string;
    details?: unknown;
    access_token?: string;
    refresh_token?: string;
    session_id?: string;
    user?: Record<string, unknown>;
  };

  console.info("[analyst-register] Registration attempt", {
    email: body.email?.trim(),
    status: response.status,
    code: data.code,
    raw_data: data,
  });

  if (!response.ok) {
    const code = data.code ?? "";
    let userMessage = ERROR_MAP[code] ?? data.message ?? "Unable to submit analyst profile.";
    let fieldErrors;

    if (code === "VALIDATION_ERROR" && data.details) {
      if (Array.isArray(data.details)) {
        fieldErrors = data.details;
        userMessage = "Please check the highlighted fields and try again.";
      } else {
        userMessage += ` Details: ${JSON.stringify(data.details)}`;
      }
    }
    return NextResponse.json(
      { error: userMessage, code, field_errors: fieldErrors },
      { status: response.status || 400 }
    );
  }

  // Write tokens and redirect to dashboard
  const redirectTo = "/analyst-dashboard";
  const nextResponse = NextResponse.json({ ok: true, redirectTo });

  if (data.access_token) {
    writeUserTokenCookies(nextResponse, {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      session_id: data.session_id,
      device_id: deviceId,
      user: {
        ...data.user,
        user_type: "ANALYST",
        user_id: data.user_id,
        email: data.email,
        state: data.state,
      },
    });
  } else {
    // Fallback if the token is missing for some reason
    nextResponse.cookies.set(userCookieNames.deviceId, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return nextResponse;
}
