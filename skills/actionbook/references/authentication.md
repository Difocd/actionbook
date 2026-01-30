# Authentication Patterns

Patterns for handling login flows, session persistence, and authenticated browsing.

## Basic Login Flow

```bash
# Navigate to login page
actionbook browser open https://app.example.com/login
actionbook browser wait --load networkidle

# Get form elements
actionbook browser snapshot -i
# Output: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Sign In"

# Fill credentials
actionbook browser fill @e1 "user@example.com"
actionbook browser fill @e2 "password123"

# Submit
actionbook browser click @e3
actionbook browser wait --load networkidle

# Verify login succeeded
actionbook browser get url  # Should be dashboard, not login
```

## Saving Authentication State

After logging in, save state for reuse:

```bash
# Login first (see above)
actionbook browser open https://app.example.com/login
actionbook browser snapshot -i
actionbook browser fill @e1 "user@example.com"
actionbook browser fill @e2 "password123"
actionbook browser click @e3
actionbook browser wait --url "**/dashboard"

# Save authenticated state
actionbook browser state save ./auth-state.json
```

## Restoring Authentication

Skip login by loading saved state:

```bash
# Load saved auth state
actionbook browser state load ./auth-state.json

# Navigate directly to protected page
actionbook browser open https://app.example.com/dashboard

# Verify authenticated
actionbook browser snapshot -i
```

## OAuth / SSO Flows

For OAuth redirects:

```bash
# Start OAuth flow
actionbook browser open https://app.example.com/auth/google

# Handle redirects automatically
actionbook browser wait --url "**/accounts.google.com**"
actionbook browser snapshot -i

# Fill Google credentials
actionbook browser fill @e1 "user@gmail.com"
actionbook browser click @e2  # Next button
actionbook browser wait 2000
actionbook browser snapshot -i
actionbook browser fill @e3 "password"
actionbook browser click @e4  # Sign in

# Wait for redirect back
actionbook browser wait --url "**/app.example.com**"
actionbook browser state save ./oauth-state.json
```

## Two-Factor Authentication

Handle 2FA with manual intervention:

```bash
# Login with credentials
actionbook browser open https://app.example.com/login --headed  # Show browser
actionbook browser snapshot -i
actionbook browser fill @e1 "user@example.com"
actionbook browser fill @e2 "password123"
actionbook browser click @e3

# Wait for user to complete 2FA manually
echo "Complete 2FA in the browser window..."
actionbook browser wait --url "**/dashboard" --timeout 120000

# Save state after 2FA
actionbook browser state save ./2fa-state.json
```

## HTTP Basic Auth

For sites using HTTP Basic Authentication:

```bash
# Set credentials before navigation
actionbook browser set credentials username password

# Navigate to protected resource
actionbook browser open https://protected.example.com/api
```

## Cookie-Based Auth

Manually set authentication cookies:

```bash
# Set auth cookie
actionbook browser cookies set session_token "abc123xyz"

# Navigate to protected page
actionbook browser open https://app.example.com/dashboard
```

## Token Refresh Handling

For sessions with expiring tokens:

```bash
#!/bin/bash
# Wrapper that handles token refresh

STATE_FILE="./auth-state.json"

# Try loading existing state
if [[ -f "$STATE_FILE" ]]; then
    actionbook browser state load "$STATE_FILE"
    actionbook browser open https://app.example.com/dashboard

    # Check if session is still valid
    URL=$(actionbook browser get url)
    if [[ "$URL" == *"/login"* ]]; then
        echo "Session expired, re-authenticating..."
        # Perform fresh login
        actionbook browser snapshot -i
        actionbook browser fill @e1 "$USERNAME"
        actionbook browser fill @e2 "$PASSWORD"
        actionbook browser click @e3
        actionbook browser wait --url "**/dashboard"
        actionbook browser state save "$STATE_FILE"
    fi
else
    # First-time login
    actionbook browser open https://app.example.com/login
    # ... login flow ...
fi
```

## Security Best Practices

1. **Never commit state files** - They contain session tokens
   ```bash
   echo "*.auth-state.json" >> .gitignore
   ```

2. **Use environment variables for credentials**
   ```bash
   actionbook browser fill @e1 "$APP_USERNAME"
   actionbook browser fill @e2 "$APP_PASSWORD"
   ```

3. **Clean up after automation**
   ```bash
   actionbook browser cookies clear
   rm -f ./auth-state.json
   ```

4. **Use short-lived sessions for CI/CD**
   ```bash
   # Don't persist state in CI
   actionbook browser open https://app.example.com/login
   # ... login and perform actions ...
   actionbook browser close  # Session ends, nothing persisted
   ```
