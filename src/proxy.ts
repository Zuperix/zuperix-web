import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host');
  
  const dashboardDomain = process.env.NEXT_PUBLIC_DASHBOARD_DOMAIN || 'dashboard.zuperix.com';
  const portalsDomain = process.env.NEXT_PUBLIC_PORTALS_DOMAIN || 'portals.zuperix.com';

  // 1. Dashboard redirect legacy paths
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const newPathname = pathname === '/dashboard' 
      ? '/' 
      : pathname.replace(/^\/dashboard/, '');
    
    const url = request.nextUrl.clone();
    url.pathname = newPathname || '/';
    return NextResponse.redirect(url, 301);
  }

  // 2. Domain-based access control
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1');
  const isPortalsDomain = host?.includes(portalsDomain) || (isLocalhost && host?.includes(':3001'));
  
  // Static assets and API routes should always be accessible
  const isStaticAsset = pathname.startsWith('/_next') || 
                        pathname.startsWith('/public') || 
                        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|js|css)$/);
  const isApiRoute = pathname.startsWith('/api');

  if (isPortalsDomain && !isStaticAsset && !isApiRoute && !isDevelopment) {
    // Portals domain should ONLY access /p/* routes (Skip restriction in dev)
    const isPortalRoute = pathname.startsWith('/p/');
    const isUnauthorizedPage = pathname === '/unauthorized-domain';

    if (!isPortalRoute && !isUnauthorizedPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized-domain';
      return NextResponse.rewrite(url);
    }
  }

  if (!isPortalsDomain && pathname.startsWith('/p/') && !isDevelopment) {
    const url = request.nextUrl.clone();
    // Use the portal domain for redirection
    url.host = portalsDomain;
    url.protocol = 'https:'; // Force HTTPS for portals
    return NextResponse.redirect(url, 301);
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
