import crypto from 'node:crypto';

export interface CircuitBreakerConfig {
  maxConsecutiveFailures: number;
  maxSameErrorCount: number;
  cooldownMs: number;
}

export interface CircuitBreakerState {
  consecutiveFailures: number;
  errorHistory: Map<string, number>;
  isOpen: boolean;
  lastFailure?: Date;
  totalFailures: number;
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  maxConsecutiveFailures: 3,
  maxSameErrorCount: 5,
  cooldownMs: 30000,
};

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
    this.state = {
      consecutiveFailures: 0,
      errorHistory: new Map(),
      isOpen: false,
      totalFailures: 0,
    };
  }

  /**
   * Hash an error message to track similar errors.
   * Normalizes variable parts (line numbers, timestamps, hex, stack traces)
   * while preserving semantically meaningful content like error messages.
   */
  private hashError(error: string): string {
    // Order matters: timestamps must be normalized before :line:col, otherwise
    // "14:07:39" in a timestamp matches :\d+:\d+ and gets mangled first.
    const normalized = error
      .replace(/0x[a-fA-F0-9]+/g, 'HEX') // Replace hex addresses
      .replace(/at\s+\S+\s+\(\S+:\d+:\d+\)/g, 'STACK') // Replace stack traces
      .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP') // Replace timestamps (before :line:col)
      .replace(/:\d+:\d+/g, ':N:N') // Replace file:line:col locations
      .toLowerCase()
      .trim()
      .slice(0, 500);

    return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 8);
  }

  /**
   * Record a successful iteration - resets consecutive failures
   */
  recordSuccess(): void {
    this.state.consecutiveFailures = 0;
    // Don't clear error history - we still want to track repeated errors
  }

  /**
   * Record a failed iteration
   * @returns true if circuit should trip (open)
   */
  recordFailure(errorMessage: string): boolean {
    this.state.consecutiveFailures++;
    this.state.totalFailures++;
    this.state.lastFailure = new Date();

    // Track error by hash
    const errorHash = this.hashError(errorMessage);
    const currentCount = this.state.errorHistory.get(errorHash) || 0;
    this.state.errorHistory.set(errorHash, currentCount + 1);

    // Check if we should trip the circuit
    if (this.shouldTrip(errorHash)) {
      this.state.isOpen = true;
      return true;
    }

    return false;
  }

  /**
   * Determine if the circuit should trip
   */
  private shouldTrip(errorHash: string): boolean {
    // Trip on consecutive failures
    if (this.state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      return true;
    }

    // Trip on same error repeated too many times
    const sameErrorCount = this.state.errorHistory.get(errorHash) || 0;
    if (sameErrorCount >= this.config.maxSameErrorCount) {
      return true;
    }

    return false;
  }

  /**
   * Check if circuit is open (tripped)
   */
  isTripped(): boolean {
    if (!this.state.isOpen) {
      return false;
    }

    // Check if cooldown has passed
    if (this.state.lastFailure) {
      const elapsed = Date.now() - this.state.lastFailure.getTime();
      if (elapsed >= this.config.cooldownMs) {
        // Allow one retry attempt
        this.state.isOpen = false;
        return false;
      }
    }

    return true;
  }

  /**
   * Get the reason why the circuit tripped
   */
  getTripReason(): string | null {
    if (!this.state.isOpen) {
      return null;
    }

    if (this.state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      return `${this.state.consecutiveFailures} consecutive failures (threshold: ${this.config.maxConsecutiveFailures})`;
    }

    // Find the most repeated error
    let maxCount = 0;
    for (const count of this.state.errorHistory.values()) {
      if (count > maxCount) {
        maxCount = count;
      }
    }

    if (maxCount >= this.config.maxSameErrorCount) {
      return `Same error repeated ${maxCount} times (threshold: ${this.config.maxSameErrorCount})`;
    }

    return 'Circuit breaker tripped';
  }

  /**
   * Reset the circuit breaker completely
   */
  reset(): void {
    this.state = {
      consecutiveFailures: 0,
      errorHistory: new Map(),
      isOpen: false,
      totalFailures: 0,
    };
  }

  /**
   * Get current state for logging/debugging
   */
  getState(): Readonly<CircuitBreakerState> {
    return { ...this.state, errorHistory: new Map(this.state.errorHistory) };
  }

  /**
   * Get statistics for display
   */
  getStats(): {
    consecutiveFailures: number;
    totalFailures: number;
    uniqueErrors: number;
    isOpen: boolean;
  } {
    return {
      consecutiveFailures: this.state.consecutiveFailures,
      totalFailures: this.state.totalFailures,
      uniqueErrors: this.state.errorHistory.size,
      isOpen: this.state.isOpen,
    };
  }
}
