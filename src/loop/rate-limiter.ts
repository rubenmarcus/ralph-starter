/**
 * Rate Limiter for controlling API call frequency
 */

export interface RateLimiterConfig {
  maxCallsPerHour: number;
  maxCallsPerMinute: number;
  warningThreshold: number; // 0-1, e.g., 0.8 for 80%
}

export interface RateLimiterStats {
  callsThisMinute: number;
  callsThisHour: number;
  minuteLimit: number;
  hourLimit: number;
  isWarning: boolean;
  isBlocked: boolean;
  nextAvailableAt?: Date;
}

export const DEFAULT_RATE_LIMITER_CONFIG: RateLimiterConfig = {
  maxCallsPerHour: 100,
  maxCallsPerMinute: 10,
  warningThreshold: 0.8,
};

export class RateLimiter {
  private config: RateLimiterConfig;
  private callTimestamps: number[] = [];

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMITER_CONFIG, ...config };
  }

  /**
   * Clean up old timestamps outside the tracking window
   */
  private cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove timestamps older than 1 hour
    this.callTimestamps = this.callTimestamps.filter((ts) => ts > oneHourAgo);
  }

  /**
   * Get calls within a time window
   */
  private getCallsInWindow(windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    return this.callTimestamps.filter((ts) => ts > windowStart).length;
  }

  /**
   * Check if we can make a call (doesn't record the call)
   */
  canMakeCall(): boolean {
    this.cleanup();

    const callsThisMinute = this.getCallsInWindow(60 * 1000);
    const callsThisHour = this.getCallsInWindow(60 * 60 * 1000);

    return (
      callsThisMinute < this.config.maxCallsPerMinute && callsThisHour < this.config.maxCallsPerHour
    );
  }

  /**
   * Record a call (should be called after making an API call)
   */
  recordCall(): void {
    this.callTimestamps.push(Date.now());
    this.cleanup();
  }

  /**
   * Try to acquire permission to make a call
   * @returns true if call is allowed, false if rate limited
   */
  tryAcquire(): boolean {
    if (!this.canMakeCall()) {
      return false;
    }
    this.recordCall();
    return true;
  }

  /**
   * Wait until we can make a call, then acquire
   * @param maxWaitMs Maximum time to wait (default: 5 minutes)
   * @returns true if acquired, false if timeout
   */
  async waitAndAcquire(maxWaitMs: number = 5 * 60 * 1000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      if (this.tryAcquire()) {
        return true;
      }

      // Wait a bit before retrying
      const waitTime = this.getWaitTime();
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 5000)));
    }

    return false;
  }

  /**
   * Get time until next call is available
   */
  getWaitTime(): number {
    this.cleanup();

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const callsThisMinute = this.callTimestamps.filter((ts) => ts > oneMinuteAgo);
    const callsThisHour = this.callTimestamps.filter((ts) => ts > oneHourAgo);

    // If minute limit is hit
    if (callsThisMinute.length >= this.config.maxCallsPerMinute) {
      const oldestInMinute = Math.min(...callsThisMinute);
      return oldestInMinute + 60 * 1000 - now + 100; // +100ms buffer
    }

    // If hour limit is hit
    if (callsThisHour.length >= this.config.maxCallsPerHour) {
      const oldestInHour = Math.min(...callsThisHour);
      return oldestInHour + 60 * 60 * 1000 - now + 100;
    }

    return 0;
  }

  /**
   * Get current rate limiter statistics
   */
  getStats(): RateLimiterStats {
    this.cleanup();

    const callsThisMinute = this.getCallsInWindow(60 * 1000);
    const callsThisHour = this.getCallsInWindow(60 * 60 * 1000);

    const minuteRatio = callsThisMinute / this.config.maxCallsPerMinute;
    const hourRatio = callsThisHour / this.config.maxCallsPerHour;

    const isWarning =
      minuteRatio >= this.config.warningThreshold || hourRatio >= this.config.warningThreshold;

    const isBlocked = !this.canMakeCall();

    const waitTime = this.getWaitTime();
    const nextAvailableAt = waitTime > 0 ? new Date(Date.now() + waitTime) : undefined;

    return {
      callsThisMinute,
      callsThisHour,
      minuteLimit: this.config.maxCallsPerMinute,
      hourLimit: this.config.maxCallsPerHour,
      isWarning,
      isBlocked,
      nextAvailableAt,
    };
  }

  /**
   * Format stats for display
   */
  formatStats(): string {
    const stats = this.getStats();
    const lines: string[] = [];

    lines.push(
      `Minute: ${stats.callsThisMinute}/${stats.minuteLimit} (${Math.round(
        (stats.callsThisMinute / stats.minuteLimit) * 100
      )}%)`
    );
    lines.push(
      `Hour: ${stats.callsThisHour}/${stats.hourLimit} (${Math.round(
        (stats.callsThisHour / stats.hourLimit) * 100
      )}%)`
    );

    if (stats.isBlocked && stats.nextAvailableAt) {
      const waitSecs = Math.ceil((stats.nextAvailableAt.getTime() - Date.now()) / 1000);
      lines.push(`Blocked - retry in ${waitSecs}s`);
    } else if (stats.isWarning) {
      lines.push('Warning: Approaching rate limit');
    }

    return lines.join(' | ');
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.callTimestamps = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimiterConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
