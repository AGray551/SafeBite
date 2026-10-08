import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { useHall, useItem, useSubmitReport } from '@/api/queries';
import { REPORT_REASONS, type ReportReason } from '@/api/schemas';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { ErrorState, LoadingState } from '@/components/ui/QueryState';
import { useAuth } from '@/features/auth/authContext';
import { cn } from '@/lib/cn';
import { REPORT_REASON_LABELS } from '@/lib/labels';

const MAX_NOTES = 1000;

/**
 * Lets a student flag wrong menu data. With no staff dashboard in v1,
 * reports go to the SafeBite team, who can fix the scraper or data.
 */
export function ReportPage() {
  const { itemId = '' } = useParams();
  const itemQuery = useItem(itemId);
  const { data: hall } = useHall(itemQuery.data?.hallId ?? '');
  const { user } = useAuth();
  const submit = useSubmitReport();

  const [reason, setReason] = useState<ReportReason>('incorrect-allergen');
  const [notes, setNotes] = useState('');
  const [allowContact, setAllowContact] = useState(false);

  const item = itemQuery.data;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit.mutate({ itemId, reason, notes: notes.trim() || undefined, allowContact });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="Report an issue"
        backIcon="close"
        fallbackTo={`/items/${itemId}`}
        className="md:top-0"
      />
      <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-5 pt-5 pb-7">
        {itemQuery.isLoading && <LoadingState />}
        {itemQuery.isError && <ErrorState onRetry={() => void itemQuery.refetch()} />}

        {item && submit.isSuccess && (
          <div
            role="status"
            className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
          >
            <CircleCheck aria-hidden size={48} className="text-safe" />
            <h2 className="text-title">Thanks for the report</h2>
            <p className="m-0 max-w-sm text-ink-2">
              The SafeBite team will review the information for <b>{item.name}</b>. Until it's
              fixed, please confirm with dining staff.
            </p>
            <ButtonLink to={`/items/${item.id}`} replace block={false} className="mt-2">
              Back to item
            </ButtonLink>
          </div>
        )}

        {item && !submit.isSuccess && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
              <ImagePlaceholder className="size-14" />
              <div>
                <div className="font-heading font-extrabold">{item.name}</div>
                <div className="text-sm text-ink-3">
                  {hall?.name ?? '…'} · {item.station}
                </div>
              </div>
            </div>

            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-2 font-heading text-lg font-extrabold">What's wrong?</legend>
              {REPORT_REASONS.map((value) => {
                const checked = value === reason;
                return (
                  <label
                    key={value}
                    className={cn(
                      'flex min-h-13 cursor-pointer items-center gap-3 rounded-control px-3.5 text-base',
                      checked
                        ? 'border-2 border-brand bg-brand-tint font-extrabold'
                        : 'border-[1.5px] border-line-strong bg-surface font-semibold',
                    )}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={checked}
                      onChange={() => setReason(value)}
                      className="m-0 size-5 accent-brand"
                    />
                    {REPORT_REASON_LABELS[value]}
                  </label>
                );
              })}
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-label font-bold">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={4}
                maxLength={MAX_NOTES}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. The sauce tasted like it had peanuts, but the label says it doesn't."
                className="rounded-[10px] border-[1.5px] border-line-input bg-surface p-3.5 text-base placeholder:text-ink-3"
              />
              <span className="self-end text-caption text-ink-3">
                {notes.length}/{MAX_NOTES}
              </span>
            </div>

            {user && (
              <Checkbox checked={allowContact} onChange={(e) => setAllowContact(e.target.checked)}>
                The SafeBite team may contact me at {user.email}
              </Checkbox>
            )}

            <div
              role="note"
              className="flex gap-2.5 rounded-control border-2 border-avoid bg-surface p-3.5 text-sm"
            >
              <TriangleAlert aria-hidden size={20} className="shrink-0 text-avoid" />
              <span>
                Reports go to the SafeBite team, not dining staff.{' '}
                <b>Having an allergic reaction? Get help now: call 911.</b>
              </span>
            </div>

            {submit.isError && (
              <p role="alert" className="m-0 font-bold text-avoid">
                Couldn't send your report. Please try again.
              </p>
            )}

            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? 'Sending…' : 'Submit report'}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
