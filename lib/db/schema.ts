import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const majorCategories = [
  'Management',
  'Business and Financial Operations',
  'Computer and Mathematical',
  'Architecture and Engineering',
  'Life Physical and Social Science',
  'Community and Social Service',
  'Legal',
  'Educational Instruction and Library',
  'Arts Design Entertainment Sports and Media',
  'Healthcare Practitioners and Technical',
  'Healthcare Support',
  'Protective Service',
  'Food Preparation and Serving',
  'Building and Grounds Cleaning and Maintenance',
  'Personal Care and Service',
  'Sales and Related',
  'Office and Administrative Support',
  'Farming Fishing and Forestry',
  'Construction and Extraction',
  'Installation Maintenance and Repair',
  'Production',
  'Transportation and Material Moving',
] as const;

export type MajorCategory = (typeof majorCategories)[number];

export const opportunityCategories = [
  'task_automation',
  'decision_support',
  'research_discovery',
  'communication',
  'creative_assistance',
  'data_analysis',
  'learning_education',
] as const;

export type OpportunityCategory = (typeof opportunityCategories)[number];

export const opportunityCategoryLabels: Record<OpportunityCategory, string> = {
  task_automation: 'Task Automation',
  decision_support: 'Decision Support',
  research_discovery: 'Research & Discovery',
  communication: 'Communication',
  creative_assistance: 'Creative Assistance',
  data_analysis: 'Data Analysis',
  learning_education: 'Learning & Education',
};

export const opportunityCategoryColors: Record<OpportunityCategory, string> = {
  task_automation: 'bg-blue-500',
  decision_support: 'bg-purple-500',
  research_discovery: 'bg-green-500',
  communication: 'bg-orange-500',
  creative_assistance: 'bg-pink-500',
  data_analysis: 'bg-cyan-500',
  learning_education: 'bg-yellow-500',
};

export const impactLevels = [1, 2, 3, 4, 5] as const;
export const effortLevels = [1, 2, 3, 4, 5] as const;

export const occupations = pgTable(
  'occupations',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    majorCategory: text('major_category').notNull(),
    subCategory: text('sub_category'),
    employment: integer('employment'),
    hourlyWage: integer('hourly_wage'),
    annualWage: integer('annual_wage'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('occupations_slug_idx').on(table.slug),
    index('occupations_major_category_idx').on(table.majorCategory),
    index('occupations_title_idx').on(table.title),
  ]
);

export const occupationRelations = relations(occupations, ({ many }) => ({
  opportunities: many(aiOpportunities),
  microTasks: many(jobMicroTasks),
}));

export const aiOpportunities = pgTable(
  'ai_opportunities',
  {
    id: serial('id').primaryKey(),
    occupationId: integer('occupation_id')
      .notNull()
      .references(() => occupations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category', {
      enum: ['task_automation', 'decision_support', 'research_discovery', 'communication', 'creative_assistance', 'data_analysis', 'learning_education'],
    }).notNull(),
    impactLevel: integer('impact_level').notNull(),
    effortLevel: integer('effort_level').notNull(),
    isAiGenerated: boolean('is_ai_generated').default(true).notNull(),
    isApproved: boolean('is_approved').default(false).notNull(),
    source: text('source'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('ai_opportunities_occupation_idx').on(table.occupationId),
    index('ai_opportunities_category_idx').on(table.category),
  ]
);

export const aiOpportunityRelations = relations(aiOpportunities, ({ one }) => ({
  occupation: one(occupations, {
    fields: [aiOpportunities.occupationId],
    references: [occupations.id],
  }),
}));

export const skillRecommendations = pgTable(
  'skill_recommendations',
  {
    id: serial('id').primaryKey(),
    occupationId: integer('occupation_id')
      .notNull()
      .references(() => occupations.id, { onDelete: 'cascade' }),
    skillName: text('skill_name').notNull(),
    skillDescription: text('skill_description').notNull(),
    difficulty: text('difficulty').notNull(),
    learningResources: text('learning_resources'),
    priority: integer('priority').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('skill_recommendations_occupation_idx').on(table.occupationId),
  ]
);

