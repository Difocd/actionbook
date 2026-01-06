#!/usr/bin/env npx tsx
/**
 * Playbook Mode Record Script
 *
 * Single-page element recording with module classification.
 * Supports:
 * - Target URL pattern filtering
 * - Auto-scroll for lazy-loaded content
 * - Page module classification (header, footer, main, etc.)
 * - go_back for navigation control
 *
 * Usage:
 *   npx tsx scripts/playbook-record.ts <url> [options]
 *
 * Options:
 *   --scenario <text>     Page description/scenario (required)
 *   --pattern <regex>     Target URL pattern (optional, e.g., "^/search")
 *   --no-scroll           Disable auto-scroll to bottom
 *   --headless            Run in headless mode
 *   --output <dir>        Output directory (default: ./output)
 *
 * Examples:
 *   npx tsx scripts/playbook-record.ts "https://www.airbnb.com/" --scenario "Airbnb homepage with search form"
 *   npx tsx scripts/playbook-record.ts "https://example.com/search" --scenario "Search results page" --pattern "^/search"
 */

import { ActionBuilder } from "../src/ActionBuilder.js";
import type { StepEvent } from "../src/types/index.js";

// Simple argument parsing
function parseArgs(): {
  url: string;
  scenario: string;
  pattern?: string;
  autoScroll: boolean;
  headless: boolean;
  outputDir: string;
} {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Playbook Mode Record Script

Usage:
  npx tsx scripts/playbook-record.ts <url> [options]

Options:
  --scenario <text>     Page description/scenario (required)
  --pattern <regex>     Target URL pattern (optional)
  --no-scroll           Disable auto-scroll to bottom
  --headless            Run in headless mode
  --output <dir>        Output directory (default: ./output)

Examples:
  npx tsx scripts/playbook-record.ts "https://www.airbnb.com/" --scenario "Airbnb homepage"
  npx tsx scripts/playbook-record.ts "https://example.com/search" --scenario "Search page" --pattern "^/search"
`);
    process.exit(0);
  }

  const url = args[0];
  let scenario = "";
  let pattern: string | undefined;
  let autoScroll = true;
  let headless = false;
  let outputDir = "./output";

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "--scenario":
        scenario = args[++i] || "";
        break;
      case "--pattern":
        pattern = args[++i];
        break;
      case "--no-scroll":
        autoScroll = false;
        break;
      case "--headless":
        headless = true;
        break;
      case "--output":
        outputDir = args[++i] || "./output";
        break;
    }
  }

  if (!scenario) {
    console.error("Error: --scenario is required");
    process.exit(1);
  }

  return { url, scenario, pattern, autoScroll, headless, outputDir };
}

// Playbook mode system prompt
const PLAYBOOK_SYSTEM_PROMPT = `You are a web automation capability recorder in PLAYBOOK MODE.

## Your Goal
Discover and record ALL interactive UI elements on a SINGLE PAGE, organized by page modules.

## Available Tools

- **navigate**: Go to a URL
- **scroll_to_bottom**: Scroll to page bottom to load lazy-loaded content (CALL THIS FIRST on pages with lazy loading)
- **observe_page**: Scan the page to discover elements
  - Use \`module\` parameter: header, footer, sidebar, navibar, main, modal, breadcrumb, tab, or "all"
- **register_element**: Register an element's capability
  - ALWAYS include \`module\` field to classify element location
- **set_page_context**: Set the current page type
- **go_back**: Return to previous page if you navigated away accidentally
- **wait**: Wait for content
- **scroll**: Scroll incrementally

## Recording Strategy (IMPORTANT)

1. **Navigate** to the target URL
2. **Set page context** with page_type and description
3. **scroll_to_bottom** to load lazy content (if page has lazy loading)
4. **Observe by module** - call observe_page multiple times with different modules:
   - observe_page(focus: "header elements", module: "header")
   - observe_page(focus: "main content elements", module: "main")
   - observe_page(focus: "footer links", module: "footer")
   - etc.
5. **Register elements** with module classification - batch multiple register_element calls

## Module Classification Guide

- **header**: Logo, top nav, user menu, search in header area
- **navibar**: Primary navigation menu, main nav links
- **sidebar**: Side filters, category lists, secondary nav
- **main**: Primary content - articles, product lists, search results, forms
- **footer**: Footer links, copyright, social icons
- **modal**: Popups, dialogs, overlays (if any appear)
- **breadcrumb**: Breadcrumb navigation path
- **tab**: Tab panels, tabbed content
- **unknown**: Elements that don't fit other categories

## Key Rules

1. **Focus on ONE page** - don't navigate to other pages unless needed
2. **Use go_back** if you accidentally navigate away
3. **Classify EVERY element** with the correct module
4. **Batch register_element calls** - register multiple elements in one response
5. **Be thorough** - capture ALL visible interactive elements

## Element ID Naming Convention

Use snake_case with module prefix when helpful:
- header_logo
- header_search_input
- nav_home_link
- main_search_button
- footer_contact_link
`;

async function runPlaybookRecord(): Promise<void> {
  const config = parseArgs();

  console.log("=".repeat(60));
  console.log("Playbook Mode Recording");
  console.log("=".repeat(60));
  console.log(`URL: ${config.url}`);
  console.log(`Scenario: ${config.scenario}`);
  if (config.pattern) {
    console.log(`Target Pattern: ${config.pattern}`);
  }
  console.log(`Auto Scroll: ${config.autoScroll}`);
  console.log(`Headless: ${config.headless}`);
  console.log(`Output: ${config.outputDir}`);
  console.log("=".repeat(60));

  // Track progress
  let stepCount = 0;
  const moduleStats: Record<string, number> = {};

  const builder = new ActionBuilder({
    outputDir: config.outputDir,
    headless: config.headless,
    maxTurns: 25,
    databaseUrl: process.env.DATABASE_URL,
    onStepFinish: (event: StepEvent) => {
      stepCount++;
      const status = event.success ? "\u2705" : "\u274c";
      console.log(`\n${status} Step ${stepCount}: ${event.toolName} (${event.durationMs}ms)`);

      // Track module stats from register_element calls
      if (event.toolName === "register_element" && event.success) {
        const args = event.toolArgs as { module?: string; element_id?: string };
        const module = args.module || "unknown";
        moduleStats[module] = (moduleStats[module] || 0) + 1;
        console.log(`   Element: ${args.element_id} [${module}]`);
      } else if (event.toolName === "scroll_to_bottom") {
        console.log(`   Scrolled to bottom for lazy loading`);
      } else if (event.toolName === "go_back") {
        console.log(`   Navigated back`);
      } else if (event.toolName === "observe_page") {
        const args = event.toolArgs as { focus?: string; module?: string };
        console.log(`   Focus: ${args.focus || "all"}`);
        if (args.module) {
          console.log(`   Module: ${args.module}`);
        }
      }

      if (event.error) {
        console.log(`   Error: ${event.error}`);
      }
    },
  });

  // Generate domain name from URL
  const urlObj = new URL(config.url);
  const domainName = urlObj.hostname.replace(/^www\./, "").replace(/\./g, "_");
  const scenarioId = `${domainName}_playbook_${Date.now()}`;

  // User prompt for playbook mode
  const userPrompt = `## Playbook Mode: Record all UI elements on this page

**Target Page:** ${config.url}

**Page Description:** ${config.scenario}

**Instructions:**

1. Navigate to ${config.url}
2. Set page context with page_type: "${domainName}_main"
3. ${config.autoScroll ? "Call scroll_to_bottom to load any lazy content" : "Skip scrolling (disabled)"}
4. Systematically observe and register elements by module:
   - First observe header elements (module: header)
   - Then observe navigation (module: navibar)
   - Then observe main content (module: main)
   - Then observe sidebar if present (module: sidebar)
   - Finally observe footer (module: footer)
5. For each discovered element, register it with:
   - Descriptive element_id
   - Clear description
   - Correct element_type
   - Appropriate allow_methods
   - The correct module classification

**Remember:** Batch your register_element calls - register multiple elements per response for efficiency.

Today's date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  try {
    await builder.initialize();

    const result = await builder.build(config.url, scenarioId, {
      siteName: urlObj.hostname,
      siteDescription: config.scenario,
      customSystemPrompt: PLAYBOOK_SYSTEM_PROMPT,
      customUserPrompt: userPrompt,
      // Playbook mode options
      targetUrlPattern: config.pattern,
      autoScrollToBottom: config.autoScroll,
    });

    console.log("\n" + "=".repeat(60));
    console.log("Recording Results");
    console.log("=".repeat(60));

    if (result.success) {
      console.log("\u2705 Playbook recording completed!");
    } else {
      console.log("\u26a0\ufe0f Recording finished with issues");
    }

    console.log(`\ud83d\udcc1 Saved to: ${result.savedPath}`);
    console.log(`\ud83d\udd04 Turns used: ${result.turns}`);
    console.log(`\ud83d\udcb0 Tokens: input=${result.tokens.input}, output=${result.tokens.output}, total=${result.tokens.total}`);
    console.log(`\u23f1\ufe0f Duration: ${result.totalDuration}ms`);
    console.log(`\ud83d\udcca Steps: ${stepCount}`);

    // Module statistics
    if (Object.keys(moduleStats).length > 0) {
      console.log(`\n\ud83c\udfe0 Elements by Module:`);
      for (const [module, count] of Object.entries(moduleStats).sort((a, b) => b[1] - a[1])) {
        console.log(`   ${module}: ${count}`);
      }
    }

    // Capability summary
    if (result.siteCapability) {
      const cap = result.siteCapability;
      console.log(`\n\ud83d\udcca Capability Summary:`);
      console.log(`   Domain: ${cap.domain}`);
      console.log(`   Pages: ${Object.keys(cap.pages).length}`);

      let totalElements = Object.keys(cap.global_elements).length;
      for (const page of Object.values(cap.pages)) {
        totalElements += Object.keys(page.elements).length;
      }
      console.log(`   Total Elements: ${totalElements}`);

      // Show elements with module info
      for (const [pageType, page] of Object.entries(cap.pages)) {
        console.log(`\n   \ud83d\udcc4 Page: ${pageType}`);
        for (const [elementId, element] of Object.entries(page.elements)) {
          const module = element.module || "unknown";
          console.log(`      [${module}] ${elementId}: ${element.element_type}`);
        }
      }
    }

    await builder.close();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("Fatal error:", error);
    await builder.close();
    process.exit(1);
  }
}

// Run
runPlaybookRecord().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
