import { API_BASE_URL } from "../services/constants";

const PRODUCT_IMAGE_BUCKET_HOSTS = new Set([
  "prem-industries-ecom-images.s3.ap-south-1.amazonaws.com",
  "prem-industries-ecom-images.s3.amazonaws.com",
]);

const apiBaseUrl = API_BASE_URL.replace(/\/+$/, "");

const decodeObjectKey = (pathname: string): string =>
  pathname
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");

/**
 * Extract our private-bucket object key without retaining the signed query
 * string. Local/public and third-party images are deliberately not retried.
 */
const getProductImageKey = (source: string): string | undefined => {
  const trimmed = source.trim();
  if (!trimmed || trimmed.startsWith("/")) return undefined;

  let objectKey = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (!PRODUCT_IMAGE_BUCKET_HOSTS.has(url.hostname.toLowerCase())) {
        return undefined;
      }
      objectKey = decodeObjectKey(url.pathname);
    } catch {
      return undefined;
    }
  }

  return objectKey || undefined;
};

/**
 * Refresh an expired private-bucket URL through the backend. The explicit JSON
 * Accept header works with both backend variants: the deployed endpoint that
 * always returns JSON and the newer endpoint that redirects only image loads.
 */
export const refreshProductImageUrl = (
  source: string,
): Promise<string> | undefined => {
  const objectKey = getProductImageKey(source);
  if (!objectKey) return undefined;

  const requestUrl = `${apiBaseUrl}/getImage?image=${encodeURIComponent(objectKey)}`;
  return fetch(requestUrl, {
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    const payload = await response.json();
    const refreshedUrl = payload?.data?.url;

    if (!response.ok || !payload?.success || typeof refreshedUrl !== "string") {
      throw new Error(payload?.message || "Unable to refresh product image");
    }

    return refreshedUrl;
  });
};
