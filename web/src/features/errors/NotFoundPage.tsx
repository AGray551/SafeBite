import { SearchX } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <Page className="items-center justify-center text-center">
      <SearchX aria-hidden size={40} className="text-ink-3" />
      <h1 className="text-title">Page not found</h1>
      <p className="m-0 text-ink-2">That page doesn't exist or may have moved.</p>
      <ButtonLink to="/" block={false}>
        Go home
      </ButtonLink>
    </Page>
  );
}
