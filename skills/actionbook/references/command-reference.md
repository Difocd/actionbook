# actionbook browser Command Reference

This document provides comprehensive documentation for all `actionbook browser` commands and features.

## Navigation Commands

```bash
actionbook browser open <url>      # Navigate to URL (aliases: goto, navigate)
                                   # Supports: https://, http://, file://, about:, data://
                                   # Auto-prepends https:// if no protocol given
actionbook browser back            # Go back
actionbook browser forward         # Go forward
actionbook browser reload          # Reload page
actionbook browser close           # Close browser (aliases: quit, exit)
actionbook browser connect 9222    # Connect to browser via CDP port
```

## Snapshot & Element References

```bash
actionbook browser snapshot            # Full accessibility tree
actionbook browser snapshot -i         # Interactive elements only (recommended)
actionbook browser snapshot -c         # Compact output
actionbook browser snapshot -d 3       # Limit depth to 3
actionbook browser snapshot -s "#main" # Scope to CSS selector
```

**Understanding @refs**: Snapshots assign numbered references (@e1, @e2, etc.) to interactive elements. Use these refs in subsequent commands instead of CSS selectors.

**Critical Rules**:
1. Always snapshot before interacting - refs don't exist until you capture them
2. Re-snapshot after navigation - page changes invalidate existing refs
3. Re-snapshot after dynamic changes - dropdowns, modals, or content updates require fresh refs

## Interaction Commands

```bash
actionbook browser click @e1           # Click
actionbook browser dblclick @e1        # Double-click
actionbook browser focus @e1           # Focus element
actionbook browser fill @e2 "text"     # Clear and type
actionbook browser type @e2 "text"     # Type without clearing
actionbook browser press Enter         # Press key (alias: key)
actionbook browser press Control+a     # Key combination
actionbook browser keydown Shift       # Hold key down
actionbook browser keyup Shift         # Release key
actionbook browser hover @e1           # Hover
actionbook browser check @e1           # Check checkbox
actionbook browser uncheck @e1         # Uncheck checkbox
actionbook browser select @e1 "value"  # Select dropdown option
actionbook browser select @e1 "a" "b"  # Select multiple options
actionbook browser scroll down 500     # Scroll page (default: down 300px)
actionbook browser scrollintoview @e1  # Scroll element into view
actionbook browser drag @e1 @e2        # Drag and drop
actionbook browser upload @e1 file.pdf # Upload files
```

## Information Retrieval

```bash
actionbook browser get text @e1        # Get element text
actionbook browser get html @e1        # Get innerHTML
actionbook browser get value @e1       # Get input value
actionbook browser get attr @e1 href   # Get attribute
actionbook browser get title           # Get page title
actionbook browser get url             # Get current URL
actionbook browser get count ".item"   # Count matching elements
actionbook browser get box @e1         # Get bounding box
actionbook browser get styles @e1      # Get computed styles
```

## State Verification

```bash
actionbook browser is visible @e1      # Check if visible
actionbook browser is enabled @e1      # Check if enabled
actionbook browser is checked @e1      # Check if checked
```

## Wait Conditions

```bash
actionbook browser wait @e1                     # Wait for element
actionbook browser wait 2000                    # Wait milliseconds
actionbook browser wait --text "Success"        # Wait for text (or -t)
actionbook browser wait --url "**/dashboard"    # Wait for URL pattern (or -u)
actionbook browser wait --load networkidle      # Wait for network idle (or -l)
actionbook browser wait --fn "window.ready"     # Wait for JS condition (or -f)
```

## Screenshots & Recording

```bash
actionbook browser screenshot          # Save to temporary directory
actionbook browser screenshot path.png # Save to specific path
actionbook browser screenshot --full   # Full page
actionbook browser pdf output.pdf      # Save as PDF

# Video recording
actionbook browser record start ./demo.webm    # Start recording
actionbook browser click @e1                   # Perform actions
actionbook browser record stop                 # Stop and save video
actionbook browser record restart ./take2.webm # Stop current + start new
```

Recording creates a fresh context but preserves cookies/storage from your session. For smooth demos, explore first, then start recording.

## Mouse Control

```bash
actionbook browser mouse move 100 200      # Move mouse
actionbook browser mouse down left         # Press button
actionbook browser mouse up left           # Release button
actionbook browser mouse wheel 100         # Scroll wheel
```

## Semantic Locators

Alternative to @refs - find elements by their semantic properties:

```bash
actionbook browser find role button click --name "Submit"
actionbook browser find text "Sign In" click
actionbook browser find text "Sign In" click --exact      # Exact match only
actionbook browser find label "Email" fill "user@test.com"
actionbook browser find placeholder "Search" type "query"
actionbook browser find alt "Logo" click
actionbook browser find title "Close" click
actionbook browser find testid "submit-btn" click
actionbook browser find first ".item" click
actionbook browser find last ".item" click
actionbook browser find nth 2 "a" hover
```

## Browser Settings

```bash
actionbook browser set viewport 1920 1080          # Set viewport size
actionbook browser set device "iPhone 14"          # Emulate device
actionbook browser set geo 37.7749 -122.4194       # Set geolocation
actionbook browser set offline on                  # Toggle offline mode
actionbook browser set headers '{"X-Key":"v"}'     # Extra HTTP headers
actionbook browser set credentials user pass       # HTTP basic auth
actionbook browser set media dark                  # Emulate color scheme
actionbook browser set media light reduced-motion  # Light mode + reduced motion
```

## Cookies & Storage

