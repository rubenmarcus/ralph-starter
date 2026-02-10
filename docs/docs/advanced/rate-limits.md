---
sidebar_position: 4
title: Rate Limits
description: Understanding and handling API rate limits
keywords: [rate limits, throttling, API limits, tokens, reset time]
---

# Rate Limits

ralph-starter helps you manage API rate limits when running autonomous coding loops. This guide explains how rate limiting works and how to handle it effectively.

## Built-in Rate Limiter

Control the frequency of API calls with the `--rate-limit` flag:

```bash
# Limit to 50 API calls per hour
ralph-starter run --rate-limit 50 "build X"

# Limit to 100 calls per hour (default if set)
ralph-starter run --rate-limit 100 "implement feature"
```

The rate limiter:
- Tracks calls per minute and per hour
- Automatically waits when limits are approached
- Shows countdown timer during wait periods
- Warns at 80% capacity

## When Rate Limits Are Reached

When Claude or another AI agent hits a rate limit, ralph-starter displays detailed information:

```
⚠ Claude rate limit reached

Rate Limit Stats:
  • Session usage: 100% (50K / 50K tokens)
  • Requests made: 127 this hour
  • Time until reset: ~47 minutes (resets at 04:30 UTC)

Session Progress:
  • Tasks completed: 3/5
  • Current task: "Add swarm mode CLI flags"
  • Branch: auto/github-54
  • Iterations completed: 12

To resume when limit resets:
  ralph-starter run

Tip: Check your limits at https://claude.ai/settings
```

### What's Displayed

| Field | Description |
|-------|-------------|
| **Session usage** | Percentage of token quota used |
| **Requests made** | Number of API calls this hour |
| **Time until reset** | Estimated time when you can resume |
| **Tasks completed** | Progress through your implementation plan |
| **Current task** | What was being worked on when limited |
| **Branch** | Git branch for context |
| **Iterations** | Number of loop iterations completed |

## Handling Rate Limits

### 1. Wait and Resume

The simplest approach is to wait for the reset time shown:

```bash
# Wait for the indicated time, then run again
ralph-starter run
```

### 2. Use Lower Rate Limits

Prevent hitting limits by setting a conservative rate:

```bash
# Use a lower rate to stay under limits
ralph-starter run --rate-limit 30 "build feature"
```

### 3. Check Your Limits

Different Claude plans have different limits:
- **Free tier**: Limited requests per day
- **Pro**: Higher limits, faster resets
- **Team/Enterprise**: Custom limits

Check your current usage at [claude.ai/settings](https://claude.ai/settings).

## Rate Limit Detection

ralph-starter detects rate limits through:

1. **Output analysis**: Parsing agent output for rate limit messages
2. **API headers**: Extracting `x-ratelimit-*` headers when available
3. **Error patterns**: Recognizing common rate limit error messages

Detected patterns include:
- "rate limit" or "usage limit" messages
- "100%" usage indicators
- "exceeded" or "too many requests" errors
- HTTP 429 responses

## Best Practices

### For Long Tasks

```bash
# Use rate limiting for multi-hour tasks
ralph-starter run --rate-limit 40 --max-iterations 20 "refactor auth system"
```

### For Batch Processing

```bash
# Lower rate for batch processing multiple issues
ralph-starter auto --source github --project owner/repo --limit 5
```

### For Cost Control

Combine rate limiting with cost tracking:

```bash
ralph-starter run --rate-limit 50 --track-cost "build feature"
```

## Troubleshooting

### "Rate limit reached" immediately

- You may have hit limits in a previous session
- Wait for the displayed reset time
- Check [claude.ai/settings](https://claude.ai/settings) for current usage

### Loop stops unexpectedly

Rate limits from the AI agent (like Claude Code) are separate from ralph-starter's built-in rate limiter. Both can cause stops:

- **Built-in rate limiter**: Shows waiting countdown, then continues
- **AI agent rate limit**: Shows detailed stats and stops

### Inconsistent reset times

Reset times are estimated based on available information. If the AI agent doesn't provide exact headers, ralph-starter estimates based on typical reset windows (usually hourly).

## Related Features

- [Cost Tracking](/docs/cli/run#cost-tracking) - Monitor token usage and costs
- [Validation](/docs/advanced/validation) - Ensure quality while managing rate limits
- [Circuit Breaker](/docs/cli/run#circuit-breaker) - Stop loops that are stuck
