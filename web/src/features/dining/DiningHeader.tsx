import { List, Map } from 'lucide-react';
import { useNavigate } from 'react-router';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

type View = 'list' | 'map';

/** Title + List/Map switch shared by both dining views. */
export function DiningHeader({ view }: { view: View }) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-5 pb-4 md:px-6">
        <h1 className="text-2xl">Campus dining</h1>
        <SegmentedControl<View>
          label="View"
          value={view}
          onChange={(next) =>
            navigate(next === 'map' ? '/dining/map' : '/dining', { replace: true })
          }
          segments={[
            {
              value: 'list',
              label: (
                <>
                  <List aria-hidden size={18} /> List
                </>
              ),
            },
            {
              value: 'map',
              label: (
                <>
                  <Map aria-hidden size={18} /> Map
                </>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
