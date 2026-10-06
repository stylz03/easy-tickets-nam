import fs from "node:fs/promises";
import sharp from "sharp";

const source = "public/brand/easy-tickets-logo.png";
const output = "public/pwa";
await fs.mkdir(output, { recursive: true });

const lockup = await sharp(source)
  .extract({ left: 104, top: 150, width: 816, height: 555 })
  .png()
  .toBuffer();

async function icon(size, file, background = "#f7f8fc", widthRatio = 0.78) {
  const width = Math.round(size * widthRatio);
  const art = await sharp(lockup).resize({ width, height: Math.round(size * 0.62), fit: "inside" }).png().toBuffer();
  const metadata = await sharp(art).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: art, left: Math.round((size - (metadata.width ?? width)) / 2), top: Math.round((size - (metadata.height ?? size * .6)) / 2) }])
    .png()
    .toFile(`${output}/${file}`);
}

await Promise.all([
  icon(192, "icon-192.png"),
  icon(512, "icon-512.png"),
  icon(512, "icon-maskable-512.png", "#edf2ff", 0.68),
  icon(180, "apple-touch-icon.png", "#ffffff", 0.8),
]);
