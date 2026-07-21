import { NextRequest, NextResponse } from 'next/server';
import { signedBackendFetch, backendUrls, forwardedIpHeaders } from '@/lib/backend';


export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('stoxify_user_access_token')?.value;
    const deviceId =
      request.cookies.get('stoxify_user_device_id')?.value || `guest_${crypto.randomUUID()}`;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.subscription,
      path: '/subscriptions/reviews',
      method: 'POST',
      deviceId,
      accessToken,
      body,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json();

    // Forward backend status and body verbatim (preserves 409 conflict, 403 forbidden, etc.)
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: any) {
    console.error('[POST /api/reviews] Error:', error);
    return NextResponse.json(
      { error: 'Failed to post review', code: 'POST_FAILED' },
      { status: 500 }
    );
  }
}
