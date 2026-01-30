#!/bin/bash
# Template: Authenticated Session Workflow
# Login once, save state, reuse for subsequent runs
#
# Usage:
#   ./authenticated-session.sh <login-url> [state-file]
#
# Setup:
#   1. Run once to see your form structure
#   2. Note the @refs for your fields
#   3. Uncomment LOGIN FLOW section and update refs

set -euo pipefail

LOGIN_URL="${1:?Usage: $0 <login-url> [state-file]}"
STATE_FILE="${2:-./auth-state.json}"

echo "Authentication workflow for: $LOGIN_URL"

# ══════════════════════════════════════════════════════════════
# SAVED STATE: Skip login if we have valid saved state
# ══════════════════════════════════════════════════════════════
if [[ -f "$STATE_FILE" ]]; then
    echo "Loading saved authentication state..."
    actionbook browser state load "$STATE_FILE"
    actionbook browser open "$LOGIN_URL"
    actionbook browser wait --load networkidle

    CURRENT_URL=$(actionbook browser get url)
    if [[ "$CURRENT_URL" != *"login"* ]] && [[ "$CURRENT_URL" != *"signin"* ]]; then
        echo "Session restored successfully!"
        actionbook browser snapshot -i
        exit 0
    fi
    echo "Session expired, performing fresh login..."
    rm -f "$STATE_FILE"
fi

# ══════════════════════════════════════════════════════════════
# DISCOVERY MODE: Show form structure (remove after setup)
# ══════════════════════════════════════════════════════════════
echo "Opening login page..."
actionbook browser open "$LOGIN_URL"
actionbook browser wait --load networkidle

echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ LOGIN FORM STRUCTURE                                    │"
echo "├─────────────────────────────────────────────────────────┤"
actionbook browser snapshot -i
echo "└─────────────────────────────────────────────────────────┘"
echo ""
echo "Next steps:"
echo "  1. Note refs: @e? = username, @e? = password, @e? = submit"
echo "  2. Uncomment LOGIN FLOW section below"
echo "  3. Replace @e1, @e2, @e3 with your refs"
echo "  4. Delete this DISCOVERY MODE section"
echo ""
actionbook browser close
exit 0

# ══════════════════════════════════════════════════════════════
# LOGIN FLOW: Uncomment and customize after discovery
# ══════════════════════════════════════════════════════════════
# : "${APP_USERNAME:?Set APP_USERNAME environment variable}"
# : "${APP_PASSWORD:?Set APP_PASSWORD environment variable}"
#
# actionbook browser open "$LOGIN_URL"
# actionbook browser wait --load networkidle
# actionbook browser snapshot -i
#
# # Fill credentials (update refs to match your form)
# actionbook browser fill @e1 "$APP_USERNAME"
# actionbook browser fill @e2 "$APP_PASSWORD"
# actionbook browser click @e3
# actionbook browser wait --load networkidle
#
# # Verify login succeeded
# FINAL_URL=$(actionbook browser get url)
# if [[ "$FINAL_URL" == *"login"* ]] || [[ "$FINAL_URL" == *"signin"* ]]; then
#     echo "ERROR: Login failed - still on login page"
#     actionbook browser screenshot /tmp/login-failed.png
#     actionbook browser close
#     exit 1
# fi
#
# # Save state for future runs
# echo "Saving authentication state to: $STATE_FILE"
# actionbook browser state save "$STATE_FILE"
# echo "Login successful!"
# actionbook browser snapshot -i
