import { pgTable, index, unique, serial, text, integer, timestamp, foreignKey, boolean, pgPolicy, bigint, numeric, check, real, uuid, jsonb, bigserial } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const detailedWorkActivities = pgTable("detailed_work_activities", {
	id: serial().primaryKey().notNull(),
	dwaId: text("dwa_id").notNull(),
	dwaTitle: text("dwa_title").notNull(),
	iwaId: text("iwa_id"),
	iwaTitle: text("iwa_title"),
	gwaTitle: text("gwa_title"),
	automationTemplate: text("automation_template"),
	applicableTools: text("applicable_tools"),
	occupationCount: integer("occupation_count").default(0),
	avgAutomationScore: integer("avg_automation_score"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("dwa_automation_idx").using("btree", table.avgAutomationScore.asc().nullsLast().op("int4_ops")),
	index("dwa_iwa_idx").using("btree", table.iwaId.asc().nullsLast().op("text_ops")),
	unique("detailed_work_activities_dwa_id_unique").on(table.dwaId),
]);

export const occupations = pgTable("occupations", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	majorCategory: text("major_category").notNull(),
	subCategory: text("sub_category"),
	employment: bigint({ mode: "number" }),
	hourlyWage: numeric("hourly_wage"),
	annualWage: numeric("annual_wage"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("occupations_major_category_idx").using("btree", table.majorCategory.asc().nullsLast().op("text_ops")),
	index("occupations_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("occupations_title_idx").using("btree", table.title.asc().nullsLast().op("text_ops")),
	unique("occupations_slug_key").on(table.slug),
	pgPolicy("Allow public read on occupations", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const jobMicroTasks = pgTable("job_micro_tasks", {
	id: serial().primaryKey().notNull(),
	occupationId: integer("occupation_id").notNull(),
	taskName: text("task_name").notNull(),
	taskDescription: text("task_description").notNull(),
	frequency: text().notNull(),
	aiApplicable: boolean("ai_applicable").default(true).notNull(),
	aiHowItHelps: text("ai_how_it_helps"),
	aiImpactLevel: integer("ai_impact_level"),
	aiEffortToImplement: integer("ai_effort_to_implement"),
	aiCategory: text("ai_category"),
	aiTools: text("ai_tools"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("job_micro_tasks_ai_applicable_idx").using("btree", table.aiApplicable.asc().nullsLast().op("bool_ops")),
	index("job_micro_tasks_occupation_idx").using("btree", table.occupationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "job_micro_tasks_occupation_id_occupations_id_fk"
		}).onDelete("cascade"),
]);

export const aiOpportunities = pgTable("ai_opportunities", {
	id: serial().primaryKey().notNull(),
	occupationId: integer("occupation_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	impactLevel: integer("impact_level").notNull(),
	effortLevel: integer("effort_level").notNull(),
	isAiGenerated: boolean("is_ai_generated").default(true).notNull(),
	isApproved: boolean("is_approved").default(false).notNull(),
	source: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ai_opportunities_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("ai_opportunities_occupation_idx").using("btree", table.occupationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "ai_opportunities_occupation_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "ai_opportunities_occupation_id_occupations_id_fk"
		}).onDelete("cascade"),
	pgPolicy("Allow public read on ai_opportunities", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	check("ai_opportunities_category_check", sql`category = ANY (ARRAY['task_automation'::text, 'decision_support'::text, 'research_discovery'::text, 'communication'::text, 'creative_assistance'::text, 'data_analysis'::text, 'learning_education'::text])`),
	check("ai_opportunities_effort_level_check", sql`(effort_level >= 1) AND (effort_level <= 5)`),
	check("ai_opportunities_impact_level_check", sql`(impact_level >= 1) AND (impact_level <= 5)`),
]);

export const skillRecommendations = pgTable("skill_recommendations", {
	id: serial().primaryKey().notNull(),
	occupationId: integer("occupation_id").notNull(),
	skillName: text("skill_name").notNull(),
	skillDescription: text("skill_description").notNull(),
	difficulty: text().notNull(),
	learningResources: text("learning_resources"),
	priority: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("skill_recommendations_occupation_idx").using("btree", table.occupationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "skill_recommendations_occupation_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "skill_recommendations_occupation_id_occupations_id_fk"
		}).onDelete("cascade"),
	pgPolicy("Allow public read on skill_recommendations", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	check("skill_recommendations_difficulty_check", sql`difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])`),
]);

export const onetTasks = pgTable("onet_tasks", {
	id: serial().primaryKey().notNull(),
	onetSocCode: text("onet_soc_code").notNull(),
	taskId: text("task_id"),
	taskTitle: text("task_title").notNull(),
	taskDescription: text("task_description").notNull(),
	taskType: text("task_type"),
	occupationId: integer("occupation_id"),
	aiAutomatable: boolean("ai_automatable"),
	aiAutomationScore: integer("ai_automation_score"),
	aiDifficulty: text("ai_difficulty"),
	estimatedTimeSavedPercent: integer("estimated_time_saved_percent"),
	aiTools: text("ai_tools"),
	dwaId: text("dwa_id"),
	dwaTitle: text("dwa_title"),
	iwaId: text("iwa_id"),
	gwaTitle: text("gwa_title"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("onet_tasks_ai_automatable_idx").using("btree", table.aiAutomatable.asc().nullsLast().op("bool_ops")),
	index("onet_tasks_dwa_idx").using("btree", table.dwaId.asc().nullsLast().op("text_ops")),
	index("onet_tasks_occupation_idx").using("btree", table.occupationId.asc().nullsLast().op("int4_ops")),
	index("onet_tasks_soc_idx").using("btree", table.onetSocCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "onet_tasks_occupation_id_occupations_id_fk"
		}),
]);

export const tasksToDwas = pgTable("tasks_to_dwas", {
	id: serial().primaryKey().notNull(),
	taskId: text("task_id").notNull(),
	onetSocCode: text("onet_soc_code").notNull(),
	dwaId: text("dwa_id").notNull(),
	occupationId: integer("occupation_id"),
}, (table) => [
	index("ttd_dwa_idx").using("btree", table.dwaId.asc().nullsLast().op("text_ops")),
	index("ttd_soc_idx").using("btree", table.onetSocCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "tasks_to_dwas_occupation_id_occupations_id_fk"
		}),
]);

export const smartWorkflows = pgTable("smart_workflows", {
	id: serial().primaryKey().notNull(),
	sourceTemplateId: text("source_template_id").notNull(),
	name: text().notNull(),
	description: text().notNull(),
	sourceUrl: text("source_url"),
	category: text().notNull(),
	tags: text(),
	integrations: text(),
	integrationCount: integer("integration_count").default(0),
	triggerType: text("trigger_type"),
	complexity: text(),
	estimatedHoursSaved: real("estimated_hours_saved"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("smart_workflows_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("smart_workflows_complexity_idx").using("btree", table.complexity.asc().nullsLast().op("text_ops")),
	unique("smart_workflows_source_template_id_unique").on(table.sourceTemplateId),
]);

export const smartWorkflowInternalMappings = pgTable("smart_workflow_internal_mappings", {
	id: serial().primaryKey().notNull(),
	workflowId: integer("workflow_id").notNull(),
	internalWorkflowCode: text("internal_workflow_code").notNull(),
	relationship: text().default('reference').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("swim_internal_code_idx").using("btree", table.internalWorkflowCode.asc().nullsLast().op("text_ops")),
	index("swim_workflow_idx").using("btree", table.workflowId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [smartWorkflows.id],
			name: "smart_workflow_internal_mappings_workflow_id_smart_workflows_id"
		}).onDelete("cascade"),
]);

export const smartWorkflowOccupationMappings = pgTable("smart_workflow_occupation_mappings", {
	id: serial().primaryKey().notNull(),
	workflowId: integer("workflow_id").notNull(),
	occupationId: integer("occupation_id"),
	majorCategory: text("major_category"),
	skillCodePrefix: text("skill_code_prefix"),
	automationSolutionKey: text("automation_solution_key"),
	relevanceScore: real("relevance_score").default(0.5).notNull(),
	mappingSource: text("mapping_source").default('auto_keyword').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("swom_category_idx").using("btree", table.majorCategory.asc().nullsLast().op("text_ops")),
	index("swom_occupation_idx").using("btree", table.occupationId.asc().nullsLast().op("int4_ops")),
	index("swom_skill_prefix_idx").using("btree", table.skillCodePrefix.asc().nullsLast().op("text_ops")),
	index("swom_solution_idx").using("btree", table.automationSolutionKey.asc().nullsLast().op("text_ops")),
	index("swom_workflow_idx").using("btree", table.workflowId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "smart_workflow_occupation_mappings_occupation_id_occupations_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [smartWorkflows.id],
			name: "smart_workflow_occupation_mappings_workflow_id_smart_workflows_"
		}).onDelete("cascade"),
]);

export const contactMessages = pgTable("contact_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	company: text(),
	message: text().notNull(),
	source: text().default('contact-page').notNull(),
	userAgent: text("user_agent"),
	ipHash: text("ip_hash"),
	respondedAt: timestamp("responded_at", { withTimezone: true, mode: 'string' }),
	respondedBy: text("responded_by"),
}, (table) => [
	index("contact_messages_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("contact_messages_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const onePagerRequests = pgTable("one_pager_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	email: text().notNull(),
	occupationSlug: text("occupation_slug").notNull(),
	occupationTitle: text("occupation_title"),
	userAgent: text("user_agent"),
	ipHash: text("ip_hash"),
	pdfSentAt: timestamp("pdf_sent_at", { withTimezone: true, mode: 'string' }),
	pdfSendError: text("pdf_send_error"),
}, (table) => [
	index("one_pager_requests_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("one_pager_requests_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("one_pager_requests_occupation_idx").using("btree", table.occupationSlug.asc().nullsLast().op("text_ops")),
]);

export const departmentRoiRequests = pgTable("department_roi_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	email: text().notNull(),
	teamLabel: text("team_label"),
	cart: jsonb().notNull(),
	totalPeople: integer("total_people"),
	totalMinutesPerDay: integer("total_minutes_per_day"),
	totalAnnualValue: integer("total_annual_value"),
	fteEquivalents: numeric("fte_equivalents", { precision: 5, scale:  1 }),
	userAgent: text("user_agent"),
	ipHash: text("ip_hash"),
	pdfSentAt: timestamp("pdf_sent_at", { withTimezone: true, mode: 'string' }),
	pdfSendError: text("pdf_send_error"),
}, (table) => [
	index("department_roi_requests_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("department_roi_requests_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const occupationAutomationProfile = pgTable("occupation_automation_profile", {
	id: serial().primaryKey().notNull(),
	occupationId: integer("occupation_id").notNull(),
	compositeScore: real("composite_score").notNull(),
	abilityAutomationPotential: real("ability_automation_potential"),
	workActivityAutomationPotential: real("work_activity_automation_potential"),
	keywordScore: real("keyword_score"),
	knowledgeDigitalReadiness: real("knowledge_digital_readiness"),
	taskFrequencyWeight: real("task_frequency_weight"),
	physicalAbilityAvg: real("physical_ability_avg"),
	cognitiveRoutineAvg: real("cognitive_routine_avg"),
	cognitiveCreativeAvg: real("cognitive_creative_avg"),
	topAutomatableActivities: text("top_automatable_activities"),
	topBlockingAbilities: text("top_blocking_abilities"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	timeRangeLow: integer("time_range_low"),
	timeRangeHigh: integer("time_range_high"),
	timeRangeByBlock: text("time_range_by_block"),
	blockExampleTasks: text("block_example_tasks"),
}, (table) => [
	index("idx_oap_composite").using("btree", table.compositeScore.asc().nullsLast().op("float4_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "occupation_automation_profile_occupation_id_fkey"
		}).onDelete("cascade"),
	unique("occupation_automation_profile_occupation_id_key").on(table.occupationId),
]);

export const onetAbilities = pgTable("onet_abilities", {
	id: serial().primaryKey().notNull(),
	onetSocCode: text("onet_soc_code").notNull(),
	elementId: text("element_id").notNull(),
	elementName: text("element_name").notNull(),
	importance: real(),
	level: real(),
	occupationId: integer("occupation_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "onet_abilities_occupation_id_fkey"
		}),
]);

export const onetKnowledge = pgTable("onet_knowledge", {
	id: serial().primaryKey().notNull(),
	onetSocCode: text("onet_soc_code").notNull(),
	elementId: text("element_id").notNull(),
	elementName: text("element_name").notNull(),
	importance: real(),
	level: real(),
	occupationId: integer("occupation_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "onet_knowledge_occupation_id_fkey"
		}),
]);

export const onetWorkActivities = pgTable("onet_work_activities", {
	id: serial().primaryKey().notNull(),
	onetSocCode: text("onet_soc_code").notNull(),
	elementId: text("element_id").notNull(),
	elementName: text("element_name").notNull(),
	importance: real(),
	level: real(),
	occupationId: integer("occupation_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "onet_work_activities_occupation_id_fkey"
		}),
]);

export const aiTools = pgTable("ai_tools", {
	id: serial().primaryKey().notNull(),
	toolName: text("tool_name").notNull(),
	vendor: text(),
	category: text().notNull(),
	capabilities: text(),
	pricingModel: text("pricing_model"),
	monthlyCostLow: integer("monthly_cost_low"),
	monthlyCostHigh: integer("monthly_cost_high"),
	url: text(),
	dwaCategories: text("dwa_categories"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const automationBenchmarks = pgTable("automation_benchmarks", {
	id: serial().primaryKey().notNull(),
	occupationId: integer("occupation_id"),
	source: text().notNull(),
	externalScore: real("external_score"),
	socCode: text("soc_code"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "automation_benchmarks_occupation_id_fkey"
		}),
]);

export const pipelineRuns = pgTable("pipeline_runs", {
	id: serial().primaryKey().notNull(),
	stage: text().notNull(),
	status: text().notNull(),
	recordsProcessed: integer("records_processed"),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
});

export const dataVersions = pgTable("data_versions", {
	id: serial().primaryKey().notNull(),
	source: text().notNull(),
	version: text().notNull(),
	importedAt: timestamp("imported_at", { mode: 'string' }).defaultNow().notNull(),
	recordCount: integer("record_count"),
	checksum: text(),
});

export const teamInquiryRequests = pgTable("team_inquiry_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	contactEmail: text("contact_email").notNull(),
	contactName: text("contact_name"),
	rolesJson: jsonb("roles_json").notNull(),
	teamSize: text("team_size"),
	tier: text(),
	customRequests: jsonb("custom_requests"),
	totalPeople: integer("total_people"),
	totalMinutesPerDay: integer("total_minutes_per_day"),
	totalAnnualValue: integer("total_annual_value"),
	fteEquivalents: numeric("fte_equivalents", { precision: 5, scale:  1 }),
	userAgent: text("user_agent"),
	ipHash: text("ip_hash"),
	pdfSentAt: timestamp("pdf_sent_at", { withTimezone: true, mode: 'string' }),
	pdfSendError: text("pdf_send_error"),
}, (table) => [
	index("team_inquiry_requests_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("team_inquiry_requests_email_idx").using("btree", table.contactEmail.asc().nullsLast().op("text_ops")),
]);

export const taskCapabilityMappings = pgTable("task_capability_mappings", {
	id: serial().primaryKey().notNull(),
	microTaskId: integer("micro_task_id").notNull(),
	capabilityKey: text("capability_key").notNull(),
	confidence: real().default(0.8).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("task_capability_mappings_capability_idx").using("btree", table.capabilityKey.asc().nullsLast().op("text_ops")),
	index("task_capability_mappings_task_idx").using("btree", table.microTaskId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.capabilityKey],
			foreignColumns: [moduleCapabilities.capabilityKey],
			name: "task_capability_mappings_capability_key_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.microTaskId],
			foreignColumns: [jobMicroTasks.id],
			name: "task_capability_mappings_micro_task_id_fkey"
		}).onDelete("cascade"),
]);

export const moduleCapabilities = pgTable("module_capabilities", {
	id: serial().primaryKey().notNull(),
	moduleKey: text("module_key").notNull(),
	capabilityKey: text("capability_key").notNull(),
	capabilityName: text("capability_name").notNull(),
	description: text().notNull(),
	exampleTasks: text("example_tasks").array().default([""]).notNull(),
	likelySystems: text("likely_systems").array().default([""]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("module_capabilities_module_key_idx").using("btree", table.moduleKey.asc().nullsLast().op("text_ops")),
	unique("module_capabilities_capability_key_key").on(table.capabilityKey),
]);

export const assistantInquiries = pgTable("assistant_inquiries", {
	id: serial().primaryKey().notNull(),
	occupationId: integer("occupation_id"),
	occupationTitle: text("occupation_title"),
	occupationSlug: text("occupation_slug"),
	recommendedModules: text("recommended_modules").array().default([""]).notNull(),
	selectedModules: text("selected_modules").array().default([""]).notNull(),
	addedModules: text("added_modules").array().default([""]).notNull(),
	removedModules: text("removed_modules").array().default([""]).notNull(),
	selectedCapabilities: text("selected_capabilities").array().default([""]).notNull(),
	customRequests: text("custom_requests").array().default([""]).notNull(),
	painPoints: text("pain_points").array().default([""]).notNull(),
	contactName: text("contact_name"),
	contactEmail: text("contact_email").notNull(),
	tier: text(),
	source: text().default('blueprint').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("assistant_inquiries_created_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("assistant_inquiries_occupation_idx").using("btree", table.occupationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "assistant_inquiries_occupation_id_fkey"
		}),
]);

export const demoAgentContent = pgTable("demo_agent_content", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	occupationId: bigint("occupation_id", { mode: "number" }).notNull(),
	moduleKey: text("module_key").notNull(),
	agentName: text("agent_name").notNull(),
	label: text().notNull(),
	accentColor: text("accent_color").notNull(),
	timeOfDay: text("time_of_day").notNull(),
	narrative: text().notNull(),
	loopData: jsonb("loop_data").notNull(),
	outputData: jsonb("output_data").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_demo_agent_content_occupation").using("btree", table.occupationId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "fk_demo_agent_content_occupation"
		}).onDelete("cascade"),
	unique("uq_demo_content").on(table.occupationId, table.moduleKey),
]);

export const demoAgentContentV2 = pgTable("demo_agent_content_v2", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	occupationId: bigint("occupation_id", { mode: "number" }).notNull(),
	moduleKey: text("module_key").notNull(),
	agentName: text("agent_name").notNull(),
	label: text().notNull(),
	accentColor: text("accent_color").notNull(),
	timeOfDay: text("time_of_day").notNull(),
	narrative: text().notNull(),
	loopData: jsonb("loop_data").notNull(),
	outputData: jsonb("output_data").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_demo_agent_content_v2_occupation").using("btree", table.occupationId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "fk_demo_agent_content_v2_occupation"
		}).onDelete("cascade"),
	unique("uq_demo_content_v2").on(table.occupationId, table.moduleKey),
]);

export const demoLeads = pgTable("demo_leads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	email: text(),
	taskDescription: text("task_description").notNull(),
	occupationContext: text("occupation_context"),
	ipHash: text("ip_hash"),
	generationId: uuid("generation_id"),
}, (table) => [
	index("idx_demo_leads_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);

// Every /demo/try generation, captured whether or not the visitor leaves an
// email — the raw task descriptions are market intel on their own.
export const demoGenerations = pgTable("demo_generations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	taskDescription: text("task_description").notNull(),
	occupationContext: text("occupation_context"),
	generatedRole: jsonb("generated_role"),
	success: boolean().notNull(),
	error: text(),
	ipHash: text("ip_hash"),
}, (table) => [
	index("idx_demo_generations_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);
