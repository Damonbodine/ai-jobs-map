import {
  pgTable,
  serial,
  text,
  integer,
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

export type Occupation = typeof occupations.$inferSelect;
export type NewOccupation = typeof occupations.$inferInsert;
export type AiOpportunity = typeof aiOpportunities.$inferSelect;
export type NewAiOpportunity = typeof aiOpportunities.$inferInsert;
export type SkillRecommendation = typeof skillRecommendations.$inferSelect;
export type NewSkillRecommendation = typeof skillRecommendations.$inferInsert;
