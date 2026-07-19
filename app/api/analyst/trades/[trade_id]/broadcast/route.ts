import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trade_id: string }> }
): Promise<NextResponse> {
  const { trade_id } = await params;
  const body = await request.json().catch(() => ({}));

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  return NextResponse.json({
    success: true,
    message: "Broadcast sent successfully!",
    trade_id,
    broadcasted_message: body.message,
  });
}
