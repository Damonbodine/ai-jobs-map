import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { occupationId, occupationSlug } = body;

    let occupation;
    
    if (occupationId) {
      const result = await pool.query(
        'SELECT id, title, slug FROM occupations WHERE id = $1',
        [occupationId]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Occupation not found' }, { status: 404 });
      }
      occupation = result.rows[0];
    } else if (occupationSlug) {
      const result = await pool.query(
        'SELECT id, title, slug FROM occupations WHERE slug = $1',
        [occupationSlug]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Occupation not found' }, { status: 404 });
      }
      occupation = result.rows[0];
    } else {
      return NextResponse.json({ error: 'occupationId or occupationSlug required' }, { status: 400 });
    }

    // Get all skills for this occupation
    const skillsResult = await pool.query(`
      SELECT 
        ms.skill_code,
        ms.skill_name,
        ms.category,
        tsm.skill_proficiency_level,
        tsm.is_core_skill,
        tsm.is_differentiator_skill,
        tsm.ai_dependence_score
      FROM task_skill_mapping tsm
      JOIN micro_skills ms ON tsm.micro_skill_id = ms.id
      WHERE tsm.onet_task_id = $1
      ORDER BY tsm.skill_proficiency_level DESC, tsm.ai_dependence_score DESC
    `, [occupation.id]);

    const skills = skillsResult.rows;
    
    // Map skills to agents
    const agentMap = new Map<string, { name: string; skills: string[]; category: string; cost: number; latency: number; approval: boolean }>();
    
    for (const skill of skills) {
      const agents = getAgentsForSkill(skill);
      for (const agent of agents) {
        if (!agentMap.has(agent.id)) {
          agentMap.set(agent.id, {
            name: agent.name,
            skills: [],
            category: agent.category,
            cost: agent.cost,
            latency: agent.latency,
            approval: agent.approval
          });
        }
        const entry = agentMap.get(agent.id)!;
        if (!entry.skills.includes(skill.skill_code)) {
          entry.skills.push(skill.skill_code);
        }
      }
    }

    // Build workflow steps
    const categoryOrder = ['input', 'processing', 'quality', 'output'];
    const sortedAgents = Array.from(agentMap.entries()).sort((a, b) => {
      const orderA = categoryOrder.indexOf(a[1].category);
      const orderB = categoryOrder.indexOf(b[1].category);
      return orderA - orderB;
    });

    const workflowSteps = sortedAgents.map(([id, info], index) => ({
      order: index + 1,
      stepId: `step-${index + 1}`,
      agentId: id,
      agentName: info.name,
      category: info.category,
      skillsHandled: info.skills.slice(0, 5),
      skillCount: info.skills.length,
      costPerExecution: info.cost,
      latencyMs: info.latency,
      needsApproval: info.approval,
    }));

    // Calculate metrics
    const mappedCount = skills.filter(s => getAgentsForSkill(s).length > 0).length;
    const automationCoverage = skills.length > 0 ? Math.round((mappedCount / skills.length) * 100) : 0;
    const avgAiDependence = skills.reduce((sum, s) => sum + (parseFloat(s.ai_dependence_score) || 0.5), 0) / Math.max(skills.length, 1);
    const totalCost = sortedAgents.reduce((sum, [_, info]) => sum + info.cost, 0);
    const totalTimeSavedPerWeek = Math.round(workflowSteps.length * 0.5 * avgAiDependence * 10) / 10;
    const estimatedCostSavings = Math.round(totalTimeSavedPerWeek * 50);

    return NextResponse.json({
      occupation: {
        id: occupation.id,
        title: occupation.title,
        slug: occupation.slug,
      },
      summary: {
        totalSkills: skills.length,
        mappedSkills: mappedCount,
        unmappedSkills: skills.length - mappedCount,
        automationCoverage,
        avgAiDependence: Math.round(avgAiDependence * 100) / 100,
        estimatedTimeSavedPerWeek: totalTimeSavedPerWeek,
        estimatedCostSavingsPerWeek: estimatedCostSavings,
        totalWorkflowCost: totalCost,
        humanApprovalRequired: workflowSteps.filter(s => s.needsApproval).length,
      },
      workflowSteps,
      agentBreakdown: sortedAgents.map(([id, info]) => ({
        agentId: id,
        agentName: info.name,
        category: info.category,
        skillCount: info.skills.length,
        skills: info.skills.slice(0, 10),
      })),
      confidence: Math.min(0.99, 0.7 + avgAiDependence * 0.29),
    });
  } catch (error) {
    console.error('Error building occupation pipeline:', error);
    return NextResponse.json({ error: 'Failed to build pipeline' }, { status: 500 });
  }
}

