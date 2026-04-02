export const DASHBOARD_DOMAIN = process.env.NEXT_PUBLIC_DASHBOARD_DOMAIN || 'dashboard.zuperix.com';
export const PORTALS_DOMAIN = process.env.NEXT_PUBLIC_PORTALS_DOMAIN || 'portals.zuperix.com';

export const getPortalUrl = (slug: string) => {
  // Always use HTTPS for the portal URL
  return `https://${PORTALS_DOMAIN}/p/${slug}`;
};