```bash
actionbook browser cookies                     # Get all cookies
actionbook browser cookies set name value      # Set cookie
actionbook browser cookies clear               # Clear cookies

actionbook browser storage local               # Get all localStorage
actionbook browser storage local key           # Get specific key
actionbook browser storage local set k v       # Set value
actionbook browser storage local clear         # Clear all
```

## Network Control

```bash
actionbook browser network route <url>              # Intercept requests
actionbook browser network route <url> --abort      # Block requests
actionbook browser network route <url> --body '{}'  # Mock response
actionbook browser network unroute [url]            # Remove routes
actionbook browser network requests                 # View tracked requests
actionbook browser network requests --filter api    # Filter requests
```

## Tabs & Windows

```bash
actionbook browser tab                 # List tabs
actionbook browser tab new [url]       # New tab
actionbook browser tab 2               # Switch to tab by index
actionbook browser tab close           # Close current tab
actionbook browser tab close 2         # Close tab by index
actionbook browser window new          # New window
```

## Frames & Dialogs

```bash
actionbook browser frame "#iframe"     # Switch to iframe
actionbook browser frame main          # Back to main frame

actionbook browser dialog accept [text]  # Accept dialog
actionbook browser dialog dismiss        # Dismiss dialog
```

## JavaScript Execution

```bash
actionbook browser eval "document.title"   # Run JavaScript
```

## Global Options

```bash
actionbook browser --session <name> ...    # Isolated browser session
actionbook browser --json ...              # JSON output for parsing
actionbook browser --headed ...            # Show browser window (not headless)
actionbook browser --full ...              # Full page screenshot (-f)
actionbook browser --cdp <port> ...        # Connect via Chrome DevTools Protocol
actionbook browser -p <provider> ...       # Cloud browser provider (--provider)
actionbook browser --proxy <url> ...       # Use proxy server
actionbook browser --headers <json> ...    # HTTP headers scoped to URL's origin
actionbook browser --executable-path <p>   # Custom browser executable
actionbook browser --extension <path> ...  # Load browser extension (repeatable)
actionbook browser --help                  # Show help (-h)
actionbook browser --version               # Show version (-V)
actionbook browser <command> --help        # Show detailed help for a command
```

**Proxy Support**:
```bash
actionbook browser --proxy http://proxy.com:8080 open example.com
actionbook browser --proxy http://user:pass@proxy.com:8080 open example.com
actionbook browser --proxy socks5://proxy.com:1080 open example.com
```

## Environment Variables

```bash
AGENT_BROWSER_SESSION="mysession"            # Default session name
AGENT_BROWSER_EXECUTABLE_PATH="/path/chrome" # Custom browser path
AGENT_BROWSER_EXTENSIONS="/ext1,/ext2"       # Comma-separated extension paths
AGENT_BROWSER_PROVIDER="your-cloud-browser-provider"  # Cloud browser provider
AGENT_BROWSER_STREAM_PORT="9223"             # WebSocket streaming port
AGENT_BROWSER_HOME="/path/to/agent-browser"  # Custom install location
```

## Practical Examples

### Form Submission

```bash
actionbook browser open https://example.com/form
actionbook browser snapshot -i
# Output shows: textbox "Email" [ref=@e1], textbox "Password" [ref=@e2], button "Submit" [ref=@e3]

actionbook browser fill @e1 "user@example.com"
actionbook browser fill @e2 "password123"
actionbook browser click @e3
actionbook browser wait --load networkidle
actionbook browser snapshot -i  # Check result
```

### Authentication with Saved State

```bash
# Login once
actionbook browser open https://app.example.com/login
actionbook browser snapshot -i
actionbook browser fill @e1 "username"
actionbook browser fill @e2 "password"
actionbook browser click @e3
actionbook browser wait --url "**/dashboard"
actionbook browser state save auth.json

# Later sessions: load saved state
actionbook browser state load auth.json
actionbook browser open https://app.example.com/dashboard
```

### Parallel Sessions

```bash
actionbook browser --session test1 open site-a.com
actionbook browser --session test2 open site-b.com
actionbook browser session list
```

## Debugging

```bash
actionbook browser --headed open example.com   # Show browser window
actionbook browser --cdp 9222 snapshot         # Connect via CDP port
actionbook browser connect 9222                # Alternative: connect command
actionbook browser console                     # View console messages
actionbook browser console --clear             # Clear console
actionbook browser errors                      # View page errors
actionbook browser errors --clear              # Clear errors
actionbook browser highlight @e1               # Highlight element
actionbook browser trace start                 # Start recording trace
actionbook browser trace stop trace.zip        # Stop and save trace
actionbook browser record start ./debug.webm   # Record video from current page
actionbook browser record stop                 # Save recording
```

## HTTPS Certificate Errors

For sites with self-signed or invalid certificates:
```bash
actionbook browser open https://localhost:8443 --ignore-https-errors
```

## See Also

For detailed patterns and best practices:

- [snapshot-refs.md](snapshot-refs.md) - Ref lifecycle, invalidation rules, troubleshooting
- [session-management.md](session-management.md) - Parallel sessions, state persistence, concurrent scraping
- [authentication.md](authentication.md) - Login flows, OAuth, 2FA handling, state reuse
- [video-recording.md](video-recording.md) - Recording workflows for debugging and documentation
- [proxy-support.md](proxy-support.md) - Proxy configuration, geo-testing, rotating proxies

## Ready-to-Use Templates

Executable workflow scripts for common patterns:

- [../templates/form-automation.sh](../templates/form-automation.sh) - Form filling with validation
- [../templates/authenticated-session.sh](../templates/authenticated-session.sh) - Login once, reuse state
- [../templates/capture-workflow.sh](../templates/capture-workflow.sh) - Content extraction with screenshots
