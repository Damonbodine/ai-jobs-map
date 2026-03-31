/**
 * Seed occupation images: Unsplash → Supabase Storage
 *
 * Uses Unsplash direct image URLs (no API key needed).
 * Each occupation gets a deterministic photo based on its category + title hash.
 * Skips occupations that already have an image in the bucket.
 *
 * Usage: npx tsx scripts/seed-occupation-images.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { Pool } from 'pg';

const SUPABASE_REF = 'nhjwpmfcpbfbzcaookkw';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('Service key loaded:', !!SUPABASE_KEY);
const BUCKET = 'occupation-images';
const STORAGE_URL = `https://${SUPABASE_REF}.supabase.co/storage/v1/object/${BUCKET}`;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Curated Unsplash photo IDs per category — these all produce good workplace imagery
const CATEGORY_PHOTOS: Record<string, string[]> = {
  management:      ['photo-1497366216548-37526070297c', 'photo-1553877714-c7ba56cf1a8c', 'photo-1531058020-2eee04b2dcf9', 'photo-1542744173-8e7e08888dc3'],
  business:        ['photo-1554224155-6726b3ff858f', 'photo-1460672985-8a3be0556e01', 'photo-1507679462-e4a5f2da478c', 'photo-1450101215-40e271406547'],
  computer:        ['photo-1461749280684-dccba630e2f6', 'photo-1498050108-e671ea9f9fda', 'photo-1555949800-03a7f4795e1c', 'photo-1517694712202-14dd9538aa97'],
  healthcare:      ['photo-1579684385127-1ef15d508118', 'photo-1551884170-3a4b77bbae0c', 'photo-1576091158-9c429f8339e8', 'photo-1584820927498-cfe5211fd8bf'],
  education:       ['photo-1503676260728-1c00da094a0b', 'photo-1524995050-0c989e454ab9', 'photo-1509062522246-3755977927d7', 'photo-1497633762265-9d179a990aa6'],
  legal:           ['photo-1589829545856-d10d557cf95f', 'photo-1507003098-702ee09b3bb2', 'photo-1450101215-40e271406547', 'photo-1521587760476-6c12a4b040da'],
  engineering:     ['photo-1581094794329-c8112a89af12', 'photo-1537151880-0caa7e0e11c8', 'photo-1504917595-c4a7c7fc3e6e', 'photo-1581092160-3e3a3e3a3e3a'],
  sales:           ['photo-1556761175-5973dc0f32e7', 'photo-1542744173-8e7e08888dc3', 'photo-1522071820-fede2eb38f07', 'photo-1552664730-d307ca884978'],
  science:         ['photo-1532094349884-543bc11b234d', 'photo-1530731100-28282eaca95c', 'photo-1507477201-57d24f1ebaff', 'photo-1576086213369-97a306d36557'],
  arts:            ['photo-1513364776144-60967b0f800f', 'photo-1460627433-b85e23b0c924', 'photo-1522120640-eca88e52cd4c', 'photo-1459749411175-04bf5292ceea'],
  social:          ['photo-1559027615-cd4628902d4a', 'photo-1573497019-136d8e1c3bd0', 'photo-1529070228-8e2b7c08e0b7', 'photo-1582213782179-e0d53f98f2ca'],
  construction:    ['photo-1504307651254-35680f356dfd', 'photo-1541888946-0b9b0b5b4e7a', 'photo-1529792440-ec6a28e8b0e5', 'photo-1503387762-592deb58ef4e'],
  food:            ['photo-1556910103-1c02745aae4d', 'photo-1555396966-19ed31911d9b', 'photo-1514066558-ec4ec8c8e0e7', 'photo-1466637574441-749b8f19452f'],
  protective:      ['photo-1517263904808-5dc91e3e7044', 'photo-1557654616-b3dcac087fb5', 'photo-1544966850-23c4a5a5db94', 'photo-1582139329536-e7284fece509'],
  transportation:  ['photo-1586528116311-ad8dd3c8310d', 'photo-1544620347-ef90a1500f3e', 'photo-1570294200-e25bf364cd4c', 'photo-1541899481282-d53bffe3c0d6'],
  installation:    ['photo-1621905251189-08b45d6a269e', 'photo-1504917595-c4a7c7fc3e6e', 'photo-1537151880-0caa7e0e11c8', 'photo-1581092160-3e3a3e3a3e3a'],
  production:      ['photo-1565043666747-69f6646db940', 'photo-1504917595-c4a7c7fc3e6e', 'photo-1537151880-0caa7e0e11c8', 'photo-1567789884554-0b844b597180'],
  personal:        ['photo-1560066984-138dadb4c035', 'photo-1522338789-0afbe2a3f9dc', 'photo-1516975334-ed1400ef39e5', 'photo-1540555700478-4be289fbec6e'],
  building:        ['photo-1416879595882-3373a0480b5b', 'photo-1558618666-1dbfc45dc98a', 'photo-1530587977-f3f2c515e8ac', 'photo-1494389945381-0fe114b8ea4b'],
  office:          ['photo-1497366216548-37526070297c', 'photo-1524995050-0c989e454ab9', 'photo-1568992687-dc4450c2a5a0', 'photo-1497215842964-222b430dc094'],
  farming:         ['photo-1416879595882-3373a0480b5b', 'photo-1464226066-cdc08fb9d9a5', 'photo-1500595046743-cd271d694d30', 'photo-1574943320219-553eb213f72d'],
};

function getCategoryKey(category: string): string {
  const lower = category.toLowerCase();
  for (const key of Object.keys(CATEGORY_PHOTOS)) {
    if (lower.includes(key)) return key;
  }
  return 'office';
}

function getUnsplashUrl(title: string, category: string): string {
  const catKey = getCategoryKey(category);
  const photos = CATEGORY_PHOTOS[catKey] || CATEGORY_PHOTOS['office'];
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const photoId = photos[hash % photos.length];
  return `https://images.unsplash.com/${photoId}?w=800&h=450&fit=crop&q=75`;
}

async function checkExists(slug: string): Promise<boolean> {
  const res = await fetch(
    `https://${SUPABASE_REF}.supabase.co/storage/v1/object/public/${BUCKET}/${slug}.jpg`,
    { method: 'HEAD' }
  );
  return res.ok;
}

async function upload(slug: string, buffer: ArrayBuffer): Promise<boolean> {
  const res = await fetch(`${STORAGE_URL}/${slug}.jpg`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  ✗ Upload failed for ${slug}: ${err.slice(0, 100)}`);
    return false;
  }
  return true;
}

async function main() {
  console.log('Fetching occupations from DB...\n');
  const result = await pool.query('SELECT slug, title, major_category FROM occupations ORDER BY title');
  const occupations = result.rows;
  console.log(`Found ${occupations.length} occupations\n`);

  let uploaded = 0, skipped = 0, failed = 0;

  for (let i = 0; i < occupations.length; i++) {
    const { slug, title, major_category } = occupations[i];
    const tag = `[${i + 1}/${occupations.length}]`;

    // Skip if already exists
    const exists = await checkExists(slug);
    if (exists) {
      skipped++;
      continue;
    }

    const url = getUnsplashUrl(title, major_category);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`${tag} ✗ Download failed for ${slug} (${res.status})`);
        failed++;
        continue;
      }

      const buffer = await res.arrayBuffer();
      const ok = await upload(slug, buffer);

      if (ok) {
        uploaded++;
        console.log(`${tag} ✓ ${title} (${(buffer.byteLength / 1024).toFixed(0)}KB)`);
      } else {
        failed++;
      }

      // Small delay every 10 images
      if (i % 10 === 0 && i > 0) await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`${tag} ✗ Error for ${slug}:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`\n✅ Done! Uploaded: ${uploaded} | Skipped: ${skipped} | Failed: ${failed}`);
  await pool.end();
}

main().catch(console.error);
