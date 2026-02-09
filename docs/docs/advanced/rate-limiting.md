---
sidebar_position: 4
title: "Rate Limiting"
description: "Control API call frequency with sliding-window rate limiting to prevent overuse and manage costs"
keywords: [rate-limit, throttle, api-calls, sliding-window, calls-per-hour, calls-per-minute]
---

# Rate Limiting

The rate limiter controls how fast ralph-starter's loop can call AI agents. It prevents you from accidentally burning through API quotas or running up costs by enforcing both per-minute and per-hour call limits using a sliding window algorithm.

## Default Limits

The rate limiter ships with these default thresholds:

| Setting | Default Value | Description |
|---|---|---|
| `maxCallsPerHour` | **100** | Maximum API calls allowed in any rolling 60-minute window |
| `maxCallsPerMinute` | **10** | Maximum API calls allowed in any rolling 60-second window |
| `warningThreshold` | **0.8** (80%) | Percentage of either limit that triggers a warning |

With defaults, the agent can make at most 10 calls in any given minute and 100 calls in any given hour. These limits apply independently -- hitting the minute limit blocks calls even if the hour limit has room, and vice versa.

## CLI Configuration

### Set a Custom Hourly Limit

Use the `--rate-limit` flag to set the maximum calls per hour:

```bash
# Allow only 30 API calls per hour
ralph-starter run "add feature" --rate-limit 30
```

This overrides the default of 100 calls per hour. The per-minute limit remains at 10 unless changed programmatically.

### Combine with Other Flags

Rate limiting works alongside all other loop options:

```bash
ralph-starter run "implement auth" \
  --preset feature \
  --rate-limit 50 \
  --max-iterations 30 \
  --validate \
  --commit
```

## Sliding Window Behavior

The rate limiter uses a **sliding window** algorithm rather than fixed time buckets. This means:

- It tracks the exact timestamp of every API call.
- At any moment, it counts how many calls occurred in the last 60 seconds (minute window) and the last 3,600 seconds (hour window).
- Old timestamps outside the 1-hour window are automatically cleaned up.

### Why Sliding Windows Matter

With fixed buckets (e.g., resetting at the top of each hour), you could make 100 calls at 12:59 and 100 more at 1:01 -- 200 calls in 2 minutes. Sliding windows prevent this by always looking backward from the current moment.

**Example timeline with 10 calls/minute limit:**

```
Time    Calls in last 60s    Allowed?
12:00   0                    Yes (call recorded)
12:05   1                    Yes (call recorded)
12:10   2                    Yes (call recorded)
...
12:50   10                   No (minute limit hit)
12:55   10                   No (still 10 in window)
13:01   9                    Yes (12:00 call expired from window)
```

## Warning vs. Blocking

The rate limiter has two escalation levels:

### Warning State

When usage reaches 80% (the `warningThreshold`) of either limit, the rate limiter enters a warning state. During the warning state:

- The loop continues to execute.
- A warning message is displayed: `Warning: Approaching rate limit`.
- The current usage percentages are shown.

For example, with default settings:
- **Minute warning**: Triggers at 8 out of 10 calls in the last minute.
- **Hour warning**: Triggers at 80 out of 100 calls in the last hour.

### Blocked State

When either limit is fully reached, the rate limiter blocks further calls:

- New calls are denied until capacity frees up.
- The display shows: `Blocked - retry in Ns` with a countdown.
- The loop waits automatically using the `waitAndAcquire` method.

The wait time is calculated precisely: it finds the oldest call in the saturated window and computes how long until that call expires from the window (plus a 100ms buffer).

## Automatic Wait and Retry

When the rate limiter blocks a call, the loop does not immediately fail. Instead, it uses `waitAndAcquire` to pause and retry:

1. The loop checks if a call is allowed (`tryAcquire`).
2. If blocked, it calculates the wait time until the next slot opens.
3. It sleeps for that duration (capped at 5-second polling intervals).
4. It retries the acquisition.
5. If still blocked after 5 minutes (default timeout), the acquisition fails and the loop exits with `rate_limit` as the exit reason.

This means the loop gracefully slows down rather than crashing when limits are hit.

## Reading Rate Limiter Stats

During execution, rate limiter statistics are displayed in a compact format:

```
Minute: 7/10 (70%) | Hour: 45/100 (45%)
```

When approaching limits:

```
Minute: 9/10 (90%) | Hour: 82/100 (82%) | Warning: Approaching rate limit
```

When blocked:

```
Minute: 10/10 (100%) | Hour: 85/100 (85%) | Blocked - retry in 12s
```

## Practical Examples

### Conservative Rate for Expensive Models

When using expensive models like GPT-4 or Claude 3 Opus, limit the rate to control costs:

```bash
# Only 20 calls per hour with an expensive model
ralph-starter run "implement feature" \
  --preset feature \
  --rate-limit 20 \
  --model claude-3-opus
```

At Claude 3 Opus pricing, 20 iterations might cost $1-5 depending on context size. See the [Cost Tracking](/docs/guides/cost-tracking) guide for details.

### High-Throughput Batch Processing

For batch processing with a cheaper model, you might want a higher limit:

```bash
ralph-starter run "process all pending issues" \
  --rate-limit 200 \
  --model claude-3-haiku
```

### Combined with Circuit Breaker

Rate limiting and circuit breaking complement each other. Rate limiting controls speed; circuit breaking controls failure tolerance.

```bash
ralph-starter run "add feature" \
  --rate-limit 50 \
  --circuit-breaker-failures 3 \
  --circuit-breaker-errors 5
```

If the agent hits errors, the circuit breaker stops the loop before the rate limiter even becomes relevant. If the agent is succeeding but making many calls, the rate limiter slows it down.

## Loop Exit Behavior

When the rate limiter blocks a call and the wait timeout (5 minutes) expires without a slot opening, the loop exits with:

```typescript
{
  success: false,
  exitReason: 'rate_limit',
  error: 'Rate limit exceeded'
}
```

This is distinct from other exit reasons like `max_iterations`, `circuit_breaker`, or `completed`. You can check the `exitReason` field to determine why the loop stopped.

## Architecture Notes

The `RateLimiter` class maintains an in-memory array of call timestamps. Key implementation details:

- **Cleanup**: Old timestamps (older than 1 hour) are pruned on every operation to prevent memory growth.
- **Thread safety**: The rate limiter is designed for single-threaded Node.js execution. It does not use locks.
- **Reset**: Calling `reset()` clears all timestamps, immediately restoring full capacity.
- **Config updates**: You can update limits mid-run with `updateConfig()`, though this is not exposed via CLI.
