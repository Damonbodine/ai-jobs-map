import { describe, it, expect } from 'vitest';
import {
  documentPipeline,
  dataAnalysisEngine,
  communicationRouter,
  financialOpsSuite,
  salesAutomation,
  researchSynthesizer,
  qualityAssurance,
  hrAutomation,
  workflows,
} from '../index';

describe('Workflows', () => {
  describe('Document Processing Pipeline', () => {
    it('should have valid workflow structure', () => {
      expect(documentPipeline.id).toBe('wf-001');
      expect(documentPipeline.code).toBe('WF-DOC-PIPE');
      expect(documentPipeline.name).toBeDefined();
      expect(documentPipeline.steps).toBeDefined();
      expect(documentPipeline.steps.length).toBeGreaterThan(0);
    });

    it('should have valid start and end steps', () => {
      expect(documentPipeline.startStep).toBeDefined();
      expect(documentPipeline.endStep).toBeDefined();
      const stepIds = documentPipeline.steps.map((s) => s.stepId);
      expect(stepIds).toContain(documentPipeline.startStep);
      expect(stepIds).toContain(documentPipeline.endStep);
    });

    it('should have valid pricing', () => {
      expect(documentPipeline.basePrice).toBeGreaterThan(0);
      expect(documentPipeline.monthlyPrice).toBeGreaterThan(0);
    });

    it('should have valid metrics', () => {
      expect(documentPipeline.avgExecutionTime).toBeGreaterThan(0);
      expect(documentPipeline.successRate).toBeGreaterThan(0);
      expect(documentPipeline.successRate).toBeLessThanOrEqual(100);
      expect(documentPipeline.estimatedHoursSavedPerWeek).toBeGreaterThan(0);
    });

    it('should have steps with required fields', () => {
      documentPipeline.steps.forEach((step) => {
        expect(step.stepId).toBeDefined();
        expect(step.agentId).toBeDefined();
        expect(step.agentName).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.onSuccess).toBeDefined();
        expect(step.onFailure).toBeDefined();
        expect(step.retryCount).toBeGreaterThanOrEqual(0);
        expect(step.timeout).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid skill targets', () => {
      expect(documentPipeline.targetSkills).toBeDefined();
      expect(Array.isArray(documentPipeline.targetSkills)).toBe(true);
    });
  });

  describe('All Workflows', () => {
    it('should have 8 core workflows', () => {
      expect(workflows.length).toBe(8);
    });

    it('should have unique IDs', () => {
      const ids = workflows.map((w) => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique codes', () => {
      const codes = workflows.map((w) => w.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('each workflow should have valid structure', () => {
      workflows.forEach((workflow) => {
        expect(workflow.id).toBeDefined();
        expect(workflow.code).toBeDefined();
        expect(workflow.name).toBeDefined();
        expect(workflow.description).toBeDefined();
        expect(workflow.category).toBeDefined();
        expect(workflow.icon).toBeDefined();
        expect(workflow.steps).toBeDefined();
        expect(workflow.steps.length).toBeGreaterThan(0);
        expect(workflow.basePrice).toBeGreaterThan(0);
        expect(workflow.monthlyPrice).toBeGreaterThan(0);
        expect(workflow.avgExecutionTime).toBeGreaterThan(0);
        expect(workflow.successRate).toBeGreaterThan(0);
        expect(workflow.successRate).toBeLessThanOrEqual(100);
      });
    });

    it('each workflow should have valid step references', () => {
      workflows.forEach((workflow) => {
        const stepIds = new Set(workflow.steps.map((s) => s.stepId));
        
        workflow.steps.forEach((step) => {
          const validSuccess = ['stop', 'end'].includes(step.onSuccess) || stepIds.has(step.onSuccess);
          const validFailure = ['stop', 'end'].includes(step.onFailure) || stepIds.has(step.onFailure);
          expect(validSuccess).toBe(true);
          expect(validFailure).toBe(true);
        });
      });
    });

    it('each workflow should have start step referenced', () => {
      workflows.forEach((workflow) => {
        const stepIds = workflow.steps.map((s) => s.stepId);
        expect(stepIds).toContain(workflow.startStep);
      });
    });

    it('each workflow should have end step referenced', () => {
      workflows.forEach((workflow) => {
        const stepIds = workflow.steps.map((s) => s.stepId);
        expect(stepIds).toContain(workflow.endStep);
      });
    });
  });

  describe('Data Analysis Engine', () => {
    it('should have correct ID', () => {
      expect(dataAnalysisEngine.id).toBe('wf-002');
    });

    it('should have processing steps', () => {
      const hasAnalyze = dataAnalysisEngine.steps.some(
        (s) => s.agentId === 'agent-analyze'
      );
      expect(hasAnalyze).toBe(true);
    });
  });

  describe('Communication Router', () => {
    it('should have correct ID', () => {
      expect(communicationRouter.id).toBe('wf-003');
    });

    it('should have routing capabilities', () => {
      const hasRoute = communicationRouter.steps.some(
        (s) => s.agentId === 'agent-route'
      );
      expect(hasRoute).toBe(true);
    });
  });

  describe('Financial Operations', () => {
    it('should have correct ID', () => {
      expect(financialOpsSuite.id).toBe('wf-004');
    });

    it('should have validation steps', () => {
      const hasValidate = financialOpsSuite.steps.some(
        (s) => s.agentId === 'agent-validate'
      );
      expect(hasValidate).toBe(true);
    });
  });

  describe('Sales Automation', () => {
    it('should have correct ID', () => {
      expect(salesAutomation.id).toBe('wf-005');
    });
  });

  describe('Research Synthesizer', () => {
    it('should have correct ID', () => {
      expect(researchSynthesizer.id).toBe('wf-006');
    });
  });

  describe('Quality Assurance', () => {
    it('should have correct ID', () => {
      expect(qualityAssurance.id).toBe('wf-007');
    });
  });

  describe('HR Automation', () => {
    it('should have correct ID', () => {
      expect(hrAutomation.id).toBe('wf-008');
    });
  });
});
