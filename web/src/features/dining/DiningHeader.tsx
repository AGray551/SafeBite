import { List, Map } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageIntro } from '@/components/layout/Page';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

type View = 'list' | 'map';

/** Title + List/Map switch shared by both dining views. */
export function DiningHeader({ view }: { view: View }) {
  const navigate = useNavigate();

  return (
    <PageIntro width="wide">
      <h1 className="text-2xl">Campus dining</h1>
      <SegmentedControl<View>
        label="View"
        className="md:max-w-sm"
        value={view}
        onChange={(next) => navigate(next === 'map' ? '/dining/map' : '/dining', { replace: true })}
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
    </PageIntro>
  );
}
