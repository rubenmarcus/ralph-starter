---
sidebar_position: 5
title: "Circuit Breaker"
description: "Automatically stop loops when the agent is stuck in repeated failures or hitting the same error"
keywords: [circuit-breaker, failures, errors, cooldown, error-hashing, deduplication, stuck-detection]
---

# Circuit Breaker

The circuit breaker monitors agent loop iterations for failure patterns and automatically stops the loop when the agent appears stuck. Without it, an agent that keeps failing on the same error would burn through all its iterations (and your budget) without making progress.

## How It Works

The circuit breaker tracks two failure signals:

1. **Consecutive failures**: How many iterations in a row have failed without a success in between.
2. **Same-error repetition**: How many times the exact same error (after normalization) has occurred across all iterations.

If either signal exceeds its threshold, the circuit "trips" (opens) and the loop stops.

```
Iteration 1: Success     -> consecutiveFailures = 0
Iteration 2: Fail (err A) -> consecutiveFailures = 1, errA count = 1
Iteration 3: Fail (err A) -> consecutiveFailures = 2, errA count = 2
Iteration 4: Fail (err A) -> consecutiveFailures = 3, errA count = 3
                           -> CIRCUIT TRIPS (3 consecutive failures)
```

## Default Thresholds

The default circuit breaker configuration:

| Setting | Default Value | Description |
|---|---|---|
| `maxConsecutiveFailures` | **3** | Trip after N failures in a row |
| `maxSameErrorCount` | **5** | Trip after the same error occurs N times total |
| `cooldownMs` | **30,000** (30 seconds) | How long the circuit stays open before allowing a retry |

With defaults: 3 failures in a row trips the breaker, or seeing the same error 5 times total (even if interspersed with different errors or successes) also trips it.

## CLI Flags

### `--circuit-breaker-failures`

Set the maximum consecutive failures before tripping:

```bash
# Trip after 5 consecutive failures instead of 3
ralph-starter run "add feature" --circuit-breaker-failures 5
```

### `--circuit-breaker-errors`

Set the maximum same-error repetitions before tripping:

```bash
# Trip after the same error occurs 3 times instead of 5
ralph-starter run "add feature" --circuit-breaker-errors 3
```

### Combining Both

```bash
ralph-starter run "add feature" \
  --circuit-breaker-failures 2 \
  --circuit-breaker-errors 3
```

This is a tight configuration: 2 consecutive failures OR 3 same-error occurrences will stop the loop.

## Error Hashing and Deduplication

Errors rarely have identical text across iterations. A stack trace might include different line numbers, timestamps, or memory addresses. The circuit breaker normalizes errors before comparing them:

### Normalization Steps

1. **Numbers replaced**: All digit sequences become `N` (e.g., `line 42` becomes `line N`).
2. **Hex values replaced**: Patterns like `0x7f3a` become `HEX`.
3. **Stack traces replaced**: Patterns like `at Function (/path:42:10)` become `STACK`.
4. **Lowercased**: The entire string is converted to lowercase.
5. **Trimmed and truncated**: Whitespace is trimmed and the string is capped at 500 characters.

### Hash Generation

After normalization, the error string is hashed with MD5 and truncated to 8 hex characters. This 8-character hash becomes the error's identity for deduplication.

**Example**:

```
Original:  "TypeError: Cannot read property 'id' of undefined at UserController (/src/controllers/user.ts:42:15)"
Normalized: "typeerror: cannot read property 'id' of undefined STACK"
Hash:       "a3f1b2c4"

Original:  "TypeError: Cannot read property 'id' of undefined at UserController (/src/controllers/user.ts:87:22)"
Normalized: "typeerror: cannot read property 'id' of undefined STACK"
Hash:       "a3f1b2c4"  <- Same hash! Counted as the same error.
```

This means the circuit breaker correctly identifies that both errors are fundamentally the same problem (accessing `id` on `undefined`), even though the stack trace line numbers differ.

## Cooldown Period

When the circuit trips, it enters a cooldown period (default: 30 seconds). During cooldown:

- `isTripped()` returns `true`.
- The loop is halted.

After the cooldown expires:

- `isTripped()` returns `false` (the circuit "half-opens").
- One retry attempt is allowed.
- If the retry succeeds, the circuit stays closed (normal operation resumes).
- If the retry fails, the circuit trips again and the cooldown restarts.

In practice, when used within ralph-starter's loop executor, a tripped circuit breaker typically causes the loop to exit immediately with `exitReason: 'circuit_breaker'` rather than waiting for the cooldown. The cooldown mechanism is more relevant for long-running or restarted loops.

## Success Resets Consecutive Failures

A successful iteration resets the consecutive failure counter to zero but does **not** clear the error history. This means:

