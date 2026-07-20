import { NextRequest, NextResponse } from 'next/server';
import { signedBackendFetch, backendUrls, forwardedIpHeaders } from '@/lib/backend';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analyst_id: string }> }
) {
  try {
    const { analyst_id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    const deviceId =
      request.cookies.get('stoxify_user_device_id')?.value || `guest_${crypto.randomUUID()}`;

    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.subscription,
      path: `/subscriptions/reviews/${analyst_id}`,
      method: 'GET',
      deviceId,
      query: { limit },
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/public/reviews] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', code: 'FETCH_FAILED' },
      { status: 500 }
    );
  }
}
