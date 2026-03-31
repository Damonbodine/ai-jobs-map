/**
 * Fetches Pexels images for all occupations and uploads to Supabase Storage.
 *
 * Usage: npx tsx scripts/seed-occupation-images.ts
 *
 * Throttled to ~1 req/sec to stay within Pexels rate limits.
 * Skips occupations that already have an image in storage.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY!;
const SUPABASE_URL = 'https://nhjwpmfcpbfbzcaookkw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oandwbWZjcGJmYnpjYW9va2t3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3NDkxMCwiZXhwIjoyMDkwNTUwOTEwfQ.UrWG3d4t8PDnrvhQ-IeNWimUj0Wq61YfNQ8f-9mTSf8';
const BUCKET = 'occupation-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getExistingImages(): Promise<Set<string>> {
  const existing = new Set<string>();
  const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  if (error) {
    console.log('Warning: could not list existing images:', error.message);
    return existing;
  }
  // Paginate if needed
  let allFiles = data || [];
  let offset = 1000;
  while (data && data.length === 1000) {
    const { data: more } = await supabase.storage.from(BUCKET).list('', { limit: 1000, offset });
    if (!more || more.length === 0) break;
    allFiles = [...allFiles, ...more];
    offset += 1000;
  }
  for (const file of allFiles) {
    existing.add(file.name.replace('.jpg', ''));
  }
  return existing;
}

async function fetchPexelsImage(query: string): Promise<Buffer | null> {
  const searchQuery = `${query} professional workplace`;
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: PEXELS_API_KEY } }
  );

  if (!res.ok) {
    console.log(`  Pexels API error: ${res.status}`);
    return null;
  }

  const data = await res.json();
  const photo = data.photos?.[0];
  if (!photo) return null;

  // Download the medium-size image
  const imgRes = await fetch(photo.src.medium);
  if (!imgRes.ok) return null;

  return Buffer.from(await imgRes.arrayBuffer());
}

async function uploadToStorage(slug: string, imageBuffer: Buffer): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${slug}.jpg`, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.log(`  Upload error for ${slug}:`, error.message);
    return false;
  }
  return true;
}

async function main() {
  console.log('🔄 Seeding occupation images to Supabase Storage...\n');

  // Get all occupations
  const { rows: occupations } = await pool.query(
    'SELECT title, slug FROM occupations ORDER BY title'
  );
  console.log(`📋 ${occupations.length} occupations to process.\n`);

  // Check which already have images
  const existing = await getExistingImages();
  console.log(`✅ ${existing.size} images already in storage.\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < occupations.length; i++) {
    const { title, slug } = occupations[i];

    if (existing.has(slug)) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${occupations.length}] ${title}... `);

    const imageBuffer = await fetchPexelsImage(title);
    if (!imageBuffer) {
      console.log('❌ no image found');
      failed++;
      // Throttle
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    const success = await uploadToStorage(slug, imageBuffer);
    if (success) {
      console.log(`✅ (${(imageBuffer.length / 1024).toFixed(0)}KB)`);
      uploaded++;
    } else {
      failed++;
    }

    // Throttle: ~1 request per second
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log(`\n🏁 Done. Uploaded: ${uploaded} | Skipped: ${skipped} | Failed: ${failed}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
