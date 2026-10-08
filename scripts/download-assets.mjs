import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesDirectory = path.join(projectRoot, "public", "images");
const fontsDirectory = path.join(projectRoot, "public", "fonts");

// Photography is licensed under the Pexels License. Source/author details:
// content/image-credits.ts and docs/assets.md. All images remain photographs;
// no image generation is used. hero-salon.jpg is maintained manually; see
// docs/assets.md.
const imageAssets = [
  { name: "salon-interior-01.jpg", id: 7750098, width: 1600 },
  { name: "salon-interior-02.jpg", id: 7750099, width: 1600 },
  { name: "service-haircut.jpg", id: 3992873 },
  { name: "service-color.jpg", id: 3993312 },
  { name: "service-balayage.jpg", id: 16153366 },
  { name: "service-treatment.jpg", id: 3993451 },
  { name: "service-styling.jpg", id: 7440055 },
  { name: "service-extensions.jpg", id: 14730878 },
  { name: "stylist-01.jpg", id: 29847702, portrait: true },
  { name: "stylist-02.jpg", id: 18935840, portrait: true },
  { name: "stylist-03.jpg", id: 32809130, portrait: true },
  { name: "stylist-04.jpg", id: 30576237, portrait: true },
  { name: "gallery-01.jpg", id: 3992873 },
  { name: "gallery-03.jpg", id: 16153366 },
  { name: "gallery-04.jpg", id: 3993463 },
  { name: "gallery-05.jpg", id: 14730878 },
  { name: "gallery-06.jpg", id: 3993312 },
  { name: "gallery-07.jpg", id: 7750098 },
  { name: "gallery-08.jpg", id: 5385584 },
  { name: "home-service-haircut.jpg", id: 3356170 },
  { name: "home-service-color.jpg", id: 3993323 },
  { name: "home-service-balayage.jpg", id: 35267461 },
  { name: "home-service-treatment.jpg", id: 3993444 },
  { name: "home-service-styling.jpg", id: 10318040 },
  { name: "home-service-extensions.jpg", id: 38651013 },
];

const fontAssets = [
  ["cormorant-garamond.LICENSE.txt", "cormorantgaramond/OFL.txt"],
  ["geist.LICENSE.txt", "geist/OFL.txt"],
];

const woff2FontAssets = [
  { name: "cormorant-garamond.woff2", family: "Cormorant Garamond", style: "normal", weight: "300 700" },
  { name: "cormorant-garamond-italic.woff2", family: "Cormorant Garamond", style: "italic", weight: "300 700" },
  { name: "geist.woff2", family: "Geist", style: "normal", weight: "100 900" },
];

const googleFontsCssUrl = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Geist:wght@100..900&display=swap";
const modernBrowserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const portugueseAccents = "áãâàéêíóôõúçÁÃÂÀÉÊÍÓÔÕÚÇ";

async function download(url, headers = {}) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

await mkdir(imagesDirectory, { recursive: true });
await mkdir(fontsDirectory, { recursive: true });
const sourceImages = new Map();

const homeServicesOnly = process.argv.includes("--home-services-only");
const selectedImageAssets = process.argv.includes("--fonts-only") ? []
  : homeServicesOnly ? imageAssets.filter((asset) => asset.name.startsWith("home-service-"))
  : imageAssets;

for (const asset of selectedImageAssets) {
  if (!sourceImages.has(asset.id)) {
    const localSource = path.join(imagesDirectory, "_review", "full", `${asset.id}.jpg`);
    const source = await readFile(localSource).catch(() => download(
      `https://images.pexels.com/photos/${asset.id}/pexels-photo-${asset.id}.jpeg?auto=compress&cs=tinysrgb&w=1920&q=90`,
    ));
    sourceImages.set(asset.id, source);
  }

  let image = sharp(sourceImages.get(asset.id)).rotate();
  if (asset.portrait) {
    image = image.resize(1200, 1500, { fit: "cover", position: "attention" });
  } else {
    image = image.resize({ width: asset.width ?? 1200, withoutEnlargement: true });
  }

  const limit = 350_000;
  const base = await image.png().toBuffer();
  let quality = 83;
  let output;
  do {
    output = await sharp(base).jpeg({ quality, mozjpeg: true }).toBuffer();
    quality -= 5;
  } while (output.length > limit && quality >= 53);
  if (output.length > limit) throw new Error(`Image exceeds target size: ${asset.name}`);
  await writeFile(path.join(imagesDirectory, asset.name), output);
  const metadata = await sharp(output).metadata();
  console.log(`${asset.name}: ${metadata.width}×${metadata.height}, ${(output.length / 1024).toFixed(0)} KiB`);
}

if (!process.argv.includes("--images-only") && !homeServicesOnly) {
  for (const [name, source] of fontAssets) {
    const bytes = await download(`https://raw.githubusercontent.com/google/fonts/main/ofl/${source}?download=1`);
    await writeFile(path.join(fontsDirectory, name), bytes);
    console.log(`${name}: ${(bytes.length / 1024).toFixed(0)} KiB`);
  }

  const cssBytes = await download(googleFontsCssUrl, { "User-Agent": modernBrowserAgent });
  const css = cssBytes.toString("utf8");
  const latinFaces = [...css.matchAll(/\/\* latin \*\/\s*@font-face\s*\{([^}]+)\}/g)].map((match) => match[1]);

  for (const asset of woff2FontAssets) {
    const face = latinFaces.find((candidate) =>
      candidate.includes(`font-family: '${asset.family}';`) &&
      candidate.includes(`font-style: ${asset.style};`) &&
      candidate.includes(`font-weight: ${asset.weight};`),
    );
    if (!face) throw new Error(`Missing variable Latin font: ${asset.name}`);

    const sourceUrl = face.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)?.[1];
    const unicodeRange = face.match(/unicode-range:\s*([^;]+);/)?.[1];
    if (!sourceUrl || !unicodeRange) throw new Error(`Missing font source or Unicode range: ${asset.name}`);

    const ranges = unicodeRange.split(",").map((range) => {
      const [start, end = start] = range.trim().replace(/^U\+/i, "").split("-");
      return [Number.parseInt(start, 16), Number.parseInt(end, 16)];
    });
    const hasPortugueseAccents = [...portugueseAccents].every((character) =>
      ranges.some(([start, end]) => {
        const codePoint = character.codePointAt(0);
        return codePoint >= start && codePoint <= end;
      }),
    );
    if (!hasPortugueseAccents) throw new Error(`Portuguese accents absent from Unicode range: ${asset.name}`);

    const bytes = await download(sourceUrl);
    if (bytes.toString("ascii", 0, 4) !== "wOF2") throw new Error(`Invalid WOFF2: ${asset.name}`);
    await writeFile(path.join(fontsDirectory, asset.name), bytes);
    console.log(`${asset.name}: ${(bytes.length / 1024).toFixed(0)} KiB, Portuguese accents covered`);
  }
}