- If the agent fails twice, succeeds once, then fails twice more, the consecutive count is 2 (not 4).
- But if those four failures all had the same error hash, the same-error count is 4 -- and one more would trip the breaker at the default threshold of 5.

This design catches both "the agent is completely stuck right now" (consecutive) and "the agent keeps circling back to the same problem" (same-error).

## Preset-Specific Circuit Breaker Configs

Several presets override the default circuit breaker thresholds to match their use case:

| Preset | Consecutive Failures | Same-Error Max | Rationale |
|---|---|---|---|
| `feature` | 3 | 5 | Standard defaults -- balanced tolerance |
| `tdd-red-green` | 5 | 3 | More consecutive tolerance (red-green cycling can look like failures), but less same-error tolerance |
| `refactor` | 2 | 3 | Tight guardrails -- refactoring should not produce repeated failures |
| `incident-response` | 2 | 2 | Very tight -- production fixes need to work fast or escalate |
| `migration-safety` | 1 | 2 | Strictest of all -- a single consecutive failure trips the breaker, because broken migrations risk data loss |

Presets that do not specify a circuit breaker (like `debug`, `review`, `docs`) use whatever default is set in the loop executor, which is the standard 3/5 configuration.

### Using Preset Configs

When you use a preset, its circuit breaker config is applied automatically:

```bash
# Uses migration-safety's 1/2 circuit breaker
ralph-starter run "add email column" --preset migration-safety

# Override the preset's circuit breaker
ralph-starter run "add email column" --preset migration-safety --circuit-breaker-failures 3
```

CLI flags always take precedence over preset values.

## Trip Reason Reporting

When the circuit trips, ralph-starter reports exactly why:

**Consecutive failures:**
```
Circuit breaker tripped: 3 consecutive failures (threshold: 3)
```

**Same error repeated:**
```
Circuit breaker tripped: Same error repeated 5 times (threshold: 5)
```

The `getTripReason()` method returns a human-readable string, and the loop exits with:

```typescript
{
  success: false,
  exitReason: 'circuit_breaker',
  stats: {
    circuitBreakerStats: {
      consecutiveFailures: 3,
      totalFailures: 5,
      uniqueErrors: 2
    }
  }
}
```

The `uniqueErrors` count tells you how many distinct error patterns were seen, which helps diagnose whether the agent hit one problem repeatedly or multiple different problems.

## Practical Examples

### Tight Breaker for Critical Code

When working on payment processing or authentication, use aggressive thresholds:

```bash
ralph-starter run "update payment webhook handler" \
  --circuit-breaker-failures 1 \
  --circuit-breaker-errors 2 \
  --validate \
  --commit
```

One failure stops the loop. You review the error manually before restarting.

### Loose Breaker for Exploratory Work

When the agent is expected to try multiple approaches, loosen the thresholds:

```bash
ralph-starter run "find the best caching strategy" \
  --preset scientific-method \
  --circuit-breaker-failures 8 \
  --circuit-breaker-errors 10
```

The agent has room to experiment and fail without tripping the breaker.

### Monitoring Circuit Breaker State

The circuit breaker's state is included in the loop result stats:

```typescript
const result = await runLoop(options);

if (result.exitReason === 'circuit_breaker') {
  console.log('Loop stopped by circuit breaker');
  console.log(`Consecutive failures: ${result.stats.circuitBreakerStats.consecutiveFailures}`);
  console.log(`Total failures: ${result.stats.circuitBreakerStats.totalFailures}`);
  console.log(`Unique errors: ${result.stats.circuitBreakerStats.uniqueErrors}`);
}
```

### Combined with Rate Limiting

Circuit breakers and rate limiters address different failure modes:

| Mechanism | Protects Against |
|---|---|
| Circuit breaker | Agent stuck on the same error, wasting iterations |
| Rate limiter | Agent running too fast, burning through API quotas |

Use both together for comprehensive protection:

```bash
ralph-starter run "implement feature" \
  --rate-limit 50 \
  --circuit-breaker-failures 3 \
  --circuit-breaker-errors 5 \
  --preset feature
```

## Architecture Notes

The `CircuitBreaker` class is stateful and tracks:

- **`consecutiveFailures`**: Counter incremented on failure, reset to 0 on success.
- **`errorHistory`**: A `Map<string, number>` mapping error hashes to occurrence counts. This map is never cleared by a success -- it accumulates across the entire loop lifetime.
- **`isOpen`**: Boolean flag indicating whether the circuit is currently tripped.
- **`lastFailure`**: Timestamp of the most recent failure, used for cooldown calculation.
- **`totalFailures`**: Running total of all failures (never reset by success).

The `reset()` method clears all state, returning the circuit breaker to its initial condition. This is called when restarting a loop from scratch.
