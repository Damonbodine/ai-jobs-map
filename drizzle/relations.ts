import { relations } from "drizzle-orm/relations";
import { occupations, jobMicroTasks, aiOpportunities, skillRecommendations, onetTasks, tasksToDwas, smartWorkflows, smartWorkflowInternalMappings, smartWorkflowOccupationMappings, occupationAutomationProfile, onetAbilities, onetKnowledge, onetWorkActivities, automationBenchmarks, moduleCapabilities, taskCapabilityMappings, assistantInquiries, demoAgentContent, demoAgentContentV2 } from "../lib/db/schema";

export const jobMicroTasksRelations = relations(jobMicroTasks, ({one, many}) => ({
	occupation: one(occupations, {
		fields: [jobMicroTasks.occupationId],
		references: [occupations.id]
	}),
	taskCapabilityMappings: many(taskCapabilityMappings),
}));

export const occupationsRelations = relations(occupations, ({many}) => ({
	jobMicroTasks: many(jobMicroTasks),
	aiOpportunities_occupationId: many(aiOpportunities, {
		relationName: "aiOpportunities_occupationId_occupations_id"
	}),
	skillRecommendations_occupationId: many(skillRecommendations, {
		relationName: "skillRecommendations_occupationId_occupations_id"
	}),
	onetTasks: many(onetTasks),
	tasksToDwas: many(tasksToDwas),
	smartWorkflowOccupationMappings: many(smartWorkflowOccupationMappings),
	occupationAutomationProfiles: many(occupationAutomationProfile),
	onetAbilities: many(onetAbilities),
	onetKnowledges: many(onetKnowledge),
	onetWorkActivities: many(onetWorkActivities),
	automationBenchmarks: many(automationBenchmarks),
	assistantInquiries: many(assistantInquiries),
	demoAgentContents: many(demoAgentContent),
	demoAgentContentV2s: many(demoAgentContentV2),
}));

export const aiOpportunitiesRelations = relations(aiOpportunities, ({one}) => ({
	occupation_occupationId: one(occupations, {
		fields: [aiOpportunities.occupationId],
		references: [occupations.id],
		relationName: "aiOpportunities_occupationId_occupations_id"
	}),
}));

export const skillRecommendationsRelations = relations(skillRecommendations, ({one}) => ({
	occupation_occupationId: one(occupations, {
		fields: [skillRecommendations.occupationId],
		references: [occupations.id],
		relationName: "skillRecommendations_occupationId_occupations_id"
	}),
}));

export const onetTasksRelations = relations(onetTasks, ({one}) => ({
	occupation: one(occupations, {
		fields: [onetTasks.occupationId],
		references: [occupations.id]
	}),
}));

export const tasksToDwasRelations = relations(tasksToDwas, ({one}) => ({
	occupation: one(occupations, {
		fields: [tasksToDwas.occupationId],
		references: [occupations.id]
	}),
}));

export const smartWorkflowInternalMappingsRelations = relations(smartWorkflowInternalMappings, ({one}) => ({
	smartWorkflow: one(smartWorkflows, {
		fields: [smartWorkflowInternalMappings.workflowId],
		references: [smartWorkflows.id]
	}),
}));

export const smartWorkflowsRelations = relations(smartWorkflows, ({many}) => ({
	smartWorkflowInternalMappings: many(smartWorkflowInternalMappings),
	smartWorkflowOccupationMappings: many(smartWorkflowOccupationMappings),
}));

export const smartWorkflowOccupationMappingsRelations = relations(smartWorkflowOccupationMappings, ({one}) => ({
	occupation: one(occupations, {
		fields: [smartWorkflowOccupationMappings.occupationId],
		references: [occupations.id]
	}),
	smartWorkflow: one(smartWorkflows, {
		fields: [smartWorkflowOccupationMappings.workflowId],
		references: [smartWorkflows.id]
	}),
}));

export const occupationAutomationProfileRelations = relations(occupationAutomationProfile, ({one}) => ({
	occupation: one(occupations, {
		fields: [occupationAutomationProfile.occupationId],
		references: [occupations.id]
	}),
}));

export const onetAbilitiesRelations = relations(onetAbilities, ({one}) => ({
	occupation: one(occupations, {
		fields: [onetAbilities.occupationId],
		references: [occupations.id]
	}),
}));

export const onetKnowledgeRelations = relations(onetKnowledge, ({one}) => ({
	occupation: one(occupations, {
		fields: [onetKnowledge.occupationId],
		references: [occupations.id]
	}),
}));

export const onetWorkActivitiesRelations = relations(onetWorkActivities, ({one}) => ({
	occupation: one(occupations, {
		fields: [onetWorkActivities.occupationId],
		references: [occupations.id]
	}),
}));

export const automationBenchmarksRelations = relations(automationBenchmarks, ({one}) => ({
	occupation: one(occupations, {
		fields: [automationBenchmarks.occupationId],
		references: [occupations.id]
	}),
}));

export const taskCapabilityMappingsRelations = relations(taskCapabilityMappings, ({one}) => ({
	moduleCapability: one(moduleCapabilities, {
		fields: [taskCapabilityMappings.capabilityKey],
		references: [moduleCapabilities.capabilityKey]
	}),
	jobMicroTask: one(jobMicroTasks, {
		fields: [taskCapabilityMappings.microTaskId],
		references: [jobMicroTasks.id]
	}),
}));

export const moduleCapabilitiesRelations = relations(moduleCapabilities, ({many}) => ({
	taskCapabilityMappings: many(taskCapabilityMappings),
}));

export const assistantInquiriesRelations = relations(assistantInquiries, ({one}) => ({
	occupation: one(occupations, {
		fields: [assistantInquiries.occupationId],
		references: [occupations.id]
	}),
}));

export const demoAgentContentRelations = relations(demoAgentContent, ({one}) => ({
	occupation: one(occupations, {
		fields: [demoAgentContent.occupationId],
		references: [occupations.id]
	}),
}));

export const demoAgentContentV2Relations = relations(demoAgentContentV2, ({one}) => ({
	occupation: one(occupations, {
		fields: [demoAgentContentV2.occupationId],
		references: [occupations.id]
	}),
}));
