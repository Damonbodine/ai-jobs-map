import { describe, it, expect } from 'vitest';
import {
  mapSkillsToWorkflows,
  getAgentsForWorkflow,
  buildWorkflowSteps,
  calculateWorkflowCost,
} from '../skill-mapper';

describe('Skill Mapper', () => {
  describe('mapSkillsToWorkflows', () => {
    it('should map skills to workflows based on skill codes', () => {
      const skillNames = new Map([
        ['SK-INFO-001', 'Document Processing'],
        ['SK-ANAL-004', 'Data Analysis'],
      ]);
      
      const mappings = mapSkillsToWorkflows(['SK-INFO-001', 'SK-ANAL-004'], skillNames);
      
      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings[0].workflowName).toBeDefined();
    });

    it('should return default workflow when no skills match', () => {
      const skillNames = new Map();
      const mappings = mapSkillsToWorkflows([], skillNames);
      
      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings[0].workflowName).toBe('Document Pipeline');
    });

    it('should calculate priority correctly', () => {
      const skillNames = new Map([
        ['SK-INFO-001', 'Document Processing'],
        ['SK-INFO-003', 'Document Processing'],
      ]);
      
      const mappings = mapSkillsToWorkflows(['SK-INFO-001', 'SK-INFO-003'], skillNames);
      
      // SK-INFO-001 should have higher priority than SK-INFO-003
      const priority1 = mappings.find(m => m.skillCode === 'SK-INFO-001')?.priority || 0;
      const priority3 = mappings.find(m => m.skillCode === 'SK-INFO-003')?.priority || 0;
      expect(priority1).toBeGreaterThanOrEqual(priority3);
    });
  });

  describe('getAgentsForWorkflow', () => {
    it('should return agents for Document Pipeline', () => {
      const agents = getAgentsForWorkflow('Document Pipeline');
      
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some(a => a.agentId === 'agent-ocr')).toBe(true);
    });

    it('should return agents for Data Analysis Engine', () => {
      const agents = getAgentsForWorkflow('Data Analysis Engine');
      
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some(a => a.agentId === 'agent-analyze')).toBe(true);
    });

    it('should include required skills for each agent', () => {
      const agents = getAgentsForWorkflow('Data Analysis Engine');
      const analyzer = agents.find(a => a.agentId === 'agent-analyze');
      
      expect(analyzer?.requiredSkills).toBeDefined();
      expect(analyzer?.requiredSkills.length).toBeGreaterThan(0);
    });
  });

  describe('buildWorkflowSteps', () => {
    it('should build workflow steps from skill mappings', () => {
      const skillNames = new Map([
        ['SK-INFO-001', 'Document Processing'],
      ]);
      
      const mappings = mapSkillsToWorkflows(['SK-INFO-001'], skillNames);
      const steps = buildWorkflowSteps(mappings);
      
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.stepId === 'store')).toBe(true);
      expect(steps.some(s => s.stepId === 'notify')).toBe(true);
    });

    it('should include processing agents in steps', () => {
      const skillNames = new Map([
        ['SK-ANAL-004', 'Data Analysis'],
      ]);
      
      const mappings = mapSkillsToWorkflows(['SK-ANAL-004'], skillNames);
      const steps = buildWorkflowSteps(mappings);
      
      const hasAnalyze = steps.some(s => s.agentId === 'agent-analyze');
      expect(hasAnalyze).toBe(true);
    });
  });

  describe('calculateWorkflowCost', () => {
    it('should calculate setup cost based on steps', () => {
      const steps = [
        { stepId: 'receive', agentId: 'agent-webhook', agentName: 'Webhook', description: 'Receive', onSuccess: 'next', onFailure: 'error', retryCount: 3, timeout: 10 },
        { stepId: 'parse', agentId: 'agent-parse', agentName: 'Parser', description: 'Parse', onSuccess: 'next', onFailure: 'error', retryCount: 3, timeout: 10 },
        { stepId: 'analyze', agentId: 'agent-analyze', agentName: 'Analyzer', description: 'Analyze', onSuccess: 'next', onFailure: 'error', retryCount: 3, timeout: 30 },
      ] as any;
      
      const cost = calculateWorkflowCost(steps);
      
      expect(cost.setupCost).toBeGreaterThan(0);
      expect(cost.monthlyCost).toBeGreaterThan(0);
      expect(cost.estimatedHoursSaved).toBeGreaterThan(0);
    });

    it('should calculate positive payback days', () => {
      const steps = [
        { stepId: 'receive', agentId: 'agent-webhook', agentName: 'Webhook', description: 'Receive', onSuccess: 'next', onFailure: 'error', retryCount: 3, timeout: 10 },
        { stepId: 'analyze', agentId: 'agent-analyze', agentName: 'Analyzer', description: 'Analyze', onSuccess: 'next', onFailure: 'error', retryCount: 3, timeout: 30 },
        { stepId: 'store', agentId: 'agent-store', agentName: 'Storage', description: 'Store', onSuccess: 'next', onFailure: 'error', retryCount: 2, timeout: 15 },
        { stepId: 'notify', agentId: 'agent-notify', agentName: 'Notifier', description: 'Notify', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 },
      ] as any;
      
      const cost = calculateWorkflowCost(steps);
      
      expect(cost.paybackDays).toBeGreaterThan(0);
      expect(cost.paybackDays).toBeLessThan(365);
    });
  });
});
