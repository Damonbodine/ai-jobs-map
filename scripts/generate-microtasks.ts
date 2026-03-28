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

// Free model - slower but no cost
const MODEL = 'liquid/lfm-2.5-1.2b-instruct:free';
const MAX_RETRIES = 3;
const DELAY_BETWEEN_REQUESTS = 5000; // 5 seconds for free tier
const DELAY_BETWEEN_BATCHES = 10000; // 10 seconds between batches

interface MicroTask {
  task_name: string;
  task_description: string;
  frequency: string;
  ai_applicable: boolean;
  ai_how_it_helps: string | null;
  ai_impact_level: number | null;
  ai_effort_to_implement: number | null;
  ai_category: string | null;
  ai_tools: string | null;
}

const SYSTEM_PROMPT = `You are a career analyst. For the given occupation, generate 10-15 specific micro-tasks.

IMPORTANT: Return ONLY valid JSON array, no other text.

Each task must have these exact fields:
{
  "task_name": "Brief task name",
  "task_description": "1-2 sentence description",
  "frequency": "daily|weekly|monthly|as-needed",
  "ai_applicable": true/false,
  "ai_how_it_helps": "How AI helps (or null if not applicable)",
  "ai_impact_level": 1-5 or null,
  "ai_effort_to_implement": 1-5 or null,
  "ai_category": "task_automation|decision_support|research_discovery|communication|creative_assistance|data_analysis|learning_education" or null,
  "ai_tools": "Comma-separated tool names (or null)"
}

Return a JSON array: [{"task_name":"...", ...}]`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseJsonFromResponse(content: string): MicroTask[] | null {
  // Try multiple parsing strategies
  try {
    // Direct parse
    return JSON.parse(content);
  } catch {
    // Try to find JSON array in response
    const arrayMatch = content.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // Try to fix common issues
        let cleaned = arrayMatch[0]
          .replace(/,\s*]/g, ']') // trailing commas
          .replace(/,\s*}/g, '}') // trailing commas in objects
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // unquoted keys
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

async function generateMicroTasks(occupationTitle: string, category: string): Promise<MicroTask[] | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

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
              content: `Generate micro-tasks for: ${occupationTitle} (${category})`
            }
          ],
          temperature: 0.5,
          max_tokens: 3000,
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

      const tasks = parseJsonFromResponse(content);
      
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        throw new Error('Invalid or empty JSON response');
      }

      // Validate and normalize tasks
      return tasks.map(t => ({
        task_name: t.task_name || 'Unknown task',
        task_description: t.task_description || '',
        frequency: ['daily', 'weekly', 'monthly', 'as-needed'].includes(t.frequency) ? t.frequency : 'as-needed',
        ai_applicable: t.ai_applicable !== false,
        ai_how_it_helps: t.ai_how_it_helps || null,
        ai_impact_level: typeof t.ai_impact_level === 'number' ? Math.min(5, Math.max(1, t.ai_impact_level)) : null,
        ai_effort_to_implement: typeof t.ai_effort_to_implement === 'number' ? Math.min(5, Math.max(1, t.ai_effort_to_implement)) : null,
        ai_category: t.ai_category || null,
        ai_tools: t.ai_tools || null,
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

async function insertMicroTasks(occupationId: number, tasks: MicroTask[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const task of tasks) {
      await client.query(
        `INSERT INTO job_micro_tasks 
         (occupation_id, task_name, task_description, frequency, ai_applicable, ai_how_it_helps, ai_impact_level, ai_effort_to_implement, ai_category, ai_tools)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          occupationId,
          task.task_name,
          task.task_description,
          task.frequency,
          task.ai_applicable,
          task.ai_how_it_helps,
          task.ai_impact_level,
          task.ai_effort_to_implement,
          task.ai_category,
          task.ai_tools,
        ]
      );
    }

    await client.query('COMMIT');
    return tasks.length;
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
  console.log('AI Jobs Map - Micro-Task Generator');
  console.log(`Model: ${MODEL}`);
  console.log(`Batch size: ${batchSize}, Offset: ${offset}`);
  console.log('='.repeat(60));

  // Get total count remaining
  const { rows: [{ count: totalRemaining }] } = await pool.query(
    `SELECT COUNT(*) as count 
     FROM occupations o
     LEFT JOIN job_micro_tasks jmt ON o.id = jmt.occupation_id
     WHERE jmt.id IS NULL`
  );
  console.log(`\nOccupations remaining: ${totalRemaining}\n`);

  const { rows: occupations } = await pool.query(
    `SELECT o.id, o.title, o.major_category 
     FROM occupations o
     LEFT JOIN job_micro_tasks jmt ON o.id = jmt.occupation_id
     WHERE jmt.id IS NULL
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
  let totalTasks = 0;
  const startTime = Date.now();

  for (let i = 0; i < occupations.length; i++) {
    const occupation = occupations[i];
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const progress = `[${i + 1}/${occupations.length}]`;

    try {
      console.log(`${progress} Processing: ${occupation.title}...`);
      
      const tasks = await generateMicroTasks(occupation.title, occupation.major_category);
      
      if (tasks && tasks.length > 0) {
        const count = await insertMicroTasks(occupation.id, tasks);
        totalTasks += count;
        success++;
        console.log(`  ✓ Generated ${count} tasks (${elapsed}s elapsed)`);
      } else {
        errors++;
        console.log(`  ✗ Failed to generate tasks`);
      }

      // Rate limiting
      if (i < occupations.length - 1) {
        await sleep(DELAY_BETWEEN_REQUESTS);
      }

    } catch (error) {
      errors++;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  ✗ Error: ${errMsg.substring(0, 80)}`);
    }

    // Save progress every 5 occupations
    if ((i + 1) % 5 === 0) {
      console.log(`\n--- Progress: ${success} success, ${errors} errors, ${totalTasks} tasks generated ---\n`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('BATCH COMPLETE');
  console.log(`Success: ${success} | Errors: ${errors} | Tasks: ${totalTasks}`);
  console.log(`Time: ${totalTime} minutes`);
  console.log(`Remaining: ${parseInt(totalRemaining) - success} occupations`);
  console.log('='.repeat(60));
  console.log(`\nRun next batch: DATABASE_URL="..." npx tsx scripts/generate-microtasks.ts ${batchSize} ${offset + success}`);

  await pool.end();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
