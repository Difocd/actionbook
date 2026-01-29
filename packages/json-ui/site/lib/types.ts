/** JSON tree node — matches json-ui report format */
export interface UINode {
  type: string;
  props?: Record<string, unknown>;
  children?: UINode[];
}

/** Report index entry */
export interface ReportMeta {
  slug: string;
  title: { en: string; zh: string } | string;
  description?: { en: string; zh: string } | string;
  date?: string;
  tags?: string[];
  category?: 'ai' | 'paper' | 'rust';
}
