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
    it('should treat errors with different file:line:col locations as the same', () => {
      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 100,
        maxSameErrorCount: 3,
      });

      // Same error at different file locations should hash identically
      customBreaker.recordFailure('Error in src/index.ts:42:5');
      customBreaker.recordSuccess();
      customBreaker.recordFailure('Error in src/index.ts:99:12');
      customBreaker.recordSuccess();
      expect(customBreaker.recordFailure('Error in src/index.ts:123:3')).toBe(true);
    });

    it('should treat semantically different errors as distinct', () => {
      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 100,
        maxSameErrorCount: 3,
      });

      // Different error messages should NOT hash identically
      customBreaker.recordFailure('port 8000 already in use');
      customBreaker.recordSuccess();
      customBreaker.recordFailure('file not found: config.json');
      customBreaker.recordSuccess();
      // Third unique error — should NOT trip (only 1 of each)
      expect(customBreaker.recordFailure('permission denied: /etc/shadow')).toBe(false);
    });

    it('should normalize stack traces', () => {
      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 100,
        maxSameErrorCount: 3,
      });

      customBreaker.recordFailure('TypeError: cannot read property at Object.run (/src/a.ts:10:5)');
      customBreaker.recordSuccess();
      customBreaker.recordFailure('TypeError: cannot read property at Object.run (/src/b.ts:20:3)');
      customBreaker.recordSuccess();
      expect(
        customBreaker.recordFailure(
          'TypeError: cannot read property at Object.run (/src/c.ts:30:1)'
        )
      ).toBe(true);
    });

    it('should normalize timestamps correctly (before :line:col pattern)', () => {
      const customBreaker = new CircuitBreaker({
        maxConsecutiveFailures: 100,
        maxSameErrorCount: 3,
      });

      // Same error with different timestamps should hash identically
      customBreaker.recordFailure('Error at 2026-02-13T14:07:39 in module');
      customBreaker.recordSuccess();
      customBreaker.recordFailure('Error at 2026-02-13T15:22:01 in module');
      customBreaker.recordSuccess();
      expect(customBreaker.recordFailure('Error at 2026-02-14T09:00:00 in module')).toBe(true);
    });
  });
});
