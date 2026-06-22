import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CareButton from '../shared/components/CareButton';

describe('CareButton', () => {
  it('renders with correct label for water type', () => {
    render(<CareButton type="water" onClick={async () => {}} />);
    expect(screen.getByTestId('care-button-water')).toHaveTextContent('浇水');
  });

  it('renders with correct label for fertilize type', () => {
    render(<CareButton type="fertilize" onClick={async () => {}} />);
    expect(screen.getByTestId('care-button-fertilize')).toHaveTextContent('施肥');
  });

  it('renders with correct label for repot type', () => {
    render(<CareButton type="repot" onClick={async () => {}} />);
    expect(screen.getByTestId('care-button-repot')).toHaveTextContent('换盆');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn().mockResolvedValue(undefined);
    render(<CareButton type="water" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('care-button-water'));
    await waitFor(() => {
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(<CareButton type="water" onClick={async () => {}} disabled />);
    expect(screen.getByTestId('care-button-water')).toBeDisabled();
  });

  it('prevents rapid double-clicks (debounce/throttle)', async () => {
    const onClick = vi.fn().mockResolvedValue(undefined);
    render(<CareButton type="water" onClick={onClick} />);
    const btn = screen.getByTestId('care-button-water');
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    await waitFor(() => {
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state after click', async () => {
    let resolveClick: () => void;
    const onClick = () => new Promise<void>((resolve) => { resolveClick = resolve; });
    render(<CareButton type="water" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('care-button-water'));
    await waitFor(() => {
      expect(screen.getByTestId('care-button-water')).toBeDisabled();
    });
    resolveClick!();
    await waitFor(() => {
      expect(screen.getByTestId('care-button-water')).not.toBeDisabled();
    });
  });
});
