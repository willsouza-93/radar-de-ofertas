import Link from 'next/link';

import { signOutAction } from '@/server/ui/actions';
import type { AuthenticatedBackofficeSession } from '@/server/ui/session';
import { Button } from '@/components/ui/button';

export function AppShell({
  session,
  currentPath,
  pendingCount,
  children
}: {
  session: AuthenticatedBackofficeSession;
  currentPath: string;
  pendingCount?: number;
  children: React.ReactNode;
}) {
  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Ofertas', href: '/offers' },
    { label: 'Curadoria', href: '/curation', count: pendingCount }
  ];

  return (
    <>
      <a href="#conteudo" className="skip-link">Pular para o conteudo</a>
      <div className="app-shell">
        <aside className="sidebar">
          <Link href="/dashboard" className="brand" aria-label="Radar de Ofertas">
            <span className="brand-mark">R</span>
            <span>Radar de Ofertas</span>
          </Link>
          <nav aria-label="Navegacao principal">
            <ul className="nav-list">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    className="nav-link"
                    href={item.href}
                    aria-current={isActive(currentPath, item.href) ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    {item.count ? <span className="badge badge-warning">{item.count}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="shell-main">
          <header className="topbar">
            <div>
              <strong>{session.workspace.name}</strong>
              <p className="helper" style={{ margin: 0 }}>Preview/Staging</p>
            </div>
            <div className="action-bar" style={{ alignItems: 'center' }}>
              <span className="badge badge-neutral">{session.user.role === 'admin' ? 'Admin' : 'Editor'}</span>
              <span className="muted">{session.user.displayName}</span>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost">Sair</Button>
              </form>
            </div>
          </header>
          <main id="conteudo" className="content">
            {children}
          </main>
        </div>
      </div>
      <nav className="bottom-nav" aria-label="Navegacao principal mobile">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isActive(currentPath, item.href) ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {action ? <div className="action-bar">{action}</div> : null}
    </header>
  );
}

function isActive(currentPath: string, href: string): boolean {
  return currentPath === href || (href !== '/dashboard' && currentPath.startsWith(`${href}/`));
}
