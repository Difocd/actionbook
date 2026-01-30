#!/bin/bash
# Template: Content Capture Workflow
# Extract content from web pages with optional authentication

set -euo pipefail

TARGET_URL="${1:?Usage: $0 <url> [output-dir]}"
OUTPUT_DIR="${2:-.}"

echo "Capturing content from: $TARGET_URL"
mkdir -p "$OUTPUT_DIR"

# Optional: Load authentication state if needed
# if [[ -f "./auth-state.json" ]]; then
#     actionbook browser state load "./auth-state.json"
# fi

# Navigate to target page
actionbook browser open "$TARGET_URL"
actionbook browser wait --load networkidle

# Get page metadata
echo "Page title: $(actionbook browser get title)"
echo "Page URL: $(actionbook browser get url)"

# Capture full page screenshot
actionbook browser screenshot --full "$OUTPUT_DIR/page-full.png"
echo "Screenshot saved: $OUTPUT_DIR/page-full.png"

# Get page structure
actionbook browser snapshot -i > "$OUTPUT_DIR/page-structure.txt"
echo "Structure saved: $OUTPUT_DIR/page-structure.txt"

# Extract main content
# Adjust selector based on target site structure
# actionbook browser get text @e1 > "$OUTPUT_DIR/main-content.txt"

# Extract specific elements (uncomment as needed)
# actionbook browser get text "article" > "$OUTPUT_DIR/article.txt"
# actionbook browser get text "main" > "$OUTPUT_DIR/main.txt"
# actionbook browser get text ".content" > "$OUTPUT_DIR/content.txt"

# Get full page text
actionbook browser get text body > "$OUTPUT_DIR/page-text.txt"
echo "Text content saved: $OUTPUT_DIR/page-text.txt"

# Optional: Save as PDF
actionbook browser pdf "$OUTPUT_DIR/page.pdf"
echo "PDF saved: $OUTPUT_DIR/page.pdf"

# Optional: Capture with scrolling for infinite scroll pages
# scroll_and_capture() {
#     local count=0
#     while [[ $count -lt 5 ]]; do
#         actionbook browser scroll down 1000
#         actionbook browser wait 1000
#         ((count++))
#     done
#     actionbook browser screenshot --full "$OUTPUT_DIR/page-scrolled.png"
# }
# scroll_and_capture

# Cleanup
actionbook browser close

echo ""
echo "Capture complete! Files saved to: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
