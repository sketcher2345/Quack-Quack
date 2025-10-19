// apps/host-client/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // A modern, robust library for JWT verification

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new NextResponse(
      JSON.stringify({ message: 'Authentication token not provided' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await jwtVerify(token, secret);
    // Token is valid, continue to the API route
    return NextResponse.next();
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ message: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// This config specifies that the middleware should only run on these paths
export const config = {
  matcher: '/api/protected/:path*',
};