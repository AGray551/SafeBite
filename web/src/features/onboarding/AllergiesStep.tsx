import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { MAJOR_ALLERGENS } from '@/api/schemas';
import { Button } from '@/components/ui/Button';
import { allergenLabel, toAllergenId } from '@/lib/labels';
import { useOnboarding } from './draft';
import { SelectTile, TileGrid } from './SelectTile';

/** Step 1: pick every allergen or ingredient to avoid. */
export function AllergiesStep() {
  const { draft, updateDraft, exitTo } = useOnboarding();
  const navigate = useNavigate();
  const [other, setOther] = useState('');

  const selected = new Set(draft.avoid.map((a) => a.allergen));
  const customAllergens = draft.avoid
    .map((a) => a.allergen)
    .filter((id) => !(MAJOR_ALLERGENS as readonly string[]).includes(id));

  const toggle = (allergen: string) =>
    updateDraft((d) => ({
      ...d,
      avoid: selected.has(allergen)
        ? d.avoid.filter((a) => a.allergen !== allergen)
        : // New picks default to the strictest setting; step 2 can relax it.
          [...d.avoid, { allergen, severity: 'allergy' }],
    }));

  const addOther = (event: FormEvent) => {
    event.preventDefault();
    const id = toAllergenId(other);
    if (id && !selected.has(id)) toggle(id);
    setOther('');
  };

  const next = () => {
    const query = exitTo === '/profile' ? '?from=profile' : '';
    // Nothing to rate if nothing was picked, so jump to preferences.
    navigate(`../${draft.avoid.length ? 'severity' : 'preferences'}${query}`);
  };

  const count = draft.avoid.length;

  return (
    <>
      <div>
        <h2 className="mb-1.5 text-title leading-tight">What do you need to avoid?</h2>
        <p className="m-0 text-ink-2">
          Select every allergen or ingredient that affects you. Next, you'll tell us how strict each
          one is.
        </p>
      </div>

      <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-ink-3">MAJOR ALLERGENS</span>
        <span className="text-brand" aria-live="polite">
          {count === 1 ? '1 selected' : `${count} selected`}
        </span>
      </div>

      <TileGrid label="Major allergens">
        {MAJOR_ALLERGENS.map((id) => (
          <SelectTile key={id} selected={selected.has(id)} onToggle={() => toggle(id)}>
            {allergenLabel(id)}
          </SelectTile>
        ))}
        {customAllergens.map((id) => (
          <SelectTile key={id} selected onToggle={() => toggle(id)}>
            {allergenLabel(id)}
          </SelectTile>
        ))}
      </TileGrid>

      <form onSubmit={addOther} className="flex flex-col gap-1.5">
        <label htmlFor="other-allergen" className="text-label font-bold">
          Other allergen or ingredient
        </label>
        <div className="flex gap-2">
          <input
            id="other-allergen"
            type="text"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="e.g. mustard, corn, celery"
            className="h-13 min-w-0 flex-1 rounded-[10px] border-[1.5px] border-line-input bg-surface px-3.5 text-base placeholder:text-ink-3"
          />
          <button
            type="submit"
            aria-label="Add other allergen"
            disabled={!other.trim()}
            className="flex size-13 items-center justify-center rounded-[10px] border-2 border-brand bg-surface text-brand disabled:opacity-50"
          >
            <Plus aria-hidden size={22} />
          </button>
        </div>
      </form>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button onClick={next}>Continue</Button>
        <p className="m-0 text-center text-caption text-ink-3">
          You can edit this later in Profile.
        </p>
      </div>
    </>
  );
}
