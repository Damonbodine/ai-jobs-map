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

interface SkillRecommendation {
  skill_name: string;
  skill_description: string;
  difficulty: string;
  learning_resources: string | null;
  priority: number;
}

const SYSTEM_PROMPT = `You are an AI skills advisor. For the given occupation, generate 3-5 AI-related skill recommendations.

IMPORTANT: Return ONLY valid JSON array, no other text.

Each skill must have these exact fields:
{
  "skill_name": "Skill name",
  "skill_description": "1-2 sentence description of why this skill is important",
  "difficulty": "beginner|intermediate|advanced",
  "learning_resources": "URL to a learning resource (or null)",
  "priority": 1-10
}

Difficulty levels:
- beginner: Basic AI concepts, no prior experience needed
- intermediate: Some technical background helpful
- advanced: Strong technical foundation required

Priority: 10 = highest priority for this occupation, 1 = lowest

Return a JSON array: [{"skill_name":"...", "skill_description":"...", "difficulty":"...", "learning_resources":"...", "priority":5}]`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseJsonFromResponse(content: string): SkillRecommendation[] | null {
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

async function generateSkillRecommendations(occupationTitle: string, category: string): Promise<SkillRecommendation[] | null> {
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
              content: `Generate AI skill recommendations for: ${occupationTitle} (${category})`
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

      const skills = parseJsonFromResponse(content);
      
      if (!skills || !Array.isArray(skills) || skills.length === 0) {
        throw new Error('Invalid or empty JSON response');
      }

      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      
      return skills.map(s => ({
        skill_name: s.skill_name || 'AI Skill',
        skill_description: s.skill_description || '',
        difficulty: validDifficulties.includes(s.difficulty) ? s.difficulty : 'intermediate',
        learning_resources: s.learning_resources || null,
        priority: typeof s.priority === 'number' ? Math.min(10, Math.max(1, s.priority)) : 5,
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

async function insertSkillRecommendations(occupationId: number, skills: SkillRecommendation[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const skill of skills) {
      await client.query(
        `INSERT INTO skill_recommendations 
         (occupation_id, skill_name, skill_description, difficulty, learning_resources, priority)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          occupationId,
          skill.skill_name,
          skill.skill_description,
          skill.difficulty,
          skill.learning_resources,
          skill.priority,
        ]
      );
    }

    await client.query('COMMIT');
    return skills.length;
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
  console.log('AI Jobs Map - Skill Recommendations Generator');
  console.log(`Model: ${MODEL}`);
  console.log(`Batch size: ${batchSize}, Offset: ${offset}`);
  console.log('='.repeat(60));

  const { rows: [{ count: totalRemaining }] } = await pool.query(
    `SELECT COUNT(*) as count 
     FROM occupations o
     LEFT JOIN skill_recommendations sr ON o.id = sr.occupation_id
     WHERE sr.id IS NULL`
  );
  console.log(`\nOccupations remaining: ${totalRemaining}\n`);

  const { rows: occupations } = await pool.query(
    `SELECT o.id, o.title, o.major_category 
     FROM occupations o
     LEFT JOIN skill_recommendations sr ON o.id = sr.occupation_id
     WHERE sr.id IS NULL
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
  let totalSkills = 0;
  const startTime = Date.now();

  for (let i = 0; i < occupations.length; i++) {
    const occupation = occupations[i];
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const progress = `[${i + 1}/${occupations.length}]`;

    try {
      console.log(`${progress} Processing: ${occupation.title}...`);
      
      const skills = await generateSkillRecommendations(occupation.title, occupation.major_category);
      
      if (skills && skills.length > 0) {
        const count = await insertSkillRecommendations(occupation.id, skills);
        totalSkills += count;
        success++;
        console.log(`  ✓ Generated ${count} skills (${elapsed}s elapsed)`);
      } else {
        errors++;
        console.log(`  ✗ Failed to generate skills`);
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
      console.log(`\n--- Progress: ${success} success, ${errors} errors, ${totalSkills} skills generated ---\n`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('BATCH COMPLETE');
  console.log(`Success: ${success} | Errors: ${errors} | Skills: ${totalSkills}`);
  console.log(`Time: ${totalTime} minutes`);
  console.log(`Remaining: ${parseInt(totalRemaining) - success} occupations`);
  console.log('='.repeat(60));
  console.log(`\nRun next batch: DATABASE_URL="..." npx tsx scripts/generate-skill-recommendations.ts ${batchSize} ${offset + success}`);

  await pool.end();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
