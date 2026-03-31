import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /dashboard and /dashboard/* to / and /*
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const newPathname = pathname === '/dashboard' 
      ? '/' 
      : pathname.replace(/^\/dashboard/, '');
    
    // Create a new URL for the redirect
    const url = request.nextUrl.clone();
    url.pathname = newPathname || '/';
    
    return NextResponse.redirect(url, 301); // Permanent redirect for SEO
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
};
