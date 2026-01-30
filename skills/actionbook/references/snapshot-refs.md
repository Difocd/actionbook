# Snapshot + Refs Workflow

The core innovation of actionbook browser: compact element references that reduce context usage dramatically for AI agents.

## How It Works

### The Problem
Traditional browser automation sends full DOM to AI agents:
```
Full DOM/HTML sent → AI parses → Generates CSS selector → Executes action
~3000-5000 tokens per interaction
```

### The Solution
actionbook browser uses compact snapshots with refs:
```
Compact snapshot → @refs assigned → Direct ref interaction
~200-400 tokens per interaction
```

## The Snapshot Command

```bash
# Basic snapshot (shows page structure)
actionbook browser snapshot

# Interactive snapshot (-i flag) - RECOMMENDED
actionbook browser snapshot -i
```

### Snapshot Output Format

```
Page: Example Site - Home
URL: https://example.com

@e1 [header]
  @e2 [nav]
    @e3 [a] "Home"
    @e4 [a] "Products"
    @e5 [a] "About"
  @e6 [button] "Sign In"

@e7 [main]
  @e8 [h1] "Welcome"
  @e9 [form]
    @e10 [input type="email"] placeholder="Email"
    @e11 [input type="password"] placeholder="Password"
    @e12 [button type="submit"] "Log In"

@e13 [footer]
  @e14 [a] "Privacy Policy"
```

## Using Refs

Once you have refs, interact directly:

```bash
# Click the "Sign In" button
actionbook browser click @e6

# Fill email input
actionbook browser fill @e10 "user@example.com"

# Fill password
actionbook browser fill @e11 "password123"

# Submit the form
actionbook browser click @e12
```

## Ref Lifecycle

**IMPORTANT**: Refs are invalidated when the page changes!

```bash
# Get initial snapshot
actionbook browser snapshot -i
# @e1 [button] "Next"

# Click triggers page change
actionbook browser click @e1

# MUST re-snapshot to get new refs!
actionbook browser snapshot -i
# @e1 [h1] "Page 2"  ← Different element now!
```

## Best Practices

### 1. Always Snapshot Before Interacting

```bash
# CORRECT
actionbook browser open https://example.com
actionbook browser snapshot -i          # Get refs first
actionbook browser click @e1            # Use ref

# WRONG
actionbook browser open https://example.com
actionbook browser click @e1            # Ref doesn't exist yet!
```

### 2. Re-Snapshot After Navigation

```bash
actionbook browser click @e5            # Navigates to new page
actionbook browser snapshot -i          # Get new refs
actionbook browser click @e1            # Use new refs
```

### 3. Re-Snapshot After Dynamic Changes

```bash
actionbook browser click @e1            # Opens dropdown
actionbook browser snapshot -i          # See dropdown items
actionbook browser click @e7            # Select item
```

### 4. Snapshot Specific Regions

For complex pages, snapshot specific areas:

```bash
# Snapshot just the form
actionbook browser snapshot @e9
```

## Ref Notation Details

```
@e1 [tag type="value"] "text content" placeholder="hint"
│    │   │             │               │
│    │   │             │               └─ Additional attributes
│    │   │             └─ Visible text
│    │   └─ Key attributes shown
│    └─ HTML tag name
└─ Unique ref ID
```

### Common Patterns

```
@e1 [button] "Submit"                    # Button with text
@e2 [input type="email"]                 # Email input
@e3 [input type="password"]              # Password input
@e4 [a href="/page"] "Link Text"         # Anchor link
@e5 [select]                             # Dropdown
@e6 [textarea] placeholder="Message"     # Text area
@e7 [div class="modal"]                  # Container (when relevant)
@e8 [img alt="Logo"]                     # Image
@e9 [checkbox] checked                   # Checked checkbox
@e10 [radio] selected                    # Selected radio
```

## Troubleshooting

### "Ref not found" Error

```bash
# Ref may have changed - re-snapshot
actionbook browser snapshot -i
```

### Element Not Visible in Snapshot

```bash
# Scroll to reveal element
actionbook browser scroll --bottom
actionbook browser snapshot -i

# Or wait for dynamic content
actionbook browser wait 1000
actionbook browser snapshot -i
```

### Too Many Elements

```bash
# Snapshot specific container
actionbook browser snapshot @e5

# Or use get text for content-only extraction
actionbook browser get text @e5
```
