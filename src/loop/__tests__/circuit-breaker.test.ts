import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CircuitBreaker } from '../circuit-breaker.js';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const state = breaker.getState();
      expect(state.consecutiveFailures).toBe(0);
      expect(state.totalFailures).toBe(0);
      expect(state.isOpen).toBe(false);
    });

    it('should accept custom config', () => {
      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 5,
        maxSameErrorCount: 10,
      });
      expect(customBreaker).toBeDefined();
    });
  });

  describe('recordSuccess', () => {
    it('should reset consecutive failures on success', () => {
      breaker.recordFailure('error 1');
      breaker.recordFailure('error 2');
      expect(breaker.getState().consecutiveFailures).toBe(2);

      breaker.recordSuccess();
      expect(breaker.getState().consecutiveFailures).toBe(0);
    });

    it('should not clear error history on success', () => {
      breaker.recordFailure('same error');
      breaker.recordSuccess();

      const state = breaker.getState();
      expect(state.errorHistory.size).toBeGreaterThan(0);
    });
  });

  describe('recordFailure', () => {
    it('should increment consecutive failures', () => {
      breaker.recordFailure('error');
      expect(breaker.getState().consecutiveFailures).toBe(1);

      breaker.recordFailure('error');
      expect(breaker.getState().consecutiveFailures).toBe(2);
    });

    it('should increment total failures', () => {
      breaker.recordFailure('error 1');
      breaker.recordFailure('error 2');
      breaker.recordSuccess();
      breaker.recordFailure('error 3');

      expect(breaker.getState().totalFailures).toBe(3);
    });

    it('should track error history by hash', () => {
      breaker.recordFailure('unique error 1');
      breaker.recordFailure('unique error 2');
      breaker.recordFailure('unique error 1'); // Same as first

      const stats = breaker.getStats();
      expect(stats.uniqueErrors).toBeGreaterThanOrEqual(1);
    });

    it('should trip circuit on consecutive failures', () => {
      const customBreaker = new CircuitBreaker({ maxConsecutiveFailures: 2 });

      expect(customBreaker.recordFailure('error 1')).toBe(false);
      expect(customBreaker.recordFailure('error 2')).toBe(true);
      expect(customBreaker.isTripped()).toBe(true);
    });

    it('should trip circuit on same error repeated', () => {
      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 100,
        maxSameErrorCount: 3,
      });

      const sameError = 'Connection refused';
      customBreaker.recordFailure(sameError);
      customBreaker.recordSuccess(); // Reset consecutive
      customBreaker.recordFailure(sameError);
      customBreaker.recordSuccess();
      expect(customBreaker.recordFailure(sameError)).toBe(true);
    });
  });

  describe('isTripped', () => {
    it('should return false when circuit is closed', () => {
      expect(breaker.isTripped()).toBe(false);
    });

    it('should return true when circuit is open', () => {
      const customBreaker = new CircuitBreaker({ maxConsecutiveFailures: 1 });
      customBreaker.recordFailure('error');
      expect(customBreaker.isTripped()).toBe(true);
    });

    it('should reset after cooldown period', () => {
      vi.useFakeTimers();

      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 1,
        cooldownMs: 1000,
      });

      customBreaker.recordFailure('error');
      expect(customBreaker.isTripped()).toBe(true);

      vi.advanceTimersByTime(1001);
      expect(customBreaker.isTripped()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('getTripReason', () => {
    it('should return null when not tripped', () => {
      expect(breaker.getTripReason()).toBeNull();
    });

    it('should return reason for consecutive failures', () => {
      const customBreaker = new CircuitBreaker({ maxConsecutiveFailures: 2 });
      customBreaker.recordFailure('error');
      customBreaker.recordFailure('error');

      const reason = customBreaker.getTripReason();
      expect(reason).toContain('consecutive failures');
    });

    it('should return reason for repeated errors', () => {
      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 100,
        maxSameErrorCount: 2,
      });

      customBreaker.recordFailure('same error');
      customBreaker.recordSuccess();
      customBreaker.recordFailure('same error');

      const reason = customBreaker.getTripReason();
      expect(reason).toContain('repeated');
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      breaker.recordFailure('error 1');
      breaker.recordFailure('error 2');

      breaker.reset();

      const state = breaker.getState();
      expect(state.consecutiveFailures).toBe(0);
      expect(state.totalFailures).toBe(0);
      expect(state.isOpen).toBe(false);
      expect(state.errorHistory.size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      breaker.recordFailure('error 1');
      breaker.recordFailure('error 2');
      breaker.recordFailure('error 1'); // Same as first

      const stats = breaker.getStats();
      expect(stats.consecutiveFailures).toBe(3);
      expect(stats.totalFailures).toBe(3);
      expect(stats.uniqueErrors).toBeGreaterThanOrEqual(1);
    });
  });

  describe('error normalization', () => {
    it('should treat similar errors with different numbers as the same', () => {
      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 100,
        maxSameErrorCount: 3,
      });

      // These should hash to similar values due to number normalization
      customBreaker.recordFailure('Error at line 42');
      customBreaker.recordSuccess();
      customBreaker.recordFailure('Error at line 99');
      customBreaker.recordSuccess();
      expect(customBreaker.recordFailure('Error at line 123')).toBe(true);
    });
  });
});
