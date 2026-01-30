#!/bin/bash
# Template: Form Automation Workflow
# Fills and submits web forms with validation

set -euo pipefail

FORM_URL="${1:?Usage: $0 <form-url>}"

echo "Automating form at: $FORM_URL"

# Navigate to form page
actionbook browser open "$FORM_URL"
actionbook browser wait --load networkidle

# Get interactive snapshot to identify form fields
echo "Analyzing form structure..."
actionbook browser snapshot -i

# Example: Fill common form fields
# Uncomment and modify refs based on snapshot output

# Text inputs
# actionbook browser fill @e1 "John Doe"           # Name field
# actionbook browser fill @e2 "user@example.com"   # Email field
# actionbook browser fill @e3 "+1-555-123-4567"    # Phone field

# Password fields
# actionbook browser fill @e4 "SecureP@ssw0rd!"

# Dropdowns
# actionbook browser select @e5 "Option Value"

# Checkboxes
# actionbook browser check @e6                      # Check
# actionbook browser uncheck @e7                    # Uncheck

# Radio buttons
# actionbook browser click @e8                      # Select radio option

# Text areas
# actionbook browser fill @e9 "Multi-line text content here"

# File uploads
# actionbook browser upload @e10 /path/to/file.pdf

# Submit form
# actionbook browser click @e11                     # Submit button

# Wait for response
# actionbook browser wait --load networkidle
# actionbook browser wait --url "**/success"        # Or wait for redirect

# Verify submission
echo "Form submission result:"
actionbook browser get url
actionbook browser snapshot -i

# Take screenshot of result
actionbook browser screenshot /tmp/form-result.png

# Cleanup
actionbook browser close

echo "Form automation complete"