function getAgentsForSkill(skill: any): Array<{ id: string; name: string; category: string; cost: number; latency: number; approval: boolean }> {
  const agents: Array<{ id: string; name: string; category: string; cost: number; latency: number; approval: boolean }> = [];
  const skillName = (skill.skill_name || '').toLowerCase();
  const category = skill.category || '';
  const aiDep = parseFloat(skill.ai_dependence_score) || 0.5;

  // Pattern matching for skill names
  const patterns: Record<string, Array<{ id: string; name: string; category: string; cost: number; latency: number; approval: boolean }>> = {
    'reading': [{ id: 'ocr', name: 'OCR Processor', category: 'input', cost: 2, latency: 3000, approval: false }, { id: 'llm-analyzer', name: 'LLM Analyzer', category: 'processing', cost: 3, latency: 2000, approval: false }],
    'writing': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }],
    'speaking': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }],
    'listening': [{ id: 'llm-analyzer', name: 'LLM Analyzer', category: 'processing', cost: 3, latency: 2000, approval: false }],
    'math': [{ id: 'calculator', name: 'Calculator', category: 'processing', cost: 0.5, latency: 100, approval: false }],
    'calcul': [{ id: 'calculator', name: 'Calculator', category: 'processing', cost: 0.5, latency: 100, approval: false }],
    'programming': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }],
    'analyz': [{ id: 'llm-analyzer', name: 'LLM Analyzer', category: 'processing', cost: 3, latency: 2000, approval: false }],
    'decid': [{ id: 'llm-analyzer', name: 'LLM Analyzer', category: 'processing', cost: 3, latency: 2000, approval: false }],
    'manag': [{ id: 'scheduler', name: 'Scheduler', category: 'processing', cost: 1, latency: 500, approval: false }, { id: 'router', name: 'Router', category: 'output', cost: 0.5, latency: 100, approval: false }],
    'coordinat': [{ id: 'scheduler', name: 'Scheduler', category: 'processing', cost: 1, latency: 500, approval: false }, { id: 'router', name: 'Router', category: 'output', cost: 0.5, latency: 100, approval: false }],
    'schedul': [{ id: 'scheduler', name: 'Scheduler', category: 'processing', cost: 1, latency: 500, approval: false }],
    'research': [{ id: 'search-agent', name: 'Research Agent', category: 'processing', cost: 5, latency: 5000, approval: false }],
    'search': [{ id: 'search-agent', name: 'Research Agent', category: 'processing', cost: 5, latency: 5000, approval: false }],
    'validat': [{ id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }],
    'verify': [{ id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }],
    'check': [{ id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }],
    'review': [{ id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }],
    'report': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }, { id: 'formatter', name: 'Formatter', category: 'output', cost: 2, latency: 1000, approval: false }],
    'present': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }],
    'email': [{ id: 'email-parser', name: 'Email Parser', category: 'input', cost: 1, latency: 500, approval: false }, { id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }],
    'communic': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }, { id: 'notifier', name: 'Notifier', category: 'output', cost: 1, latency: 500, approval: false }],
    'financ': [{ id: 'calculator', name: 'Calculator', category: 'processing', cost: 0.5, latency: 100, approval: false }, { id: 'data-extractor', name: 'Data Extractor', category: 'processing', cost: 2, latency: 1500, approval: false }],
    'budget': [{ id: 'calculator', name: 'Calculator', category: 'processing', cost: 0.5, latency: 100, approval: false }],
    'record': [{ id: 'database', name: 'Database', category: 'output', cost: 0.5, latency: 200, approval: false }, { id: 'ocr', name: 'OCR Processor', category: 'input', cost: 2, latency: 3000, approval: false }],
    'data': [{ id: 'data-extractor', name: 'Data Extractor', category: 'processing', cost: 2, latency: 1500, approval: false }, { id: 'database', name: 'Database', category: 'output', cost: 0.5, latency: 200, approval: false }],
    'inform': [{ id: 'data-extractor', name: 'Data Extractor', category: 'processing', cost: 2, latency: 1500, approval: false }],
    'train': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }],
    'evaluat': [{ id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }, { id: 'llm-analyzer', name: 'LLM Analyzer', category: 'processing', cost: 3, latency: 2000, approval: false }],
    'monitor': [{ id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }, { id: 'database', name: 'Database', category: 'output', cost: 0.5, latency: 200, approval: false }],
  };

  // Match by skill name patterns
  for (const [pattern, patternAgents] of Object.entries(patterns)) {
    if (skillName.includes(pattern)) {
      agents.push(...patternAgents);
    }
  }

  // Match by category
  const categoryAgents: Record<string, Array<{ id: string; name: string; category: string; cost: number; latency: number; approval: boolean }>> = {
    'COMM': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }, { id: 'notifier', name: 'Notifier', category: 'output', cost: 1, latency: 500, approval: false }],
    'TECH': [{ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true }, { id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }],
    'ANAL': [{ id: 'llm-analyzer', name: 'LLM Analyzer', category: 'processing', cost: 3, latency: 2000, approval: false }, { id: 'search-agent', name: 'Research Agent', category: 'processing', cost: 5, latency: 5000, approval: false }],
    'MGMT': [{ id: 'scheduler', name: 'Scheduler', category: 'processing', cost: 1, latency: 500, approval: false }, { id: 'router', name: 'Router', category: 'output', cost: 0.5, latency: 100, approval: false }],
    'FINA': [{ id: 'calculator', name: 'Calculator', category: 'processing', cost: 0.5, latency: 100, approval: false }, { id: 'data-extractor', name: 'Data Extractor', category: 'processing', cost: 2, latency: 1500, approval: false }],
    'OPS': [{ id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }, { id: 'database', name: 'Database', category: 'output', cost: 0.5, latency: 200, approval: false }],
    'INFO': [{ id: 'data-extractor', name: 'Data Extractor', category: 'processing', cost: 2, latency: 1500, approval: false }, { id: 'ocr', name: 'OCR Processor', category: 'input', cost: 2, latency: 3000, approval: false }],
    'SOFT': [{ id: 'llm-analyzer', name: 'LLM Analyzer', category: 'processing', cost: 3, latency: 2000, approval: false }],
    'LEGAL': [{ id: 'search-agent', name: 'Research Agent', category: 'processing', cost: 5, latency: 5000, approval: false }, { id: 'validator', name: 'Validator', category: 'quality', cost: 2, latency: 1000, approval: false }],
  };

  if (categoryAgents[category] && agents.length === 0) {
    agents.push(...categoryAgents[category]);
  }

  // If no agents matched, use AI dependence to decide
  if (agents.length === 0) {
    if (aiDep >= 0.7) {
      agents.push({ id: 'calculator', name: 'Calculator', category: 'processing', cost: 0.5, latency: 100, approval: false }, { id: 'data-extractor', name: 'Data Extractor', category: 'processing', cost: 2, latency: 1500, approval: false });
    } else if (aiDep >= 0.4) {
      agents.push({ id: 'llm-analyzer', name: 'LLM Analyzer', category: 'processing', cost: 3, latency: 2000, approval: false });
    } else {
      agents.push({ id: 'llm-generator', name: 'Content Generator', category: 'processing', cost: 4, latency: 3000, approval: true });
    }
  }

  // Remove duplicates
  const unique = new Map<string, typeof agents[0]>();
  for (const agent of agents) {
    unique.set(agent.id, agent);
  }
  return Array.from(unique.values());
}
