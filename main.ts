import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// The entry is a single pre-rendered front page. This script validates the
// committed PNG, then publishes it unchanged to the directory make.fun reads.
const ROOT = fileURLToPath(new URL(".", import.meta.url));
const SOURCE = join(ROOT, "entry.png");
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const OUT_FILE = join(OUT_DIR, "entry.png");
const MAX_BYTES = 1_048_576;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const image = readFileSync(SOURCE);

if (!image.subarray(0, 8).equals(PNG_SIGNATURE)) {
  throw new Error("entry.png does not start with a valid PNG signature");
}

if (image.length > MAX_BYTES) {
  throw new Error(`entry.png is ${image.length} bytes; the limit is ${MAX_BYTES}`);
}

// IHDR is the first chunk: 8-byte signature, 4-byte length, 4-byte type,
// then 4-byte width and 4-byte height.
const width = image.readUInt32BE(16);
const height = image.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  throw new Error(`entry.png is ${width}x${height}; expected 1024x1024`);
}

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(SOURCE, OUT_FILE);

console.log(`wrote ${OUT_FILE} (${width}x${height}, ${image.length} bytes)`);
