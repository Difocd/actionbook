# @actionbookdev/json-ui

Universal JSON-to-UI rendering components for AI Agent reports, based on [json-render](https://github.com/vercel-labs/json-render).

AI Agents output structured JSON, json-ui renders it into beautiful HTML reports.

## Installation

```bash
pnpm add @actionbookdev/json-ui
```

## CLI Usage

```bash
# Render JSON and open in browser
json-ui render report.json

# Render to file
json-ui render report.json -o out.html

# Read from stdin (pipe from AI Agent)
cat report.json | json-ui render -
```

## Quick Start

```tsx
import {
  Report,
  BrandHeader,
  Section,
  MetricsGrid,
  Table,
  Callout,
  BrandFooter,
} from '@actionbookdev/json-ui';

function DashboardReport() {
  return (
    <Report>
      <BrandHeader badge="📊 Weekly Report" />
      <Section title="Overview" icon="chart">
        <MetricsGrid
          metrics={[
            { label: 'Users', value: '12.5K', trend: 'up' },
            { label: 'Revenue', value: '$48K', trend: 'up' },
          ]}
          cols={2}
        />
      </Section>
      <Section title="Alerts" icon="warning">
        <Callout type="tip" title="Performance" content="API latency reduced by 60%" />
      </Section>
      <BrandFooter
        timestamp={new Date().toISOString()}
        attribution="Powered by ActionBook"
      />
    </Report>
  );
}
```

## Components

### Layout

| Component | Description |
|-----------|-------------|
| `Report` | Top-level container with theme support (light/dark/auto) |
| `Section` | Collapsible section with title and icon |
| `Grid` | Grid layout container |
| `Card` | Card container with padding and shadow |

### Text Content

| Component | Description |
|-----------|-------------|
| `Prose` | Markdown-like text (bold, italic, code, lists) |
| `Abstract` | Abstract text with keyword highlighting |
| `Highlight` | Blockquote with type styling (quote/important/warning) |
| `Callout` | Colored callout boxes (info/tip/warning/important/note) |
| `KeyPoint` | Key finding card with icon |

### Academic / Technical

| Component | Description |
|-----------|-------------|
| `Formula` | LaTeX formula rendering |
| `Theorem` | Theorem/lemma/proposition/corollary blocks |
| `Algorithm` | Pseudocode with line numbers and indentation |
| `CodeBlock` | Code block with syntax and line numbers |
| `DefinitionList` | Term/definition pairs |

### Data Display

| Component | Description |
|-----------|-------------|
| `MetricsGrid` | Metric cards with trend indicators |
| `Table` | Generic table with striped/compact options |
| `ResultsTable` | Results table with cell highlighting |
| `ContributionList` | Numbered items with badges |
| `MethodOverview` | Step-by-step flow visualization |
| `TagList` | Grouped tags |

### Media

| Component | Description |
|-----------|-------------|
| `Image` | Image with caption |
| `Figure` | Multi-image figure with label and caption |

### Interactive

| Component | Description |
|-----------|-------------|
| `LinkButton` | Link button with icon |
| `LinkGroup` | Group of link buttons |

### Info Headers

| Component | Description |
|-----------|-------------|
| `PaperHeader` | Title, ID, date, categories |
| `AuthorList` | People with affiliations |
| `BrandHeader` | Top badge and branding |
| `BrandFooter` | Timestamp and attribution |

## Catalog (for json-render)

```ts
import { catalog } from '@actionbookdev/json-ui/catalog';

// Use with json-render
const ui = createUI(catalog);
```

## Features

- Light/dark theme auto-detection
- Responsive layout
- Print-optimized styles
- LaTeX basic rendering (Greek letters, superscripts, common symbols)
- All components validated with Zod schemas

## License

MIT
