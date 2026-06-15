import { useThrottledAction } from '../shared/utils/debounce';
import { renderHook, act } from '@testing-library/react';

describe('useThrottledAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls action on first invocation', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useThrottledAction(action, 500));

    await act(async () => {
      result.current();
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('prevents rapid subsequent calls within cooldown', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useThrottledAction(action, 500));

    await act(async () => {
      result.current();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    await act(async () => {
      result.current();
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('allows call after cooldown period', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useThrottledAction(action, 500));

    await act(async () => {
      result.current();
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    await act(async () => {
      result.current();
    });

    expect(action).toHaveBeenCalledTimes(2);
  });
});
