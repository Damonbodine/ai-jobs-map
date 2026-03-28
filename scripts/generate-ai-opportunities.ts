import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

if (!OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY not found in .env.local');
  process.exit(1);
}

const MODEL = 'liquid/lfm-2.5-1.2b-instruct:free';
const MAX_RETRIES = 3;
const DELAY_BETWEEN_REQUESTS = 5000;

interface AIOpportunity {
  title: string;
  description: string;
  category: string;
  impact_level: number;
  effort_level: number;
}

const SYSTEM_PROMPT = `You are an AI strategy consultant. For the given occupation, generate 3-5 specific AI opportunities.

IMPORTANT: Return ONLY valid JSON array, no other text.

Each opportunity must have these exact fields:
{
  "title": "Brief opportunity title",
  "description": "1-2 sentence description of the AI opportunity",
  "category": "task_automation|decision_support|research_discovery|communication|creative_assistance|data_analysis|learning_education",
  "impact_level": 1-5,
  "effort_level": 1-5
}

Categories:
- task_automation: Automating repetitive manual tasks
- decision_support: AI helping make better decisions
- research_discovery: Finding insights in data or research
- communication: Improving communication and messaging
- creative_assistance: Helping with creative tasks
- data_analysis: Analyzing data and trends
- learning_education: Learning and skill development

Return a JSON array: [{"title":"...", "description":"...", "category":"...", "impact_level":3, "effort_level":2}]`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseJsonFromResponse(content: string): AIOpportunity[] | null {
  try {
    return JSON.parse(content);
  } catch {
    const arrayMatch = content.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        let cleaned = arrayMatch[0]
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}')
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":');
        try {
          return JSON.parse(cleaned);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

async function generateAIOpportunities(occupationTitle: string, category: string): Promise<AIOpportunity[] | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-jobs-map.vercel.app',
          'X-Title': 'AI Jobs Map',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { 
              role: 'user', 
              content: `Generate AI opportunities for: ${occupationTitle} (${category})`
            }
          ],
          temperature: 0.5,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in response');
      }

      const opportunities = parseJsonFromResponse(content);
      
      if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) {
        throw new Error('Invalid or empty JSON response');
      }

      const validCategories = ['task_automation', 'decision_support', 'research_discovery', 'communication', 'creative_assistance', 'data_analysis', 'learning_education'];
      
      return opportunities.map(o => ({
        title: o.title || 'AI Opportunity',
        description: o.description || '',
        category: validCategories.includes(o.category) ? o.category : 'task_automation',
        impact_level: typeof o.impact_level === 'number' ? Math.min(5, Math.max(1, o.impact_level)) : 3,
        effort_level: typeof o.effort_level === 'number' ? Math.min(5, Math.max(1, o.effort_level)) : 3,
      }));

    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (isAbort) {
        console.log(`  Timeout after 45s`);
      }
      if (attempt < MAX_RETRIES) {
        const delay = attempt * 5000;
        console.log(`  Retry ${attempt}/${MAX_RETRIES} in ${delay/1000}s...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  return null;
}

async function insertAIOpportunities(occupationId: number, opportunities: AIOpportunity[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const opp of opportunities) {
      await client.query(
        `INSERT INTO ai_opportunities 
         (occupation_id, title, description, category, impact_level, effort_level, is_ai_generated, is_approved, source)
         VALUES ($1, $2, $3, $4, $5, $6, true, false, 'ai_generation')`,
        [
          occupationId,
          opp.title,
          opp.description,
          opp.category,
          opp.impact_level,
          opp.effort_level,
        ]
      );
    }

    await client.query('COMMIT');
    return opportunities.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const batchSize = parseInt(args[0] || '5');
  const offset = parseInt(args[1] || '0');

  console.log('='.repeat(60));
  console.log('AI Jobs Map - AI Opportunities Generator');
  console.log(`Model: ${MODEL}`);
  console.log(`Batch size: ${batchSize}, Offset: ${offset}`);
  console.log('='.repeat(60));

  const { rows: [{ count: totalRemaining }] } = await pool.query(
    `SELECT COUNT(*) as count 
     FROM occupations o
     LEFT JOIN ai_opportunities ao ON o.id = ao.occupation_id
     WHERE ao.id IS NULL`
  );
  console.log(`\nOccupations remaining: ${totalRemaining}\n`);

  const { rows: occupations } = await pool.query(
    `SELECT o.id, o.title, o.major_category 
     FROM occupations o
     LEFT JOIN ai_opportunities ao ON o.id = ao.occupation_id
     WHERE ao.id IS NULL
     ORDER BY o.id
     LIMIT $1 OFFSET $2`,
    [batchSize, offset]
  );

  if (occupations.length === 0) {
    console.log('All occupations already processed!');
    await pool.end();
    return;
  }

  console.log(`Processing ${occupations.length} occupations...\n`);

  let success = 0;
  let errors = 0;
  let totalOpportunities = 0;
  const startTime = Date.now();

  for (let i = 0; i < occupations.length; i++) {
    const occupation = occupations[i];
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const progress = `[${i + 1}/${occupations.length}]`;

    try {
      console.log(`${progress} Processing: ${occupation.title}...`);
      
      const opportunities = await generateAIOpportunities(occupation.title, occupation.major_category);
      
      if (opportunities && opportunities.length > 0) {
        const count = await insertAIOpportunities(occupation.id, opportunities);
        totalOpportunities += count;
        success++;
        console.log(`  ✓ Generated ${count} opportunities (${elapsed}s elapsed)`);
      } else {
        errors++;
        console.log(`  ✗ Failed to generate opportunities`);
      }

      if (i < occupations.length - 1) {
        await sleep(DELAY_BETWEEN_REQUESTS);
      }

    } catch (error) {
      errors++;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  ✗ Error: ${errMsg.substring(0, 80)}`);
    }

    if ((i + 1) % 5 === 0) {
      console.log(`\n--- Progress: ${success} success, ${errors} errors, ${totalOpportunities} opportunities generated ---\n`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('BATCH COMPLETE');
  console.log(`Success: ${success} | Errors: ${errors} | Opportunities: ${totalOpportunities}`);
  console.log(`Time: ${totalTime} minutes`);
  console.log(`Remaining: ${parseInt(totalRemaining) - success} occupations`);
  console.log('='.repeat(60));
  console.log(`\nRun next batch: DATABASE_URL="..." npx tsx scripts/generate-ai-opportunities.ts ${batchSize} ${offset + success}`);

  await pool.end();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
