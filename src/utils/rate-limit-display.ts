/**
 * Rate Limit Display Utilities
 *
 * Formats and displays detailed rate limit information when limits are reached.
 */

import chalk from 'chalk';

/**
 * Rate limit information extracted from API responses or agent output
 */
export interface RateLimitInfo {
  /** Current usage as percentage (0-100) */
  usagePercent: number;
  /** Tokens used in current period */
  tokensUsed?: number;
  /** Maximum tokens allowed */
  tokensLimit?: number;
  /** Number of requests made this hour */
  requestsMade?: number;
  /** Timestamp when rate limit resets (Unix epoch seconds) */
  resetTimestamp?: number;
  /** Seconds until reset (from retry-after header) */
  retryAfterSeconds?: number;
}

/**
 * Session context for display when rate limited
 */
export interface SessionContext {
  /** Number of tasks completed */
  tasksCompleted: number;
  /** Total number of tasks */
  totalTasks: number;
  /** Current task being worked on */
  currentTask?: string;
  /** Current git branch */
  branch?: string;
  /** Number of loop iterations completed */
  iterations?: number;
}

/**
 * Parse rate limit headers from API response headers
 */
export function parseRateLimitHeaders(headers: Record<string, string | undefined>): RateLimitInfo {
  const info: RateLimitInfo = {
    usagePercent: 100, // Assume 100% if we're being rate limited
  };

  // Parse standard rate limit headers (x-ratelimit-* or anthropic-ratelimit-*)
  const limit =
    headers['x-ratelimit-limit'] ||
    headers['anthropic-ratelimit-limit-tokens'] ||
    headers['ratelimit-limit'];
  const remaining =
    headers['x-ratelimit-remaining'] ||
    headers['anthropic-ratelimit-remaining-tokens'] ||
    headers['ratelimit-remaining'];
  const reset =
    headers['x-ratelimit-reset'] ||
    headers['anthropic-ratelimit-reset-tokens'] ||
    headers['ratelimit-reset'];
  const retryAfter = headers['retry-after'];

  if (limit && remaining) {
    const limitNum = parseInt(limit, 10);
    const remainingNum = parseInt(remaining, 10);
    if (!isNaN(limitNum) && !isNaN(remainingNum) && limitNum > 0) {
      info.tokensLimit = limitNum;
      info.tokensUsed = limitNum - remainingNum;
      info.usagePercent = Math.round(((limitNum - remainingNum) / limitNum) * 100);
    }
  }

  if (reset) {
    const resetNum = parseInt(reset, 10);
    if (!isNaN(resetNum)) {
      // If reset is in the past, it might be seconds from now
      if (resetNum < Date.now() / 1000 - 86400) {
        info.retryAfterSeconds = resetNum;
      } else {
        info.resetTimestamp = resetNum;
      }
    }
  }

  if (retryAfter) {
    const retryNum = parseInt(retryAfter, 10);
    if (!isNaN(retryNum)) {
      info.retryAfterSeconds = retryNum;
    }
  }

  return info;
}

/**
 * Extract rate limit info from agent output text
 */
export function parseRateLimitFromOutput(output: string): RateLimitInfo {
  const info: RateLimitInfo = {
    usagePercent: 100,
  };

  // Look for percentage patterns like "100%" or "at 100%"
  const percentMatch = output.match(/(\d+)%/);
  if (percentMatch) {
    info.usagePercent = parseInt(percentMatch[1], 10);
  }

  // Look for token patterns like "50,000 / 50,000 tokens"
  const tokenMatch = output.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)\s*tokens?/i);
  if (tokenMatch) {
    info.tokensUsed = parseInt(tokenMatch[1].replace(/,/g, ''), 10);
    info.tokensLimit = parseInt(tokenMatch[2].replace(/,/g, ''), 10);
  }

  // Look for time patterns like "resets in X minutes" or "retry in X seconds"
  const timeMatch = output.match(
    /(?:reset|retry)(?:s|ing)?\s+in\s+(\d+)\s*(minute|second|hour)s?/i
  );
  if (timeMatch) {
    let seconds = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2].toLowerCase();
    if (unit === 'minute') seconds *= 60;
    else if (unit === 'hour') seconds *= 3600;
    info.retryAfterSeconds = seconds;
  }

  return info;
}

/**
 * Format time duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)} seconds`;
  }
  if (seconds < 3600) {
    const mins = Math.ceil(seconds / 60);
    return `~${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.ceil((seconds % 3600) / 60);
  if (mins === 0) {
    return `~${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `~${hours}h ${mins}m`;
}

/**
 * Format a timestamp as local and UTC time
 */
