/**
 * @actionbookdev/json-ui
 *
 * Universal JSON-to-UI rendering components for AI Agent reports
 */

// Catalog exports
export {
  catalog,
  type CatalogType,
  // Schema exports
  ReportSchema,
  SectionSchema,
  GridSchema,
  CardSchema,
  PaperHeaderSchema,
  AuthorListSchema,
  AbstractSchema,
  TagListSchema,
  KeyPointSchema,
  ContributionListSchema,
  MethodOverviewSchema,
  HighlightSchema,
  CodeBlockSchema,
  MetricSchema,
  MetricsGridSchema,
  TableSchema,
  LinkButtonSchema,
  LinkGroupSchema,
  BrandHeaderSchema,
  BrandFooterSchema,
  // Type exports
  type Icon,
  type Theme,
  type Variant,
  type ReportProps,
  type SectionProps,
  type PaperHeaderProps,
  type AuthorListProps,
  type AbstractProps,
  type ContributionListProps,
  type MethodOverviewProps,
  type MetricProps,
  type MetricsGridProps,
  type TableProps,
  type LinkGroupProps,
  type BrandHeaderProps,
  type BrandFooterProps,
} from './catalog';

// Component exports
export {
  Report,
  Section,
  PaperHeader,
  AuthorList,
  Abstract,
  ContributionList,
  MethodOverview,
  Highlight,
  Metric,
  MetricsGrid,
  LinkGroup,
  BrandHeader,
  BrandFooter,
} from './components';
