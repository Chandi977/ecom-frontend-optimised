/**
 * CDN Configuration
 *
 * Central place for the CloudFront CDN domain used to serve static assets.
 * When NEXT_PUBLIC_CDN_URL is set, all local /public images resolve through
 * the CDN instead of the Next.js server — cutting latency significantly.
 */

export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

/**
 * Resolve a local public path to its CDN equivalent.
 * If CDN is not configured, returns the original path (no-op fallback).
 *
 * @example
 *   cdn("/amazon.jpg")
 *   // → "https://d3dcdu6oc5g6yg.cloudfront.net/static/amazon.jpg"  (when CDN enabled)
 *   // → "/amazon.jpg"  (when CDN disabled)
 */
export function cdn(localPath: string): string {
  if (!CDN_URL) return localPath;
  // Strip leading slash, prepend static/ prefix
  const key = localPath.startsWith("/") ? localPath.slice(1) : localPath;
  return `${CDN_URL}/${key}`;
}

/**
 * Same as `cdn()` but designed for use inside inline `style` objects
 * (e.g. background-image URLs).
 */
export function cdnBg(localPath: string): string {
  return `url(${cdn(localPath)})`;
}
