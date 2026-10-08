import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Page } from '@/components/layout/Page';
import { ButtonLink } from '@/components/ui/Button';
import { ApiError } from '@/api';
import { NotFoundPage } from './NotFoundPage';

/** Catches errors thrown while rendering or loading a route. */
export function RouteErrorPage() {
  const error = useRouteError();

  const notFound =
    (isRouteErrorResponse(error) && error.status === 404) ||
    (error instanceof ApiError && error.status === 404);
  if (notFound) return <NotFoundPage />;

  if (import.meta.env.DEV) console.error(error);

  return (
    <Page className="items-center justify-center text-center">
      <h1 className="text-title">Something went wrong</h1>
      <p className="m-0 text-ink-2">
        Please try again. If it keeps happening, let the SafeBite team know.
      </p>
      <ButtonLink to="/" block={false} reloadDocument>
        Reload SafeBite
      </ButtonLink>
    </Page>
  );
}
