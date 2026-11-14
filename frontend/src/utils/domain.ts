/**
 * CENTERPOINT Domain & Surface Resolution Utility
 * Maps incoming hostnames (under devcenterpoint.com or localhost) to the correct UI experience.
 */

export type PlatformSurface = 'storefront' | 'studio' | 'control' | 'marketing';

export interface SurfaceContext {
  surface: PlatformSurface;
  tenantSlug: string | null;
  isCustomDomain: boolean;
  isLocalhost: boolean;
  rawHost: string;
}

const ROOT_DOMAIN = 'devcenterpoint.com';
const SHOPS_SUBDOMAIN = 'shops.devcenterpoint.com';

export function detectSurfaceFromHost(hostname: string = typeof window !== 'undefined' ? window.location.hostname : 'localhost'): SurfaceContext {
  const host = hostname.toLowerCase().split(':')[0];

  // 1. Localhost development
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
    // Check if simulating a tenant via sub.localhost
    if (host.endsWith('.localhost') && host !== 'localhost') {
      const slug = host.replace('.localhost', '');
      return {
        surface: 'storefront',
        tenantSlug: slug,
        isCustomDomain: false,
        isLocalhost: true,
        rawHost: host,
      };
    }

    return {
      surface: 'storefront',
      tenantSlug: null,
      isCustomDomain: false,
      isLocalhost: true,
      rawHost: host,
    };
  }

  // 2. Master Control Panel (SaaS Superadmin Fleet Governance)
  if (host === `control.centerpoint.${ROOT_DOMAIN}`) {
    return {
      surface: 'control',
      tenantSlug: null,
      isCustomDomain: false,
      isLocalhost: false,
      rawHost: host,
    };
  }

  // 3. Merchant Store Studio (Operating Workspace & CMS)
  if (host === `studio.centerpoint.${ROOT_DOMAIN}`) {
    return {
      surface: 'studio',
      tenantSlug: null,
      isCustomDomain: false,
      isLocalhost: false,
      rawHost: host,
    };
  }

  // 4. Main Product Marketing Portal (centerpoint.devcenterpoint.com)
  if (host === `centerpoint.${ROOT_DOMAIN}`) {
    return {
      surface: 'marketing',
      tenantSlug: null,
      isCustomDomain: false,
      isLocalhost: false,
      rawHost: host,
    };
  }

  // 5. Tenant Storefront Fleet (*.shops.devcenterpoint.com)
  const shopsSuffix = `.${SHOPS_SUBDOMAIN}`;
  if (host.endsWith(shopsSuffix)) {
    const slug = host.replace(shopsSuffix, '');
    return {
      surface: 'storefront',
      tenantSlug: slug,
      isCustomDomain: false,
      isLocalhost: false,
      rawHost: host,
    };
  }

  // 6. Custom Merchant Domains (e.g. www.fashionhouse.com)
  return {
    surface: 'storefront',
    tenantSlug: 'custom',
    isCustomDomain: true,
    isLocalhost: false,
    rawHost: host,
  };
}

/**
 * Generate canonical absolute URLs across the multi-domain ecosystem
 */
export const domainUrls = {
  marketing: () => `https://centerpoint.${ROOT_DOMAIN}`,
  studio: () => `https://studio.centerpoint.${ROOT_DOMAIN}`,
  control: () => `https://control.centerpoint.${ROOT_DOMAIN}`,
  api: () => `https://api.centerpoint.${ROOT_DOMAIN}/api/v1`,
  docs: () => `https://docs.centerpoint.${ROOT_DOMAIN}`,
  status: () => `https://status.centerpoint.${ROOT_DOMAIN}`,
  tenantShop: (slug: string) => `https://${slug}.${SHOPS_SUBDOMAIN}`,
};
