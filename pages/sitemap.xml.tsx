import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

/**
 * Dynamic sitemap.xml — always generated from the LIVE catalog so Google never
 * crawls a stale 2024 list. Every storefront URL uses the single canonical
 * www host (https://www.store.prempackaging.com) so link equity never splits
 * between www / non-www, and products/categories/brands that weren't hand
 * baked into the old static file are all included with proper <lastmod>.
 */

const SITE_HOST = "https://www.store.prempackaging.com";

const xmlEscape = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toUrl = (path: string) =>
  `${SITE_HOST}${path.startsWith("/") ? path : `/${path}`}`;

const absoluteImage = (img: unknown): string | undefined => {
  const src = String(img ?? "").trim();
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith("/")) return toUrl(src);
  return undefined;
};

const isoDate = (value: unknown): string | undefined => {
  try {
    const d = new Date(String(value ?? ""));
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  } catch {
    return undefined;
  }
};

const STATIC_URLS: Array<{
  path: string;
  priority: string;
  changeFrequency: string;
}> = [
  { path: "/", priority: "1.0", changeFrequency: "daily" },
  { path: "/packpro", priority: "0.8", changeFrequency: "weekly" },
  { path: "/packpro-tapes", priority: "0.8", changeFrequency: "weekly" },
  { path: "/paper-tapes", priority: "0.8", changeFrequency: "weekly" },
  { path: "/bopp-tapes", priority: "0.8", changeFrequency: "weekly" },
  { path: "/BestDeals", priority: "0.6", changeFrequency: "daily" },
  { path: "/CustomPackaging", priority: "0.7", changeFrequency: "weekly" },
  { path: "/contact-us", priority: "0.5", changeFrequency: "monthly" },
  { path: "/terms-of-sale", priority: "0.3", changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: "0.3", changeFrequency: "monthly" },
  { path: "/shipping-policy", priority: "0.3", changeFrequency: "monthly" },
  { path: "/return-and-exchange-policy", priority: "0.3", changeFrequency: "monthly" },
];

const pageEntry = (path: string, lastmod?: string) => {};

interface RawProduct {
  _id?: string;
  slug?: string;
  name?: string;
  model?: string;
  updatedAt?: string;
  createdAt?: string;
  images?: Array<{ image?: string }>;
  seo?: { slug?: string; canonical?: string };
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { getService } = await import("../services/service");
  const urlset: string[] = [];

  for (const entry of STATIC_URLS) {
    urlset.push(`    <url>
      <loc>${toUrl(entry.path)}</loc>
      <changefreq>${entry.changeFrequency}</changefreq>
      <priority>${entry.priority}</priority>
    </url>`);
  }

  const emitCollection = async (
    get: (url: string, config?: Record<string, unknown>) => Promise<any>,
    url: string,
    key: string,
    priority: string,
    changeFrequency = "weekly",
  ) => {
    const res = await get(url, { limit: 100000 });
    const items = Array.isArray(res?.data?.data) ? res.data.data : [];
    items.forEach((item: any, index: number) => {
      const slugRaw =
        item?.slug || item?.seo?.slug || (key === "product/all" ? item?._id : "");
      if (!slugRaw) return;
      const slug = encodeURIComponent(String(slugRaw).replace(/^\//, ""));
      const lastmod =
        isoDate(item?.updatedAt) || isoDate(item?.createdAt) || undefined;
      const imageSrc = absoluteImage(item?.images?.[0]?.image);
      urlset.push(`    <url>
      <loc>${toUrl(slug)}</loc>
      ${lastmod ? `      <lastmod>${lastmod}</lastmod>` : ""}
      <changefreq>${changeFrequency}</changefreq>
      <priority>${priority}</priority>
      ${imageSrc ? `      <image:image><image:loc>${xmlEscape(imageSrc)}</image:loc></image:image>` : ""}
    </url>`);
    });
  };

  await Promise.all([
    emitCollection(getService, "category/all", "category", "0.8"),
    emitCollection(getService, "subcategory/all", "subcategory", "0.8"),
    emitCollection(getService, "brand/all", "brand", "0.7"),
    emitCollection(getService, "product/all", "product", "0.9", "weekly"),
  ]);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlset.join("\n")}
</urlset>`;

  return {
    props: { xml },
  };
};

export default function SitemapXml({
  xml,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: `<!-- ${xml} -->` }}
      style={{ display: "none" }}
    />
  );
}
