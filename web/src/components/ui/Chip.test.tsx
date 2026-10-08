import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';

describe('Chip', () => {
  it('exposes its state with aria-pressed and calls onClick', async () => {
    const onClick = vi.fn();
    render(
      <Chip active={false} onClick={onClick}>
        Vegan
      </Chip>,
    );

    const chip = screen.getByRole('button', { name: 'Vegan' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
