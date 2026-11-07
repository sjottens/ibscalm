// Builds public/favicon.ico from the PNG favicons (ICO files may contain PNG images directly).
// Usage: node scripts/make-favicon.mjs
import { readFileSync, writeFileSync } from "node:fs";

const files = ["public/favicon-16.png", "public/favicon-32.png", "public/favicon-64.png"];
const images = files.map((f) => {
  const data = readFileSync(f);
  return { data, width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
});

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(images.length, 4);

let offset = 6 + 16 * images.length;
const entries = images.map(({ data, width, height }) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(width >= 256 ? 0 : width, 0);
  e.writeUInt8(height >= 256 ? 0 : height, 1);
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += data.length;
  return e;
});

writeFileSync("public/favicon.ico", Buffer.concat([header, ...entries, ...images.map((i) => i.data)]));
console.log(`public/favicon.ico: ${images.map((i) => `${i.width}x${i.height}`).join(", ")}`);
