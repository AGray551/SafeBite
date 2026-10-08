import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { RequireEntry } from '@/features/auth/RequireEntry';
import { NotFoundPage } from '@/features/errors/NotFoundPage';
import { RouteErrorPage } from '@/features/errors/RouteErrorPage';

/**
 * Lazy-loads a page so each screen ships in its own chunk.
 * Usage: page(() => import('./HomePage'), 'HomePage')
 */
function page<M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M) {
  return async () => {
    const module = await load();
    return { Component: module[name] as ComponentType };
  };
}

const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      // Everything below requires being signed in or in guest mode.
      {
        element: <RequireEntry />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, lazy: page(() => import('@/features/home/HomePage'), 'HomePage') },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
