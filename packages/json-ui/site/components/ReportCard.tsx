import Link from 'next/link';
import type { ReportMeta } from '@/lib/types';

function resolveI18n(value: string | { en: string; zh: string } | undefined, lang: 'en' | 'zh' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang];
}

export function ReportCard({ report }: { report: ReportMeta }) {
  return (
    <Link href={`/report/${report.slug}`} className="report-card">
      <div className="report-card-inner">
        <h3 className="report-card-title">
          <span className="i18n-en">{resolveI18n(report.title, 'en')}</span>
          <span className="i18n-zh">{resolveI18n(report.title, 'zh')}</span>
        </h3>
        {report.description && (
          <p className="report-card-desc">
            <span className="i18n-en">{resolveI18n(report.description, 'en')}</span>
            <span className="i18n-zh">{resolveI18n(report.description, 'zh')}</span>
          </p>
        )}
        <div className="report-card-meta">
          {report.date && <span>{report.date}</span>}
          {report.tags && (
            <div className="report-card-tags">
              {report.tags.map(tag => (
                <span key={tag} className="report-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
