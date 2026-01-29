import Link from 'next/link';
import { LangSwitcher } from './LangSwitcher';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="site-nav">
        <Link href="/" className="nav-logo">
          <strong>json-ui</strong>
          <span className="nav-subtitle">Report Viewer</span>
        </Link>
        <LangSwitcher />
      </nav>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <p>
          Built with <a href="https://github.com/actionbook/actionbook" target="_blank" rel="noopener noreferrer">Actionbook json-ui</a>
        </p>
      </footer>
    </>
  );
}
