import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterGroup, FilterMenu, FilterOption } from './FilterMenu';

function renderMenu(activeCount = 0, onReset = vi.fn()) {
  const onChange = vi.fn();
  render(
    <FilterMenu activeCount={activeCount} onReset={onReset}>
      <FilterGroup legend="Show">
        <FilterOption type="checkbox" checked={false} onChange={onChange}>
          Open now
        </FilterOption>
      </FilterGroup>
    </FilterMenu>,
  );
  return { onChange, onReset };
}

describe('FilterMenu', () => {
  it('opens a labeled panel and reports how many filters are on', async () => {
    renderMenu(2);
    const button = screen.getByRole('button', { name: /Filters, 2 on/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Show' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Open now' })).toHaveFocus();
  });

  it('closes on Escape and returns focus to the button', async () => {
    renderMenu();
    const button = screen.getByRole('button', { name: 'Filters' });
    await userEvent.click(button);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('checkbox', { name: 'Open now' })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('offers Reset only when something is on', async () => {
    const { onReset } = renderMenu(1);
    await userEvent.click(screen.getByRole('button', { name: /Filters/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
