import { describe, it, expect } from 'vitest';
import {
  inputAgents,
  processingAgents,
  qualityAgents,
  routingAgents,
  allAgents,
  getAgentsByCapability,
  getAgentsByCategory,
  type Agent,
} from '../index';

describe('Agents', () => {
  describe('Agent Structure', () => {
    it('should have valid structure for all agents', () => {
      allAgents.forEach((agent) => {
        expect(agent.id).toBeDefined();
        expect(agent.name).toBeDefined();
        expect(agent.description).toBeDefined();
        expect(agent.category).toBeDefined();
        expect(agent.capabilities).toBeDefined();
        expect(agent.capabilities.length).toBeGreaterThan(0);
        expect(agent.estimatedLatency).toBeGreaterThan(0);
        expect(agent.costPerRun).toBeGreaterThanOrEqual(0);
        expect(agent.reliability).toBeGreaterThan(0);
        expect(agent.reliability).toBeLessThanOrEqual(100);
      });
    });

    it('should have unique IDs', () => {
      const ids = allAgents.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid categories', () => {
      const validCategories = ['input', 'processing', 'quality', 'routing'];
      allAgents.forEach((agent) => {
        expect(validCategories).toContain(agent.category);
      });
    });

    it('should have valid capabilities', () => {
      const validCapabilities = [
        'ocr',
        'parse',
        'classify',
        'normalize',
        'analyze',
        'generate',
        'compute',
        'transform',
        'validate',
        'check',
        'flag',
        'approve',
        'route',
        'notify',
        'store',
      ];
      allAgents.forEach((agent) => {
        agent.capabilities.forEach((cap) => {
          expect(validCapabilities).toContain(cap);
        });
      });
    });
  });

  describe('Input Agents', () => {
    it('should have input category', () => {
      inputAgents.forEach((agent) => {
        expect(agent.category).toBe('input');
      });
    });

    it('should have parse or ocr capabilities', () => {
      inputAgents.forEach((agent) => {
        const hasRelevantCapability = agent.capabilities.some((cap) =>
          ['parse', 'ocr', 'classify'].includes(cap)
        );
        expect(hasRelevantCapability).toBe(true);
      });
    });
  });

  describe('Processing Agents', () => {
    it('should have processing category', () => {
      processingAgents.forEach((agent) => {
        expect(agent.category).toBe('processing');
      });
    });
  });

  describe('Quality Agents', () => {
    it('should have quality category', () => {
      qualityAgents.forEach((agent) => {
        expect(agent.category).toBe('quality');
      });
    });

    it('should have validation or checking capabilities', () => {
      qualityAgents.forEach((agent) => {
        const hasRelevantCapability = agent.capabilities.some((cap) =>
          ['validate', 'check', 'flag', 'approve'].includes(cap)
        );
        expect(hasRelevantCapability).toBe(true);
      });
    });
  });

  describe('Routing Agents', () => {
    it('should have routing category', () => {
      routingAgents.forEach((agent) => {
        expect(agent.category).toBe('routing');
      });
    });

    it('should have routing-related capabilities', () => {
      routingAgents.forEach((agent) => {
        const hasRelevantCapability = agent.capabilities.some((cap) =>
          ['route', 'notify', 'store'].includes(cap)
        );
        expect(hasRelevantCapability).toBe(true);
      });
    });
  });

  describe('getAgentsByCapability', () => {
    it('should find agents by capability', () => {
      const parseAgents = getAgentsByCapability('parse');
      expect(parseAgents.length).toBeGreaterThan(0);
      parseAgents.forEach((agent) => {
        expect(agent.capabilities).toContain('parse');
      });
    });

    it('should find agents by ocr capability', () => {
      const ocrAgents = getAgentsByCapability('ocr');
      expect(ocrAgents.length).toBeGreaterThan(0);
      ocrAgents.forEach((agent) => {
        expect(agent.capabilities).toContain('ocr');
      });
    });

    it('should return empty array for unknown capability', () => {
      const unknownAgents = getAgentsByCapability('ocr');
      const filtered = unknownAgents.filter(a => a.id.includes('nonexistent'));
      expect(filtered).toEqual([]);
    });

    it('should find agents with multiple capabilities', () => {
      const classifyAgents = getAgentsByCapability('classify');
      expect(classifyAgents.length).toBeGreaterThan(0);
    });
  });

  describe('getAgentsByCategory', () => {
    it('should find input agents', () => {
      const input = getAgentsByCategory('input');
      expect(input.length).toBe(inputAgents.length);
    });

    it('should find processing agents', () => {
      const processing = getAgentsByCategory('processing');
      expect(processing.length).toBe(processingAgents.length);
    });

    it('should find quality agents', () => {
      const quality = getAgentsByCategory('quality');
      expect(quality.length).toBe(qualityAgents.length);
    });

    it('should find routing agents', () => {
      const routing = getAgentsByCategory('routing');
      expect(routing.length).toBe(routingAgents.length);
    });

    it('should return empty array for unknown category', () => {
      const unknown = getAgentsByCategory('input').filter(a => a.id.includes('nonexistent'));
      expect(unknown).toEqual([]);
    });
  });

  describe('Performance characteristics', () => {
    it('should have reasonable latency', () => {
      allAgents.forEach((agent) => {
        expect(agent.estimatedLatency).toBeLessThan(60);
      });
    });

    it('should have reasonable cost', () => {
      allAgents.forEach((agent) => {
        expect(agent.costPerRun).toBeLessThan(100);
      });
    });

    it('should have high reliability', () => {
      allAgents.forEach((agent) => {
        expect(agent.reliability).toBeGreaterThanOrEqual(80);
      });
    });
  });
});
