/**
 * S3 Static Media Seeder
 *
 * Uploads all images from /public to S3 under a "static/" prefix,
 * then outputs a JSON mapping of local paths → CDN URLs.
 *
 * Usage:
 *   node scripts/s3-seeder.mjs
 *
 * Env vars (or hardcode below):
 *   AWS_BUCKET_NAME, AWS_BUCKET_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY, CDN_DOMAIN
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "prem-packaging2.0-918947482615-ap-south-1-an";
const BUCKET_REGION = process.env.AWS_BUCKET_REGION || "ap-south-1";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY || "AKIA5L5MJZP3S35C6H4F";
const SECRET_KEY = process.env.AWS_SECRET_KEY || "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";
const CDN_DOMAIN = process.env.CDN_DOMAIN || "d3dcdu6oc5g6yg.cloudfront.net";
const PREFIX = "static"; // S3 folder prefix for frontend assets

// ─── Content-type map ────────────────────────────────────────────────
const MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".avif": "image/avif",
};

// ─── Helpers ─────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: BUCKET_REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

function walkDir(dir, root = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules, .next, .git
      if (["node_modules", ".next", ".git", ".agents", ".claude", ".codex"].includes(entry.name)) continue;
      results = results.concat(walkDir(full, root));
    } else {
      results.push(full);
    }
  }
  return results;
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || "application/octet-stream";
}

function makeKey(localPath, publicDir) {
  const rel = path.relative(publicDir, localPath).replace(/\\/g, "/");
  return `${PREFIX}/${rel}`;
}

function cdnUrl(key) {
  return `https://${CDN_DOMAIN}/${key}`;
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const publicDir = path.resolve("public");
  const files = walkDir(publicDir);

  console.log(`\n📦 Found ${files.length} files in /public\n`);

  const mapping = {};
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const key = makeKey(file, publicDir);
    const contentType = mimeFor(file);
    const body = fs.readFileSync(file);
    const cdnUrlStr = cdnUrl(key);

    // Check if already exists (skip re-upload)
    try {
      await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
      // If no error, file exists — skip
      skipped++;
      mapping[`/${path.relative(publicDir, file).replace(/\\/g, "/")}`] = cdnUrlStr;
      continue;
    } catch {
      // File doesn't exist — proceed to upload
    }

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
      uploaded++;
      mapping[`/${path.relative(publicDir, file).replace(/\\/g, "/")}`] = cdnUrlStr;

      const pct = ((uploaded + skipped) / files.length) * 100;
      process.stdout.write(`\r  ✅ ${uploaded} uploaded | ⏭ ${skipped} skipped | ${pct.toFixed(0)}%`);
    } catch (err) {
      failed++;
      console.error(`\n  ❌ Failed: ${key} — ${err.message}`);
    }
  }

  console.log(`\n\n📊 Done! ${uploaded} uploaded, ${skipped} skipped, ${failed} failed\n`);

  // Write mapping JSON
  const outPath = path.resolve("scripts/cdn-map.json");
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2));
  console.log(`📄 CDN mapping saved to ${outPath}`);
  console.log(`\n🌐 CDN Domain: https://${CDN_DOMAIN}`);
  console.log(`   Total static assets: ${Object.keys(mapping).length}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
