import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SafetyBadge } from './SafetyBadge';

describe('SafetyBadge', () => {
  it.each([
    ['safe', 'SAFE FOR YOU'],
    ['caution', 'CAUTION'],
    ['avoid', 'AVOID'],
    ['unknown', 'NOT CHECKED'],
  ] as const)('labels the %s status with text, not just color', (status, label) => {
    render(<SafetyBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('uses the short label when asked', () => {
    render(<SafetyBadge status="safe" short />);
    expect(screen.getByText('SAFE')).toBeInTheDocument();
  });
});
