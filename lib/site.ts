/**
 * The canonical public origin for the site. Everything user-facing (metadata,
 * canonical tags, robots, sitemap, email links) derives from this one value.
 * Override with NEXT_PUBLIC_SITE_URL in the environment; defaults to the live
 * launch domain so crawlers never see the Vercel preview host.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://solaspace.app").replace(/\/+$/, "");
