import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import type { MajorCategory } from '../lib/db/schema';

const { Client } = pg;

const categoryMapping: Record<string, MajorCategory> = {
  'Management occupations': 'Management',
  'Business and financial operations occupations': 'Business and Financial Operations',
  'Computer and mathematical occupations': 'Computer and Mathematical',
  'Architecture and engineering occupations': 'Architecture and Engineering',
  'Life physical and social science occupations': 'Life Physical and Social Science',
  'Community and social service occupations': 'Community and Social Service',
  'Legal occupations': 'Legal',
  'Educational instruction and library occupations': 'Educational Instruction and Library',
  'Arts design entertainment sports and media occupations': 'Arts Design Entertainment Sports and Media',
  'Healthcare practitioners and technical occupations': 'Healthcare Practitioners and Technical',
  'Healthcare support occupations': 'Healthcare Support',
  'Protective service occupations': 'Protective Service',
  'Food preparation and serving related occupations': 'Food Preparation and Serving',
  'Building and grounds cleaning and maintenance occupations': 'Building and Grounds Cleaning and Maintenance',
  'Personal care and service occupations': 'Personal Care and Service',
  'Sales and related occupations': 'Sales and Related',
  'Office and administrative support occupations': 'Office and Administrative Support',
  'Farming fishing and forestry occupations': 'Farming Fishing and Forestry',
  'Construction and extraction occupations': 'Construction and Extraction',
  'Installation maintenance and repair occupations': 'Installation Maintenance and Repair',
  'Production occupations': 'Production',
  'Transportation and material moving occupations': 'Transportation and Material Moving',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CsvRow {
  id: string;
  major_category: string;
  occupation: string;
}

async function seed() {
  console.log('Starting seed...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL!,
  });
  await client.connect();

  const csvPath = path.join(process.cwd(), 'bls_occupations.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as CsvRow[];

  console.log(`Found ${records.length} occupations to seed`);

  let inserted = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const majorCategory = categoryMapping[record.major_category];
      
      if (!majorCategory) {
        console.warn(`Unknown category: ${record.major_category}`);
        continue;
      }

      const slug = slugify(record.occupation);

      await client.query(
        `INSERT INTO occupations (title, slug, major_category, sub_category)
         VALUES ($1, $2, $3, NULL)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           major_category = EXCLUDED.major_category`,
        [record.occupation, slug, majorCategory]
      );

      inserted++;
      if (inserted % 50 === 0) {
        console.log(`Inserted ${inserted} occupations...`);
      }
    } catch (error) {
      errors++;
      console.error(`Error inserting ${record.occupation}:`, error);
    }
  }

  await client.end();

  console.log(`
Seed complete!
- Inserted: ${inserted}
- Errors: ${errors}
- Total: ${records.length}
  `);
}

seed().catch(console.error);
