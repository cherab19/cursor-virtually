export const SITE_NAME = "InfluencerHub";

export const DEFAULT_DESCRIPTION =
  "InfluencerHub connects Ethiopian brands with verified creators — directory discovery, campaign workflows, reviews, and ETB checkout.";

/**
 * Public site origin for canonical URLs and JSON-LD.
 * Set `VITE_SITE_URL` in production (e.g. https://app.example.com). Falls back to `window.location.origin` in the browser.
 */
export function getSiteOrigin(): string {
  const raw = import.meta.env.VITE_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (origin) return `${origin}${p}`;
  return p;
}
