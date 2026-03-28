import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface QuoteRequest {
  name: string;
  email: string;
  company: string;
  occupation: string;
  painPoints: string[];
  currentTools?: string;
  teamSize?: number;
  hourlyRate?: number;
}

interface PRDPhase {
  phase: number;
  name: string;
  description: string;
  deliverables: string[];
  estimatedHours: number;
  estimatedDays: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequest = await request.json();
    
    // Find matching workflows based on pain points
    const painPointToWorkflow: Record<string, string[]> = {
      'Manual data entry': ['ACT-DATA-001', 'ACT-DATA-002'],
      'Email management': ['ACT-COMM-001', 'ACT-COMM-004'],
      'Report generation': ['ACT-COMM-002', 'ACT-ANLY-002'],
      'Scheduling & coordination': ['ACT-SCHED-001', 'ACT-COMM-003'],
      'Invoice processing': ['WF-FIN-001', 'WF-FIN-002'],
      'Customer follow-ups': ['WF-CS-001', 'WF-CS-002'],
      'Lead qualification': ['WF-SALES-001', 'WF-SALES-002'],
      'Document review': ['ACT-DOC-003', 'ACT-ANLY-001'],
      'Meeting preparation': ['WF-OPS-002'],
      'Social media posting': ['WF-MKT-001'],
    };

    // Get matching workflows
    const workflowCodes = body.painPoints.flatMap(pp => painPointToWorkflow[pp] || []);
    
    let workflows: any[] = [];
    if (workflowCodes.length > 0) {
      const wfResult = await pool.query(
        `SELECT * FROM automation_workflows WHERE workflow_code = ANY($1)`,
        [workflowCodes]
      );
      workflows = wfResult.rows;
    }

    // Calculate estimate
    const baseSetupHours = workflows.reduce((sum, wf) => sum + parseFloat(wf.estimated_time_saved_per_day || 4), 0);
    const totalSetupHours = Math.max(8, baseSetupHours * 1.5); // Add 50% buffer
    
    const avgWorkflowPrice = workflows.length > 0
      ? workflows.reduce((sum, wf) => sum + parseInt(wf.base_price || 2997), 0) / workflows.length
      : 2997;
    
    const basePrice = Math.round(avgWorkflowPrice * (1 + (workflows.length - 1) * 0.3));
    const monthlyPrice = Math.round(97 * (1 + (workflows.length - 1) * 0.2));
    
    // Generate PRD phases
    const prdPhases: PRDPhase[] = [
      {
        phase: 1,
        name: 'Discovery & Analysis',
        description: 'Map current workflows, identify automation opportunities, and define requirements',
        deliverables: [
          'Current state workflow map',
          'Automation requirements document',
          'Integration inventory',
          'Success metrics definition',
        ],
        estimatedHours: 4,
        estimatedDays: 2,
      },
      {
        phase: 2,
        name: 'Architecture & Design',
        description: 'Design automation architecture, data flows, and integration patterns',
        deliverables: [
          'System architecture diagram',
          'API integration specs',
          'Data model design',
          'Error handling strategy',
        ],
        estimatedHours: 6,
        estimatedDays: 3,
      },
      {
        phase: 3,
        name: 'Core Engine Development',
        description: 'Build the automation workflows and AI components',
        deliverables: [
          'Core automation engine',
          'AI/ML models configured',
          'Workflow orchestration',
          'Self-healing bot layer',
        ],
        estimatedHours: Math.round(totalSetupHours * 0.5),
        estimatedDays: Math.ceil(totalSetupHours * 0.5 / 6),
      },
      {
        phase: 4,
        name: 'Integration & Testing',
        description: 'Connect external systems and run end-to-end tests',
        deliverables: [
          'System integrations',
          'End-to-end test suite',
          'Performance benchmarks',
          'Security review',
        ],
        estimatedHours: Math.round(totalSetupHours * 0.3),
        estimatedDays: Math.ceil(totalSetupHours * 0.3 / 6),
      },
      {
        phase: 5,
        name: 'Deployment & Training',
        description: 'Deploy to production, train users, and hand off documentation',
        deliverables: [
          'Production deployment',
          'User documentation',
          'Training session',
          'Support handoff',
        ],
        estimatedHours: Math.round(totalSetupHours * 0.2),
        estimatedDays: Math.ceil(totalSetupHours * 0.2 / 6),
      },
    ];

    // Generate proposal code
    const proposalCode = `PROP-${Date.now().toString(36).toUpperCase()}`;
    
    // Calculate ROI estimate
    const hoursPerDay = 1.5;
    const workDaysPerYear = 250;
    const hourlyRate = body.hourlyRate || 75;
    const yearlyValue = hoursPerDay * workDaysPerYear * hourlyRate;
    const yearlyCost = basePrice + (monthlyPrice * 12);
    const roiPercentage = Math.round(((yearlyValue - yearlyCost) / yearlyCost) * 100);

    // Save proposal
    await pool.query(
      `INSERT INTO proposals (proposal_code, client_name, client_email, client_company, occupation_id, pain_points, selected_workflow_ids, estimated_total_price, estimated_setup_hours, prd_phases, status)
       VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, 'draft')`,
      [
        proposalCode,
        body.name,
        body.email,
        body.company,
        body.painPoints,
        workflows.map(w => w.id),
        basePrice + (monthlyPrice * 12), // First year total
        totalSetupHours,
        JSON.stringify(prdPhases),
      ]
    );

    return NextResponse.json({
      proposalCode,
      estimate: {
        basePrice,
        monthlyPrice,
        yearlyTotal: basePrice + (monthlyPrice * 12),
        setupHours: totalSetupHours,
        setupDays: Math.ceil(totalSetupHours / 6),
        includedIntegrations: Math.min(workflows.length, 3),
        workflows: workflows.map(w => ({
          name: w.workflow_name,
          timeSavedPerDay: w.estimated_time_saved_per_day,
        })),
      },
      roi: {
        hoursSavedPerDay: hoursPerDay,
        hoursSavedPerYear: hoursPerDay * workDaysPerYear,
        valueRecoveredPerYear: yearlyValue,
        paybackDays: Math.round((basePrice / (yearlyValue / 365))),
        yearOneROI: roiPercentage,
      },
      prdPhases,
      nextSteps: [
        'Review the proposal and PRD phases',
        'Schedule a 30-minute discovery call',
        'We\'ll refine scope based on your feedback',
        'Approve and begin Phase 1',
      ],
    });
  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}
