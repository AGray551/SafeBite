import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { AppShell, type RouteHandle } from '@/components/layout/AppShell';
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
      { path: 'welcome', lazy: page(() => import('@/features/auth/WelcomePage'), 'WelcomePage') },
      { path: 'sign-in', lazy: page(() => import('@/features/auth/SignInPage'), 'SignInPage') },

      // Everything below requires being signed in or in guest mode.
      {
        element: <RequireEntry />,
        children: [
          {
            path: 'onboarding',
            lazy: page(() => import('@/features/onboarding/OnboardingLayout'), 'OnboardingLayout'),
            children: [
              { index: true, element: <Navigate to="allergies" replace /> },
              {
                path: 'allergies',
                lazy: page(() => import('@/features/onboarding/AllergiesStep'), 'AllergiesStep'),
              },
              {
                path: 'severity',
                lazy: page(() => import('@/features/onboarding/SeverityStep'), 'SeverityStep'),
              },
              {
                path: 'preferences',
                lazy: page(
                  () => import('@/features/onboarding/PreferencesStep'),
                  'PreferencesStep',
                ),
              },
            ],
          },
          {
            path: 'items/:itemId/report',
            lazy: page(() => import('@/features/menu/ReportPage'), 'ReportPage'),
          },
          {
            element: <AppShell />,
            children: [
              { index: true, lazy: page(() => import('@/features/home/HomePage'), 'HomePage') },
              {
                path: 'dining',
                lazy: page(() => import('@/features/dining/DiningListPage'), 'DiningListPage'),
              },
              {
                path: 'dining/map',
                lazy: page(() => import('@/features/dining/DiningMapPage'), 'DiningMapPage'),
              },
              {
                path: 'dining/:hallId',
                lazy: page(() => import('@/features/dining/HallDetailPage'), 'HallDetailPage'),
              },
              {
                path: 'items/:itemId',
                // Item detail has its own bottom action bar instead of the tabs.
                handle: { hideNav: true } satisfies RouteHandle,
                lazy: page(() => import('@/features/menu/ItemDetailPage'), 'ItemDetailPage'),
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
