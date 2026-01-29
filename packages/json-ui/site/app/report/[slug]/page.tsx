import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { ReportViewer } from '@/components/ReportViewer';
import type { ReportMeta, UINode } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getReport(slug: string): Promise<UINode | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'reports', `${slug}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as UINode;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const indexPath = path.join(process.cwd(), 'public', 'reports', 'index.json');
  const raw = await fs.readFile(indexPath, 'utf-8');
  const reports = JSON.parse(raw) as ReportMeta[];
  return reports.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tree = await getReport(slug);
  if (!tree) return { title: 'Not Found' };

  const title = tree.props?.title;
  const resolvedTitle = typeof title === 'string'
    ? title
    : typeof title === 'object' && title && 'en' in title
      ? (title as { en: string }).en
      : slug;

  return { title: `${resolvedTitle} - json-ui Reports` };
}

export default async function ReportPage({ params }: PageProps) {
  const { slug } = await params;
  const tree = await getReport(slug);
  if (!tree) notFound();

  return (
    <div className="report-page">
      <ReportViewer tree={tree} />
    </div>
  );
}
