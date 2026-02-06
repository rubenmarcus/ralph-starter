import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RATE_LIMITER_CONFIG, RateLimiter } from '../rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const stats = limiter.getStats();
      expect(stats.minuteLimit).toBe(DEFAULT_RATE_LIMITER_CONFIG.maxCallsPerMinute);
      expect(stats.hourLimit).toBe(DEFAULT_RATE_LIMITER_CONFIG.maxCallsPerHour);
    });

    it('should accept custom config', () => {
      const customLimiter = new RateLimiter({
        maxCallsPerMinute: 5,
        maxCallsPerHour: 50,
      });
      const stats = customLimiter.getStats();
      expect(stats.minuteLimit).toBe(5);
      expect(stats.hourLimit).toBe(50);
    });
  });

  describe('canMakeCall', () => {
    it('should allow calls within limits', () => {
      expect(limiter.canMakeCall()).toBe(true);
    });

    it('should block when minute limit is reached', () => {
      const customLimiter = new RateLimiter({ maxCallsPerMinute: 2 });

      customLimiter.recordCall();
      customLimiter.recordCall();

      expect(customLimiter.canMakeCall()).toBe(false);
    });

    it('should block when hour limit is reached', () => {
      const customLimiter = new RateLimiter({
        maxCallsPerMinute: 100,
        maxCallsPerHour: 3,
      });

      customLimiter.recordCall();
      customLimiter.recordCall();
      customLimiter.recordCall();

      expect(customLimiter.canMakeCall()).toBe(false);
    });

    it('should allow calls after minute window passes', () => {
      const customLimiter = new RateLimiter({ maxCallsPerMinute: 1 });

      customLimiter.recordCall();
      expect(customLimiter.canMakeCall()).toBe(false);

      // Advance past 1 minute
      vi.advanceTimersByTime(61 * 1000);

      expect(customLimiter.canMakeCall()).toBe(true);
    });
  });

  describe('recordCall', () => {
    it('should track call timestamps', () => {
      limiter.recordCall();
      limiter.recordCall();

      const stats = limiter.getStats();
      expect(stats.callsThisMinute).toBe(2);
      expect(stats.callsThisHour).toBe(2);
    });

    it('should cleanup old timestamps', () => {
      limiter.recordCall();

      // Advance past 1 hour
      vi.advanceTimersByTime(61 * 60 * 1000);

      limiter.recordCall();

      const stats = limiter.getStats();
      expect(stats.callsThisHour).toBe(1);
    });
  });

  describe('tryAcquire', () => {
    it('should return true and record call when allowed', () => {
      expect(limiter.tryAcquire()).toBe(true);

      const stats = limiter.getStats();
      expect(stats.callsThisMinute).toBe(1);
    });

    it('should return false when blocked', () => {
      const customLimiter = new RateLimiter({ maxCallsPerMinute: 1 });

      expect(customLimiter.tryAcquire()).toBe(true);
      expect(customLimiter.tryAcquire()).toBe(false);
    });
  });

  describe('getWaitTime', () => {
    it('should return 0 when not blocked', () => {
      expect(limiter.getWaitTime()).toBe(0);
    });

    it('should return wait time when minute limit hit', () => {
      const customLimiter = new RateLimiter({ maxCallsPerMinute: 1 });

      customLimiter.recordCall();
      const waitTime = customLimiter.getWaitTime();

      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThanOrEqual(60 * 1000 + 100);
    });

    it('should return wait time when hour limit hit', () => {
      const customLimiter = new RateLimiter({
        maxCallsPerMinute: 100,
        maxCallsPerHour: 1,
      });

      customLimiter.recordCall();
      const waitTime = customLimiter.getWaitTime();

      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThanOrEqual(60 * 60 * 1000 + 100);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const customLimiter = new RateLimiter({
        maxCallsPerMinute: 10,
        maxCallsPerHour: 100,
        warningThreshold: 0.5,
      });

      // Make 5 calls (50% of minute limit)
      for (let i = 0; i < 5; i++) {
        customLimiter.recordCall();
      }

      const stats = customLimiter.getStats();

      expect(stats.callsThisMinute).toBe(5);
      expect(stats.callsThisHour).toBe(5);
      expect(stats.isWarning).toBe(true); // 50% >= warningThreshold
      expect(stats.isBlocked).toBe(false);
    });

    it('should show blocked status when limit reached', () => {
      const customLimiter = new RateLimiter({ maxCallsPerMinute: 2 });

      customLimiter.recordCall();
      customLimiter.recordCall();

      const stats = customLimiter.getStats();

      expect(stats.isBlocked).toBe(true);
      expect(stats.nextAvailableAt).toBeDefined();
    });
  });

  describe('formatStats', () => {
    it('should format stats for display', () => {
      limiter.recordCall();

      const formatted = limiter.formatStats();

      expect(formatted).toContain('Minute:');
      expect(formatted).toContain('Hour:');
    });

    it('should show blocked message when blocked', () => {
      const customLimiter = new RateLimiter({ maxCallsPerMinute: 1 });

      customLimiter.recordCall();

      const formatted = customLimiter.formatStats();

      expect(formatted).toContain('Blocked');
    });

    it('should show warning when approaching limit', () => {
      const customLimiter = new RateLimiter({
        maxCallsPerMinute: 10,
        warningThreshold: 0.5,
      });

      // Make 6 calls (60% > 50% threshold)
      for (let i = 0; i < 6; i++) {
        customLimiter.recordCall();
      }

      const formatted = customLimiter.formatStats();

      expect(formatted).toContain('Warning');
    });
  });

  describe('reset', () => {
    it('should clear all timestamps', () => {
      limiter.recordCall();
      limiter.recordCall();

      limiter.reset();

      const stats = limiter.getStats();
      expect(stats.callsThisMinute).toBe(0);
      expect(stats.callsThisHour).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      limiter.updateConfig({ maxCallsPerMinute: 5 });

      const stats = limiter.getStats();
      expect(stats.minuteLimit).toBe(5);
    });

    it('should preserve other config values', () => {
      limiter.updateConfig({ maxCallsPerMinute: 5 });

      const stats = limiter.getStats();
      expect(stats.hourLimit).toBe(DEFAULT_RATE_LIMITER_CONFIG.maxCallsPerHour);
    });
  });

  describe('waitAndAcquire', () => {
    it('should acquire immediately if not blocked', async () => {
      vi.useRealTimers(); // Need real timers for async

      const result = await limiter.waitAndAcquire(1000);
      expect(result).toBe(true);
    });

    it(
      'should timeout if blocked too long',
      async () => {
        vi.useRealTimers();

        const customLimiter = new RateLimiter({ maxCallsPerMinute: 1 });
        customLimiter.recordCall();

        // Wait only 100ms (much less than 60s needed)
        const result = await customLimiter.waitAndAcquire(100);
        expect(result).toBe(false);
      },
      10000
    ); // Increase timeout for real timer test
  });
});
