/**
 * Represents a single Rust feature/change
 */
export interface RustFeature {
  /** Feature title/description */
  title: string
  /** Link to PR/issue/docs */
  url?: string
  /** Time since merged (only for nightly) */
  mergedAgo?: string
}

/**
 * Represents a category of changes (e.g., Language, Compiler, Libraries)
 */
export interface RustCategory {
  /** Category name */
  name: string
  /** List of features in this category */
  features: RustFeature[]
}

/**
 * Represents a Rust release version
 */
export interface RustRelease {
  /** Version number (e.g., "1.83.0") */
  version: string
  /** Whether this is a stable release */
  isStable: boolean
  /** Release date (stable only) */
  releaseDate?: string
  /** Branch date from master (stable only) */
  branchedDate?: string
  /** Expected stable release date (nightly/beta only) */
  expectedStableDate?: string
  /** Categorized features */
  categories: RustCategory[]
}

/**
 * Learning report output
 */
export interface LearningReport {
  /** When the report was generated */
  fetchedAt: string
  /** The release being studied */
  release: RustRelease
  /** AI-generated summary */
  summary: string
  /** Markdown formatted report */
  markdown: string
}
