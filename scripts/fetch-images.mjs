// Downloads all Squarespace CDN images, resizes for each use context, saves locally.
// Run once: node scripts/fetch-images.mjs

import https from 'https';
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import sharp from 'sharp';

const CDN   = 'https://images.squarespace-cdn.com/content/v1/69788340c4a614347d63a918/';
const DEST  = 'public/images';

// uuid/filename → local path, max width, output format
// Widths are sized for each image's largest display context × 2× retina
const IMAGES = [
  // ── Logo ──────────────────────────────────────────────────────────────────
  { uuid: 'b117f40f-1347-4dd4-98f8-2d3903a148a9', file: 'logo+agnes.png',                               out: 'logo.webp',                         w: 440,  fmt: 'webp' },

  // ── Santander — carousel (displayed at ~960px wide at 640px height) ───────
  { uuid: '4d7bb668-f145-4b96-b6e0-3f3c26fd59ba', file: 'A031342-R1-24-25A.jpg',                        out: 'santander/carousel-1.jpg',           w: 1600, fmt: 'jpg'  },
  { uuid: '2f52eeb6-96d4-470c-b461-454ee1f0ae3b', file: 'A031341-R1-33-35.jpg',                         out: 'santander/carousel-2.jpg',           w: 1600, fmt: 'jpg'  },
  { uuid: '29b4c846-f2c9-4e1a-af96-5fc9c6bdc2be', file: 'A031342-R1-22-23A.jpg',                        out: 'santander/carousel-3.jpg',           w: 1600, fmt: 'jpg'  },
  { uuid: 'b2199425-a88e-493e-b541-44bad06d042f', file: 'A031341-R1-29-31.jpg',                         out: 'santander/carousel-4.jpg',           w: 1600, fmt: 'jpg'  },

  // ── Santander — gallery (cols-2 max at 960px → 480px × 2× = 960px) ────────
  { uuid: 'aabf6805-5eb6-4587-b12a-e59ce93a37aa', file: 'PICT3598.JPG',                                 out: 'santander/gallery-01.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '1769513330379-CSD5MR0AA0HMST8URNKD',   file: 'PICT3602.png',                                 out: 'santander/gallery-02.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '84c7ec12-1543-4fe3-8dce-497006e57347', file: 'PICT3599.JPG',                                 out: 'santander/gallery-03.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '8670b9b7-964d-451b-8ccc-4cefe8b63e3f', file: 'PICT3584.JPG',                                 out: 'santander/gallery-04.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '85d2bc91-f931-4375-95b6-57298e509576', file: 'PICT3590.JPG',                                 out: 'santander/gallery-05.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '6ba49bfd-b5ef-4865-b71b-8a4a03a6af2b', file: 'PICT3592.JPG',                                 out: 'santander/gallery-06.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '73b80f2e-78c9-4c75-b692-487afe1204e0', file: 'PICT3593.JPG',                                 out: 'santander/gallery-07.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: 'bae3124b-0f49-4d34-8a47-e46a7e73dcce', file: 'A031341-R1-07-9.jpg',                          out: 'santander/gallery-08.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: 'cbdd75a5-30ef-46ef-b158-ae7f4f40b1f3', file: 'A031341-R1-18-20.jpg',                         out: 'santander/gallery-09.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '35e747f1-38d1-41f2-bc99-79d5d5939d8c', file: 'A031341-R1-08-10.jpg',                         out: 'santander/gallery-10.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '00779f14-7a33-42ce-abe8-58a6d93aad3f', file: 'A031341-R1-35-37.jpg',                         out: 'santander/gallery-11.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '4cd565cd-de33-4217-8148-2a8114dda8ba', file: 'PICT3597.JPG',                                 out: 'santander/gallery-12.jpg',           w: 960,  fmt: 'jpg'  },
  { uuid: '5e6b6c58-352f-4f54-b6f9-7f8b176b0b51', file: 'PICT3604.JPG',                                 out: 'santander/gallery-13.jpg',           w: 960,  fmt: 'jpg'  },

  // ── Echoes of Comfort — masonry (1/3 of 1380px × 2× retina = 920px) ──────
  { uuid: '6b385efd-0bdb-4f78-9074-1d28e2c0469d', file: 'llabiafinal-004.jpg',                          out: 'echoes/01.jpg',                      w: 1000, fmt: 'jpg'  },
  { uuid: 'a2432303-900b-43b7-a383-006bbf200aa2', file: 'llabiafinal-002.jpg',                          out: 'echoes/02.jpg',                      w: 1000, fmt: 'jpg'  },
  { uuid: '1076f59d-8d65-41f2-94f3-8cbadf4ac880', file: 'llabiafinal-024.jpg',                          out: 'echoes/03.jpg',                      w: 1000, fmt: 'jpg'  },
  { uuid: '6a5d62a1-753c-4b39-b618-bfea05f8a376', file: 'llabiafinal-021.jpg',                          out: 'echoes/04.jpg',                      w: 1000, fmt: 'jpg'  },
  { uuid: 'b09eb36b-2951-4d1f-a4c9-48d67027dbfe', file: 'llabiafinal-006.jpg',                          out: 'echoes/05.jpg',                      w: 1000, fmt: 'jpg'  },
  { uuid: '9ab0e4ae-6ebd-47d3-954e-075a5e05cf6d', file: 'llabiafinal-003.jpg',                          out: 'echoes/06.jpg',                      w: 1000, fmt: 'jpg'  },
  { uuid: 'e8bd4a3a-e834-47a1-8951-1a8c47ce5126', file: 'llabiafinal-028.jpg',                          out: 'echoes/07.jpg',                      w: 1000, fmt: 'jpg'  },
  { uuid: 'b1bd2fad-028d-47d8-a884-9e6c74c29d3f', file: 'llabiafinal-005.jpg',                          out: 'echoes/08.jpg',                      w: 1000, fmt: 'jpg'  },

  // ── Publicis Commerce ─────────────────────────────────────────────────────
  // Wide desktop screenshot (50% of page → 690px × 2× = 1380px)
  { uuid: 'a22dbde5-3344-4135-8ba8-e7df579eb3ad', file: 'Captura+de+pantalla+2026-03-14+a+las+19.32.15.png', out: 'publicis/wide.webp',            w: 1400, fmt: 'webp' },
  // Phone screenshots (1/3 of page → 460px × 2× = 920px)
  { uuid: 'fe075514-c916-4006-8921-528cd08006db', file: 'Captura+de+pantalla+2026-02-27+a+las+10.30.56.png', out: 'publicis/screen-mid-left.webp', w: 920,  fmt: 'webp' },
  { uuid: '849e912b-4c5d-4217-ba7d-557a56f42d29', file: 'Captura+de+pantalla+2026-02-27+a+las+10.32.04.png', out: 'publicis/screen-mid-center.webp',w: 920, fmt: 'webp' },
  { uuid: '16ca8c9e-382a-452f-a9f9-9106d19118e3', file: 'Captura+de+pantalla+2026-02-27+a+las+10.32.28.png', out: 'publicis/screen-mid-right.webp',w: 920,  fmt: 'webp' },
  { uuid: '1b9420c1-c139-439f-a8ce-b67b05888183', file: 'Captura+de+pantalla+2026-02-27+a+las+10.32.54.png', out: 'publicis/screen-bot-left.webp', w: 920,  fmt: 'webp' },
  { uuid: '221462e9-5c23-4f28-a420-bcb3130a2b60', file: 'Captura+de+pantalla+2026-02-27+a+las+10.34.24.png', out: 'publicis/screen-bot-center.webp',w: 920, fmt: 'webp' },

  // ── Between the Sheets ────────────────────────────────────────────────────
  // Wide screenshot (50% of page → 690px × 2× = 1380px)
  { uuid: '98ce9fbb-1bc0-46da-b8b8-79a779edb7f5', file: 'Captura+de+pantalla+2026-03-14+a+las+19.24.00.png', out: 'between/wide.webp',             w: 1400, fmt: 'webp' },
  // Gallery photos (1/3 of page × 2× retina = 920px — also used as carousel slides)
  { uuid: 'a6f6a088-738a-4366-b681-a635e2dea399', file: 'tempImageaAH5Pi.jpg',                          out: 'between/photo-1.jpg',                w: 1000, fmt: 'jpg'  },
  { uuid: 'd083bb65-91a4-4173-91c8-d819a00fec1d', file: 'tempImageC5Bpwl.jpg',                          out: 'between/photo-2.jpg',                w: 1000, fmt: 'jpg'  },
  { uuid: 'c34724c6-f947-4789-8fab-c1e68cf10eed', file: 'tempImagebugiGK.jpg',                          out: 'between/photo-3.jpg',                w: 1000, fmt: 'jpg'  },
  { uuid: '98cbeb00-fadc-4278-9fd5-b523aca42cc4', file: 'IMG_0585.JPG',                                 out: 'between/photo-4.jpg',                w: 1000, fmt: 'jpg'  },
  { uuid: '17b326c2-db1e-491f-9b88-5879203bb4af', file: 'IMG_0590.JPG',                                 out: 'between/photo-5.jpg',                w: 1000, fmt: 'jpg'  },
  { uuid: '061bdea0-4d1b-4146-a25a-2d04dee32b9e', file: 'IMG_0587.JPG',                                 out: 'between/photo-6.jpg',                w: 1000, fmt: 'jpg'  },

  // ── @byagnesmercade — grid screenshots (50% of page → 690px × 2× = 1380px)
  { uuid: '8598cb0c-46b7-402b-aeed-34b6bd3a0599', file: 'grid1_2026-05-21+a+las+19.22.34.png',          out: 'byagnes/grid-1.webp',                w: 1400, fmt: 'webp' },
  { uuid: 'f6c6c0ec-b4f9-424c-ab36-09c7f9de06c4', file: 'grid+2_2026-05-21+a+las+19.24.38.png',        out: 'byagnes/grid-2.webp',                w: 1400, fmt: 'webp' },

  // ── @byagnesmercade — polaroid carousel (displayed at ~350px → 700px for 2×)
  // Slides 01–03, 10–18 are carousel-exclusive
  { uuid: 'c1e121fa-af5b-47f2-adc1-47465a1e5fa4', file: 'Captura+de+pantalla+2026-05-21+a+las+19.36.39.png', out: 'byagnes/slide-01.webp',        w: 700,  fmt: 'webp' },
  { uuid: '852be83c-6075-442d-825d-52d4caa716a9', file: 'IMG_2215.jpg',                                 out: 'byagnes/slide-02.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: '723aea2d-2910-4dcd-9fb0-946dab489fb5', file: 'Captura+de+pantalla+2026-05-21+a+las+19.30.30.png', out: 'byagnes/slide-03.webp',        w: 700,  fmt: 'webp' },
  // Slides 04–09 reuse between/photo-* (same UUID, stored at 1000px there — fine for carousel)
  { uuid: '6b18317d-609b-42f2-8242-5fcbfd5a83ca', file: 'A031341-R1-33-35.jpg',                         out: 'byagnes/slide-10.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: '59616ea5-f091-4ee0-bd9c-a7cf66a130a3', file: 'tempImageNoNqIh.jpg',                          out: 'byagnes/slide-11.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: '633dfabc-e7c3-4593-9e9b-c0ec4f59f4d4', file: 'IMG_3084.jpg',                                 out: 'byagnes/slide-12.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: 'dedb0671-7509-4c9c-8c78-ef2cb6bd55c8', file: 'llabiafinal-001.jpg',                          out: 'byagnes/slide-13.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: '418f7af3-5456-4387-95c6-b9e979c1b52c', file: 'tempImage8SbkFV.jpg',                          out: 'byagnes/slide-14.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: 'dfd5d453-add9-4c93-b285-6d45baf81567', file: 'tempImage80snwj.jpg',                          out: 'byagnes/slide-15.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: '5e1c5391-cfe1-43bf-875b-efc8ef98341b', file: 'tempImageRExrJj.jpg',                          out: 'byagnes/slide-16.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: '5017f1f2-46b0-4c93-9b35-48cf08b0fafa', file: 'tempImageEJliQ2.jpg',                          out: 'byagnes/slide-17.jpg',               w: 700,  fmt: 'jpg'  },
  { uuid: '2f5fb65d-9fb3-4c9c-ad64-ef792998e856', file: 'Captura+de+pantalla+2026-05-21+a+las+19.40.00.png', out: 'byagnes/slide-18.webp',        w: 700,  fmt: 'webp' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function download(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

async function process(buf, { w, fmt }) {
  const img = sharp(buf).resize(w, null, { withoutEnlargement: true });
  if (fmt === 'webp') return img.webp({ quality: 85 }).toBuffer();
  if (fmt === 'jpg')  return img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return img.png({ compressionLevel: 9 }).toBuffer();
}

// ── main ─────────────────────────────────────────────────────────────────────

const dirs = [...new Set(IMAGES.map(i => path.join(DEST, path.dirname(i.out))))];
for (const d of dirs) fs.mkdirSync(d, { recursive: true });

let ok = 0, fail = 0;
for (const img of IMAGES) {
  const outPath = path.join(DEST, img.out);
  if (fs.existsSync(outPath)) {
    console.log(`  skip  ${img.out}`);
    ok++;
    continue;
  }
  const srcUrl = `${CDN}${img.uuid}/${img.file}?format=2500w`;
  try {
    const raw = await download(srcUrl);
    const buf = await process(raw, img);
    fs.writeFileSync(outPath, buf);
    const kb = (buf.length / 1024).toFixed(0);
    console.log(`  ✓  ${img.out}  (${kb} KB)`);
    ok++;
  } catch (e) {
    console.error(`  ✗  ${img.out}  ${e.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} ok, ${fail} failed`);