export const skillRecommendationRelations = relations(skillRecommendations, ({ one }) => ({
  occupation: one(occupations, {
    fields: [skillRecommendations.occupationId],
    references: [occupations.id],
  }),
}));

// Micro-tasks table - stores specific tasks for each occupation with AI mapping
export const jobMicroTasks = pgTable(
  'job_micro_tasks',
  {
    id: serial('id').primaryKey(),
    occupationId: integer('occupation_id')
      .notNull()
      .references(() => occupations.id, { onDelete: 'cascade' }),
    taskName: text('task_name').notNull(),
    taskDescription: text('task_description').notNull(),
    frequency: text('frequency').notNull(), // daily, weekly, monthly, as-needed
    aiApplicable: boolean('ai_applicable').default(true).notNull(),
    aiHowItHelps: text('ai_how_it_helps'),
    aiImpactLevel: integer('ai_impact_level'), // 1-5
    aiEffortToImplement: integer('ai_effort_to_implement'), // 1-5
    aiCategory: text('ai_category', {
      enum: ['task_automation', 'decision_support', 'research_discovery', 'communication', 'creative_assistance', 'data_analysis', 'learning_education'],
    }),
    aiTools: text('ai_tools'), // suggested AI tools
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('job_micro_tasks_occupation_idx').on(table.occupationId),
    index('job_micro_tasks_ai_applicable_idx').on(table.aiApplicable),
  ]
);

export const jobMicroTaskRelations = relations(jobMicroTasks, ({ one }) => ({
  occupation: one(occupations, {
    fields: [jobMicroTasks.occupationId],
    references: [occupations.id],
  }),
}));

// O*NET Task Statements - official government task data
export const onetTasks = pgTable(
  'onet_tasks',
  {
    id: serial('id').primaryKey(),
    onetSocCode: text('onet_soc_code').notNull(),
    taskId: text('task_id'),
    taskTitle: text('task_title').notNull(),
    taskDescription: text('task_description').notNull(),
    taskType: text('task_type'), // "Core" or "Supplemental"
    occupationId: integer('occupation_id').references(() => occupations.id),
    // AI scoring fields
    aiAutomatable: boolean('ai_automatable'),
    aiAutomationScore: integer('ai_automation_score'), // 0-100
    aiDifficulty: text('ai_difficulty'), // easy, medium, hard
    estimatedTimeSavedPercent: integer('estimated_time_saved_percent'), // 0-100
    aiTools: text('ai_tools'), // JSON array of applicable AI tools
    // DWA grouping
    dwaId: text('dwa_id'),
    dwaTitle: text('dwa_title'),
    iwaId: text('iwa_id'),
    gwaTitle: text('gwa_title'), // General Work Activity
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('onet_tasks_soc_idx').on(table.onetSocCode),
    index('onet_tasks_occupation_idx').on(table.occupationId),
    index('onet_tasks_dwa_idx').on(table.dwaId),
    index('onet_tasks_ai_automatable_idx').on(table.aiAutomatable),
  ]
);

// DWA (Detailed Work Activities) - reusable automation templates
export const detailedWorkActivities = pgTable(
  'detailed_work_activities',
  {
    id: serial('id').primaryKey(),
    dwaId: text('dwa_id').notNull().unique(),
    dwaTitle: text('dwa_title').notNull(),
    iwaId: text('iwa_id'),
    iwaTitle: text('iwa_title'),
    gwaTitle: text('gwa_title'),
    // Automation metadata
    automationTemplate: text('automation_template'), // JSON template for automation
    applicableTools: text('applicable_tools'), // JSON array
    occupationCount: integer('occupation_count').default(0), // How many occupations use this DWA
    avgAutomationScore: integer('avg_automation_score'), // Average automation score across occupations
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('dwa_iwa_idx').on(table.iwaId),
    index('dwa_automation_idx').on(table.avgAutomationScore),
  ]
);

