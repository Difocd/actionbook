# Video Recording

Capture browser automation sessions as video for debugging, documentation, or verification.

## Basic Recording

```bash
# Start recording
actionbook browser record start ./demo.webm

# Perform actions
actionbook browser open https://example.com
actionbook browser snapshot -i
actionbook browser click @e1
actionbook browser fill @e2 "test input"

# Stop and save
actionbook browser record stop
```

## Recording Commands

```bash
# Start recording to file
actionbook browser record start ./output.webm

# Stop current recording
actionbook browser record stop

# Restart with new file (stops current + starts new)
actionbook browser record restart ./take2.webm
```

## Use Cases

### Debugging Failed Automation

```bash
#!/bin/bash
# Record automation for debugging

actionbook browser record start ./debug-$(date +%Y%m%d-%H%M%S).webm

# Run your automation
actionbook browser open https://app.example.com
actionbook browser snapshot -i
actionbook browser click @e1 || {
    echo "Click failed - check recording"
    actionbook browser record stop
    exit 1
}

actionbook browser record stop
```

### Documentation Generation

```bash
#!/bin/bash
# Record workflow for documentation

actionbook browser record start ./docs/how-to-login.webm

actionbook browser open https://app.example.com/login
actionbook browser wait 1000  # Pause for visibility

actionbook browser snapshot -i
actionbook browser fill @e1 "demo@example.com"
actionbook browser wait 500

actionbook browser fill @e2 "password"
actionbook browser wait 500

actionbook browser click @e3
actionbook browser wait --load networkidle
actionbook browser wait 1000  # Show result

actionbook browser record stop
```

### CI/CD Test Evidence

```bash
#!/bin/bash
# Record E2E test runs for CI artifacts

TEST_NAME="${1:-e2e-test}"
RECORDING_DIR="./test-recordings"
mkdir -p "$RECORDING_DIR"

actionbook browser record start "$RECORDING_DIR/$TEST_NAME-$(date +%s).webm"

# Run test
if run_e2e_test; then
    echo "Test passed"
else
    echo "Test failed - recording saved"
fi

actionbook browser record stop
```

## Best Practices

### 1. Add Pauses for Clarity

```bash
# Slow down for human viewing
actionbook browser click @e1
actionbook browser wait 500  # Let viewer see result
```

### 2. Use Descriptive Filenames

```bash
# Include context in filename
actionbook browser record start ./recordings/login-flow-2024-01-15.webm
actionbook browser record start ./recordings/checkout-test-run-42.webm
```

### 3. Handle Recording in Error Cases

```bash
#!/bin/bash
set -e

cleanup() {
    actionbook browser record stop 2>/dev/null || true
    actionbook browser close 2>/dev/null || true
}
trap cleanup EXIT

actionbook browser record start ./automation.webm
# ... automation steps ...
```

### 4. Combine with Screenshots

```bash
# Record video AND capture key frames
actionbook browser record start ./flow.webm

actionbook browser open https://example.com
actionbook browser screenshot ./screenshots/step1-homepage.png

actionbook browser click @e1
actionbook browser screenshot ./screenshots/step2-after-click.png

actionbook browser record stop
```

## Output Format

- Default format: WebM (VP8/VP9 codec)
- Compatible with all modern browsers and video players
- Compressed but high quality

## Limitations

- Recording adds slight overhead to automation
- Large recordings can consume significant disk space
- Some headless environments may have codec limitations
