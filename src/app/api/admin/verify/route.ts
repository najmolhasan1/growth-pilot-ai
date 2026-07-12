import { NextResponse } from 'next/server';
import { verifyAdminSession } from '../auth/route';

export async function GET(request: Request) {
  const valid = await verifyAdminSession(request);
  return NextResponse.json({ valid });
}