// Tasks to DWAs mapping (for tracking cross-occupation patterns)
export const tasksToDwas = pgTable(
  'tasks_to_dwas',
  {
    id: serial('id').primaryKey(),
    taskId: text('task_id').notNull(),
    onetSocCode: text('onet_soc_code').notNull(),
    dwaId: text('dwa_id').notNull(),
    occupationId: integer('occupation_id').references(() => occupations.id),
  },
  (table) => [
    index('ttd_dwa_idx').on(table.dwaId),
    index('ttd_soc_idx').on(table.onetSocCode),
  ]
);

export const onetTaskRelations = relations(onetTasks, ({ one }) => ({
  occupation: one(occupations, {
    fields: [onetTasks.occupationId],
    references: [occupations.id],
  }),
}));

export const dwaRelations = relations(detailedWorkActivities, ({ many }) => ({
  tasks: many(onetTasks),
}));

// O*NET Abilities - cognitive/physical ability profiles per occupation
export const onetAbilities = pgTable(
  'onet_abilities',
  {
    id: serial('id').primaryKey(),
    onetSocCode: text('onet_soc_code').notNull(),
    elementId: text('element_id').notNull(),
    elementName: text('element_name').notNull(),
    importance: real('importance'), // IM scale (1-5)
    level: real('level'), // LV scale (0-7)
    occupationId: integer('occupation_id').references(() => occupations.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('onet_abilities_soc_idx').on(table.onetSocCode),
    index('onet_abilities_occupation_idx').on(table.occupationId),
    index('onet_abilities_element_idx').on(table.elementId),
  ]
);

// O*NET Knowledge - knowledge domain profiles per occupation
export const onetKnowledge = pgTable(
  'onet_knowledge',
  {
    id: serial('id').primaryKey(),
    onetSocCode: text('onet_soc_code').notNull(),
    elementId: text('element_id').notNull(),
    elementName: text('element_name').notNull(),
    importance: real('importance'), // IM scale (1-5)
    level: real('level'), // LV scale (0-7)
    occupationId: integer('occupation_id').references(() => occupations.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('onet_knowledge_soc_idx').on(table.onetSocCode),
    index('onet_knowledge_occupation_idx').on(table.occupationId),
    index('onet_knowledge_element_idx').on(table.elementId),
  ]
);

// O*NET Work Activities - GWA/IWA importance/level per occupation
export const onetWorkActivities = pgTable(
  'onet_work_activities',
  {
    id: serial('id').primaryKey(),
    onetSocCode: text('onet_soc_code').notNull(),
    elementId: text('element_id').notNull(),
    elementName: text('element_name').notNull(),
    importance: real('importance'), // IM scale (1-5)
    level: real('level'), // LV scale (0-7)
    occupationId: integer('occupation_id').references(() => occupations.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('onet_work_activities_soc_idx').on(table.onetSocCode),
    index('onet_work_activities_occupation_idx').on(table.occupationId),
    index('onet_work_activities_element_idx').on(table.elementId),
  ]
);

// Occupation Automation Profile - composite multi-signal scores per occupation
export const occupationAutomationProfile = pgTable(
  'occupation_automation_profile',
  {
    id: serial('id').primaryKey(),
    occupationId: integer('occupation_id')
      .notNull()
      .references(() => occupations.id, { onDelete: 'cascade' })
      .unique(),
    // Composite score (0-100)
    compositeScore: real('composite_score').notNull(),
    // Dimensional breakdowns (0-1 each)
    abilityAutomationPotential: real('ability_automation_potential'),
    workActivityAutomationPotential: real('work_activity_automation_potential'),
    keywordScore: real('keyword_score'),
    knowledgeDigitalReadiness: real('knowledge_digital_readiness'),
    taskFrequencyWeight: real('task_frequency_weight'),
    // Metadata
    physicalAbilityAvg: real('physical_ability_avg'),
    cognitiveRoutineAvg: real('cognitive_routine_avg'),
    cognitiveCreativeAvg: real('cognitive_creative_avg'),
    topAutomatableActivities: text('top_automatable_activities'), // JSON array
    topBlockingAbilities: text('top_blocking_abilities'), // JSON array (physical/creative barriers)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('oap_occupation_idx').on(table.occupationId),
    index('oap_composite_idx').on(table.compositeScore),
  ]
);

// Pipeline tracking
export const pipelineRuns = pgTable(
  'pipeline_runs',
  {
    id: serial('id').primaryKey(),
    stage: text('stage').notNull(),
    status: text('status').notNull(), // running, completed, failed
    recordsProcessed: integer('records_processed'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  }
);

// Data version tracking
export const dataVersions = pgTable(
  'data_versions',
  {
    id: serial('id').primaryKey(),
    source: text('source').notNull(), // e.g. "onet_abilities", "bls_occupations"
    version: text('version').notNull(), // e.g. "30.1", "2024"
    importedAt: timestamp('imported_at').defaultNow().notNull(),
    recordCount: integer('record_count'),
    checksum: text('checksum'),
  }
);

// AI Tools capability database
export const aiTools = pgTable(
  'ai_tools',
  {
    id: serial('id').primaryKey(),
    toolName: text('tool_name').notNull(),
    vendor: text('vendor'),
    category: text('category').notNull(), // e.g. 'document_ai', 'analytics', 'communication'
    capabilities: text('capabilities'), // JSON array
    pricingModel: text('pricing_model'), // 'free', 'freemium', 'subscription', 'usage'
    monthlyCostLow: integer('monthly_cost_low'),
    monthlyCostHigh: integer('monthly_cost_high'),
    url: text('url'),
    dwaCategories: text('dwa_categories'), // JSON: which GWA categories this tool serves
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('ai_tools_category_idx').on(table.category),
  ]
);

// Research calibration benchmarks (Frey & Osborne, OECD, McKinsey)
export const automationBenchmarks = pgTable(
  'automation_benchmarks',
  {
    id: serial('id').primaryKey(),
    occupationId: integer('occupation_id').references(() => occupations.id),
    source: text('source').notNull(), // 'frey_osborne_2017', 'oecd_2019', 'mckinsey_2017'
    externalScore: real('external_score'), // 0-1 probability of automation
    socCode: text('soc_code'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('benchmarks_occupation_idx').on(table.occupationId),
    index('benchmarks_source_idx').on(table.source),
  ]
);

export type Occupation = typeof occupations.$inferSelect;
export type NewOccupation = typeof occupations.$inferInsert;
export type AiOpportunity = typeof aiOpportunities.$inferSelect;
export type NewAiOpportunity = typeof aiOpportunities.$inferInsert;
export type SkillRecommendation = typeof skillRecommendations.$inferSelect;
export type NewSkillRecommendation = typeof skillRecommendations.$inferInsert;
export type JobMicroTask = typeof jobMicroTasks.$inferSelect;
export type NewJobMicroTask = typeof jobMicroTasks.$inferInsert;
export type OnetTask = typeof onetTasks.$inferSelect;
export type NewOnetTask = typeof onetTasks.$inferInsert;
export type DetailedWorkActivity = typeof detailedWorkActivities.$inferSelect;
export type NewDetailedWorkActivity = typeof detailedWorkActivities.$inferInsert;
export type OnetAbility = typeof onetAbilities.$inferSelect;
export type OnetKnowledgeRow = typeof onetKnowledge.$inferSelect;
export type OnetWorkActivity = typeof onetWorkActivities.$inferSelect;
export type OccupationAutomationProfileRow = typeof occupationAutomationProfile.$inferSelect;
