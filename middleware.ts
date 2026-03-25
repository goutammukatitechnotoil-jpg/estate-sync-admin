import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  if (!token) {
    if (!isLoginPage && request.nextUrl.pathname !== '/api/auth/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const secret = getJwtSecretKey();
    if (secret) {
      // Verify token
      await jwtVerify(token, secret);
      
      // If valid and on login page, redirect to dashboard
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Redirect root to dashboard
    if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    // Token is invalid or expired
    if (!isLoginPage) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('admin_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