export function formatResetTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const localTime = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const utcTime = date.toUTCString().split(' ')[4].slice(0, 5);
  return `${localTime} (${utcTime} UTC)`;
}

/**
 * Format token count with K/M suffixes
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return tokens.toLocaleString();
  }
  if (tokens < 1_000_000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

/**
 * Display detailed rate limit information
 */
export function displayRateLimitStats(
  rateLimitInfo: RateLimitInfo,
  sessionContext?: SessionContext
): void {
  console.log();
  console.log(chalk.red.bold('  ⚠ Claude rate limit reached'));
  console.log();

  // Rate Limit Stats section
  console.log(chalk.yellow('  Rate Limit Stats:'));

  // Usage percentage
  if (rateLimitInfo.tokensUsed !== undefined && rateLimitInfo.tokensLimit !== undefined) {
    console.log(
      chalk.dim(
        `    • Session usage: ${rateLimitInfo.usagePercent}% (${formatTokenCount(rateLimitInfo.tokensUsed)} / ${formatTokenCount(rateLimitInfo.tokensLimit)} tokens)`
      )
    );
  } else {
    console.log(chalk.dim(`    • Session usage: ${rateLimitInfo.usagePercent}%`));
  }

  // Requests made
  if (rateLimitInfo.requestsMade !== undefined) {
    console.log(chalk.dim(`    • Requests made: ${rateLimitInfo.requestsMade} this hour`));
  }

  // Time until reset
  if (rateLimitInfo.retryAfterSeconds !== undefined) {
    const resetTimestamp = Math.floor(Date.now() / 1000) + rateLimitInfo.retryAfterSeconds;
    console.log(
      chalk.dim(
        `    • Time until reset: ${formatDuration(rateLimitInfo.retryAfterSeconds)} (resets at ${formatResetTime(resetTimestamp)})`
      )
    );
  } else if (rateLimitInfo.resetTimestamp !== undefined) {
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilReset = Math.max(0, rateLimitInfo.resetTimestamp - now);
    console.log(
      chalk.dim(
        `    • Time until reset: ${formatDuration(secondsUntilReset)} (resets at ${formatResetTime(rateLimitInfo.resetTimestamp)})`
      )
    );
  }

  // Session Progress section (if context provided)
  if (sessionContext) {
    console.log();
    console.log(chalk.yellow('  Session Progress:'));
    console.log(
      chalk.dim(
        `    • Tasks completed: ${sessionContext.tasksCompleted}/${sessionContext.totalTasks}`
      )
    );
    if (sessionContext.currentTask) {
      // Truncate long task names
      const taskDisplay =
        sessionContext.currentTask.length > 50
          ? sessionContext.currentTask.slice(0, 47) + '...'
          : sessionContext.currentTask;
      console.log(chalk.dim(`    • Current task: "${taskDisplay}"`));
    }
    if (sessionContext.branch) {
      console.log(chalk.dim(`    • Branch: ${sessionContext.branch}`));
    }
    if (sessionContext.iterations !== undefined) {
      console.log(chalk.dim(`    • Iterations completed: ${sessionContext.iterations}`));
    }
  }

  // Resume instructions
  console.log();
  console.log(chalk.yellow('  To resume when limit resets:'));
  console.log(chalk.dim('    ralph-starter run'));
  console.log();
  console.log(chalk.dim('  Tip: Check your limits at https://claude.ai/settings'));
}

/**
 * Format rate limit stats as a single-line summary
 */
export function formatRateLimitSummary(rateLimitInfo: RateLimitInfo): string {
  const parts: string[] = [];

  parts.push(`Usage: ${rateLimitInfo.usagePercent}%`);

  if (rateLimitInfo.tokensUsed !== undefined && rateLimitInfo.tokensLimit !== undefined) {
    parts.push(
      `Tokens: ${formatTokenCount(rateLimitInfo.tokensUsed)}/${formatTokenCount(rateLimitInfo.tokensLimit)}`
    );
  }

  if (rateLimitInfo.retryAfterSeconds !== undefined) {
    parts.push(`Reset in: ${formatDuration(rateLimitInfo.retryAfterSeconds)}`);
  } else if (rateLimitInfo.resetTimestamp !== undefined) {
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilReset = Math.max(0, rateLimitInfo.resetTimestamp - now);
    parts.push(`Reset in: ${formatDuration(secondsUntilReset)}`);
  }

  return parts.join(' | ');
}
