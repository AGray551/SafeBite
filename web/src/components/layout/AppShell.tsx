import { Link, NavLink, Outlet, ScrollRestoration, useMatches } from 'react-router';
import { LogoMark, Wordmark } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './navItems';
import { PAGE_GUTTER, PAGE_WIDTH } from './pageWidth';

/** Route `handle` options read by the shell. */
export interface RouteHandle {
  /** Hide the tab bar on mobile (detail screens with their own action bar). */
  hideNav?: boolean;
}

/**
 * Layout for the signed-in app: a bottom tab bar on phones and a top bar on
 * tablets/desktops, with the page content in a centered column.
 */
export function AppShell() {
  const matches = useMatches();
  const hideNav = matches.some((match) => (match.handle as RouteHandle | undefined)?.hideNav);

  return (
    // --app-bar-height tells sticky page headers to sit below the desktop nav.
    <div className="flex min-h-dvh flex-col md:[--app-bar-height:4rem]">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-brand px-4 py-2 text-on-brand focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <DesktopNav />

      <div className={cn('flex flex-1 flex-col', !hideNav && 'pb-[84px] md:pb-0')}>
        <Outlet />
      </div>

      {!hideNav && <MobileNav />}
      <ScrollRestoration />
    </div>
  );
}

function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid h-[84px] grid-cols-5 border-t border-line bg-surface px-1 pt-2 pb-[max(16px,env(safe-area-inset-bottom))] md:hidden"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-xs',
              isActive ? 'font-extrabold text-brand' : 'font-semibold text-ink-3',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex h-7.5 w-14 items-center justify-center rounded-full',
                  isActive && 'bg-brand-tint',
                )}
              >
                <Icon aria-hidden size={22} strokeWidth={isActive ? 2.4 : 2} />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function DesktopNav() {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-line bg-surface md:block">
      <div
        className={cn('mx-auto flex h-16 w-full items-center gap-6', PAGE_GUTTER, PAGE_WIDTH.wide)}
      >
        <Link to="/" className="flex items-center gap-2 text-ink hover:text-ink">
          <LogoMark className="size-9" />
          <Wordmark className="text-[1.375rem]" />
        </Link>
        <nav aria-label="Main" className="ml-auto flex gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-2 rounded-full px-4 text-label',
                  isActive
                    ? 'bg-brand-tint font-extrabold text-brand'
                    : 'font-semibold text-ink-2 hover:bg-canvas hover:text-ink',
                )
              }
            >
              <Icon aria-hidden size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
