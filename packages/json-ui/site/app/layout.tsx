import type { Metadata } from 'next';
import { Layout } from '@/components/Layout';
import './globals.css';

export const metadata: Metadata = {
  title: 'json-ui Reports',
  description: 'AI-generated report viewer powered by Actionbook json-ui',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
