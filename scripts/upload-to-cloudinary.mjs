import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const ASSETS_DIR = path.resolve(process.cwd(), "assets");
const CLOUD_PREFIX = process.env.CLOUDINARY_PREFIX || "nlc-site";
const DRY_RUN = process.argv.includes("--dry-run");

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function isImage(file) {
  const ext = path.extname(file).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext);
}

function publicIdForAsset(file) {
  const rel = path.relative(ASSETS_DIR, file).replaceAll(path.sep, "/");
  const noExt = rel.replace(/\.[a-zA-Z0-9]+$/, "");
  return `${CLOUD_PREFIX}/${noExt}`;
}

async function main() {
  if (!process.env.CLOUDINARY_URL && !DRY_RUN) {
    throw new Error(
      "Missing CLOUDINARY_URL. Create a .env file (see .env.example) and set CLOUDINARY_URL=cloudinary://<key>:<secret>@dnpjkdgkb"
    );
  }

  const all = walkFiles(ASSETS_DIR).filter(isImage);
  if (!all.length) {
    console.log("No image files found under assets/.");
    return;
  }

  console.log(`Found ${all.length} images under assets/. Uploading to Cloudinary prefix "${CLOUD_PREFIX}/"`);
  if (DRY_RUN) console.log("Dry run enabled. No uploads will be performed.");

  for (const file of all) {
    const public_id = publicIdForAsset(file);
    const rel = path.relative(process.cwd(), file);

    if (DRY_RUN) {
      console.log(`[dry-run] ${rel} -> ${public_id}`);
      continue;
    }

    // Use "auto" so jpg/png/webp/svg all upload without special handling.
    await cloudinary.uploader.upload(file, {
      public_id,
      resource_type: "auto",
      overwrite: true,
      invalidate: true,
    });

    console.log(`${rel} -> ${public_id}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exitCode = 1;
});

