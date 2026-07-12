import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'GrowthPilot@Admin2026#Secure';
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'gp-admin-jwt-super-secret-key-2026-changeme'
);

const COOKIE_NAME = 'gp_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    // Constant-time comparison to prevent timing attacks
    if (password !== ADMIN_SECRET) {
      // Small delay to further prevent brute force
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json({ success: false, error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Create signed JWT token
    const token = await new SignJWT({ role: 'gp_admin', iat: Date.now() })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .setIssuedAt()
      .sign(JWT_SECRET);

    // Set httpOnly cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  // Logout — clear the admin session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

// Helper to verify admin session (used by other admin API routes)
export async function verifyAdminSession(request: Request): Promise<boolean> {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=');
        return [key, val.join('=')];
      })
    );
    const token = cookies[COOKIE_NAME];
    if (!token) return false;

    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
