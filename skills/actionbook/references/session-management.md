# Session Management

Run multiple isolated browser sessions concurrently with state persistence.

## Named Sessions

Use `--session` flag to isolate browser contexts:

```bash
# Session 1: Authentication flow
actionbook browser --session auth open https://app.example.com/login

# Session 2: Public browsing (separate cookies, storage)
actionbook browser --session public open https://example.com

# Commands are isolated by session
actionbook browser --session auth fill @e1 "user@example.com"
actionbook browser --session public get text body
```

## Session Isolation Properties

Each session has independent:
- Cookies
- LocalStorage / SessionStorage
- IndexedDB
- Cache
- Browsing history
- Open tabs

## Session State Persistence

### Save Session State

```bash
# Save cookies, storage, and auth state
actionbook browser state save /path/to/auth-state.json
```

### Load Session State

```bash
# Restore saved state
actionbook browser state load /path/to/auth-state.json

# Continue with authenticated session
actionbook browser open https://app.example.com/dashboard
```

### State File Contents

```json
{
  "cookies": [...],
  "localStorage": {...},
  "sessionStorage": {...},
  "origins": [...]
}
```

## Common Patterns

### Authenticated Session Reuse

```bash
#!/bin/bash
# Save login state once, reuse many times

STATE_FILE="/tmp/auth-state.json"

# Check if we have saved state
if [[ -f "$STATE_FILE" ]]; then
    actionbook browser state load "$STATE_FILE"
    actionbook browser open https://app.example.com/dashboard
else
    # Perform login
    actionbook browser open https://app.example.com/login
    actionbook browser snapshot -i
    actionbook browser fill @e1 "$USERNAME"
    actionbook browser fill @e2 "$PASSWORD"
    actionbook browser click @e3
    actionbook browser wait --load networkidle

    # Save for future use
    actionbook browser state save "$STATE_FILE"
fi
```

### Concurrent Scraping

```bash
#!/bin/bash
# Scrape multiple sites concurrently

# Start all sessions
actionbook browser --session site1 open https://site1.com &
actionbook browser --session site2 open https://site2.com &
actionbook browser --session site3 open https://site3.com &
wait

# Extract from each
actionbook browser --session site1 get text body > site1.txt
actionbook browser --session site2 get text body > site2.txt
actionbook browser --session site3 get text body > site3.txt

# Cleanup
actionbook browser --session site1 close
actionbook browser --session site2 close
actionbook browser --session site3 close
```

### A/B Testing Sessions

```bash
# Test different user experiences
actionbook browser --session variant-a open "https://app.com?variant=a"
actionbook browser --session variant-b open "https://app.com?variant=b"

# Compare
actionbook browser --session variant-a screenshot /tmp/variant-a.png
actionbook browser --session variant-b screenshot /tmp/variant-b.png
```

## Default Session

When `--session` is omitted, commands use the default session:

```bash
# These use the same default session
actionbook browser open https://example.com
actionbook browser snapshot -i
actionbook browser close  # Closes default session
```

## Session Cleanup

```bash
# Close specific session
actionbook browser --session auth close

# List active sessions
actionbook browser session list
```

## Best Practices

### 1. Name Sessions Semantically

```bash
# GOOD: Clear purpose
actionbook browser --session github-auth open https://github.com
actionbook browser --session docs-scrape open https://docs.example.com

# AVOID: Generic names
actionbook browser --session s1 open https://github.com
```

### 2. Always Clean Up

```bash
# Close sessions when done
actionbook browser --session auth close
actionbook browser --session scrape close
```

### 3. Handle State Files Securely

```bash
# Don't commit state files (contain auth tokens!)
echo "*.auth-state.json" >> .gitignore

# Delete after use
rm /tmp/auth-state.json
```

### 4. Timeout Long Sessions

```bash
# Set timeout for automated scripts
timeout 60 actionbook browser --session long-task get text body
```
