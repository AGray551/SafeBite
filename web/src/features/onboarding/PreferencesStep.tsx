import { Check, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DIETARY_TAGS } from '@/api/schemas';
import { useSaveProfile } from '@/api/queries';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TextField } from '@/components/ui/TextField';
import { DIETARY_TAG_ICONS } from '@/features/safety/allergenIcons';
import { DIETARY_TAG_LABELS } from '@/lib/labels';
import { useOnboarding } from './draft';
import { SelectTile, TileGrid } from './SelectTile';

/** "High protein" is a filter, not a restriction, so it isn't offered here. */
const PREFERENCE_OPTIONS = DIETARY_TAGS.filter((tag) => tag !== 'high-protein');

/** Step 3: dietary preferences + the safety notice, then save. */
export function PreferencesStep() {
  const { draft, updateDraft, exitTo } = useOnboarding();
  const saveProfile = useSaveProfile();
  const navigate = useNavigate();
  const [showNoticeError, setShowNoticeError] = useState(false);

  const count = draft.preferences.length;

  const toggle = (tag: (typeof PREFERENCE_OPTIONS)[number]) =>
    updateDraft((d) => ({
      ...d,
      preferences: d.preferences.includes(tag)
        ? d.preferences.filter((p) => p !== tag)
        : [...d.preferences, tag],
    }));

  const save = async () => {
    if (!draft.acknowledgedSafetyNotice) {
      setShowNoticeError(true);
      return;
    }
    await saveProfile.mutateAsync({
      avoid: draft.avoid,
      preferences: draft.preferences,
      otherPreference: draft.otherPreference.trim() || undefined,
      acknowledgedSafetyNotice: true,
    });
    navigate(exitTo, { replace: true });
  };

  return (
    <>
      <div>
        <h2 className="mb-1.5 text-title leading-tight">Any dietary preferences?</h2>
        <p className="m-0 text-ink-2">Used to filter menus and recommendations. Optional.</p>
      </div>

      <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-ink-3">RESTRICTIONS &amp; PREFERENCES</span>
        <span className="text-brand" aria-live="polite">
          {count === 1 ? '1 selected' : `${count} selected`}
        </span>
      </div>

      <TileGrid label="Dietary preferences">
        {PREFERENCE_OPTIONS.map((tag) => (
          <SelectTile
            key={tag}
            selected={draft.preferences.includes(tag)}
            onToggle={() => toggle(tag)}
            icon={DIETARY_TAG_ICONS[tag]}
          >
            {DIETARY_TAG_LABELS[tag]}
          </SelectTile>
        ))}
      </TileGrid>

      <TextField
        label="Other preference"
        placeholder="e.g. low sodium, no pork"
        value={draft.otherPreference}
        onChange={(e) => updateDraft((d) => ({ ...d, otherPreference: e.target.value }))}
      />

      <div
        role="note"
        className="flex flex-col gap-2.5 rounded-card border-2 border-ink bg-surface p-4"
      >
        <div className="flex items-center gap-2 font-heading text-[1.0625rem] font-extrabold">
          <TriangleAlert aria-hidden size={20} />
          Important safety notice
        </div>
        <p className="m-0 text-label text-ink-2">
          SafeBite shows the ingredient and allergen information published by UC Dining. Recipes,
          ingredient substitutions and shared equipment can change, and cross-contact may occur.
        </p>
        <p className="m-0 text-label font-bold">
          If you have a severe allergy, always confirm with dining staff before eating.
        </p>
        <Checkbox
          checked={draft.acknowledgedSafetyNotice}
          onChange={(e) => {
            setShowNoticeError(false);
            updateDraft((d) => ({ ...d, acknowledgedSafetyNotice: e.target.checked }));
          }}
          aria-describedby={showNoticeError ? 'notice-error' : undefined}
        >
          I understand
        </Checkbox>
        {showNoticeError && (
          <p id="notice-error" role="alert" className="m-0 text-sm font-bold text-avoid">
            Please confirm you've read the safety notice.
          </p>
        )}
      </div>

      {saveProfile.isError && (
        <p role="alert" className="m-0 font-bold text-avoid">
          Couldn't save your profile. Please try again.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button onClick={save} disabled={saveProfile.isPending}>
          <Check aria-hidden size={20} />
          {saveProfile.isPending ? 'Saving…' : 'Save Profile'}
        </Button>
        <p className="m-0 text-center text-caption text-ink-3">
          Edit later anytime in Profile › Dietary profile.
        </p>
      </div>
    </>
  );
}
