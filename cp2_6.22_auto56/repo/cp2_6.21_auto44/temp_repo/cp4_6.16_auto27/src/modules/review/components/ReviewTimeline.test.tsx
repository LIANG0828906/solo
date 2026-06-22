import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { TimeBlock, ReviewData } from '@/types';

vi.mock('@/store/usePlanStore', () => {
  let blocks: TimeBlock[] = [];
  let reviews: Record<string, ReviewData> = {};
  const setReview = vi.fn((blockId: string, review: ReviewData) => {
    reviews = { ...reviews, [blockId]: review };
  });

  const state = {
    get blocks() { return blocks; },
    get reviews() { return reviews; },
    get setReview() { return setReview; },
  };

  const usePlanStore = (selector?: (state: any) => any) => {
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  };

  (usePlanStore as any).setState = (newState: any) => {
    if (newState.blocks !== undefined) blocks = newState.blocks;
    if (newState.reviews !== undefined) reviews = newState.reviews;
  };

  (usePlanStore as any).getState = () => ({
    blocks,
    reviews,
    setReview,
  });

  return { usePlanStore };
});

vi.mock('lucide-react', () => ({
  Play: ({ size, style }: any) => (
    <svg data-testid="play-icon" width={size} height={size} style={style} />
  ),
  Pause: ({ size }: any) => (
    <svg data-testid="pause-icon" width={size} height={size} />
  ),
  Star: ({ size, fill }: any) => (
    <svg data-testid="star-icon" width={size} height={size} fill={fill} />
  ),
  Check: ({ size, color }: any) => (
    <svg data-testid="check-icon" width={size} height={size} color={color} />
  ),
  X: ({ size }: any) => (
    <svg data-testid="x-icon" width={size} height={size} />
  ),
}));

import { usePlanStore } from '@/store/usePlanStore';
import ReviewTimeline from './ReviewTimeline';

const mockBlocks: TimeBlock[] = [
  {
    id: 'block-1',
    date: '2024-01-15',
    title: 'Morning Work',
    startTime: 8 * 60,
    endTime: 10 * 60,
    color: '#e94560',
    type: 'work',
    note: '',
    lane: 0,
  },
  {
    id: 'block-2',
    date: '2024-01-15',
    title: 'Study Session',
    startTime: 10 * 60 + 30,
    endTime: 12 * 60,
    color: '#3498db',
    type: 'study',
    note: '',
    lane: 1,
  },
];

const mockReviews: Record<string, ReviewData> = {
  'block-1': {
    blockId: 'block-1',
    completed: true,
    actualStart: 8 * 60,
    actualEnd: 9 * 60 + 45,
    satisfaction: 4,
  },
};

describe('ReviewTimeline', () => {
  const setReviewMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T09:00:00'));

    const store = usePlanStore as any;
    store.setState({ blocks: [...mockBlocks], reviews: { ...mockReviews } });

    const state = store.getState();
    state.setReview.mockClear();
    state.setReview.mockImplementation(setReviewMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows empty state when no blocks', () => {
    const store = usePlanStore as any;
    store.setState({ blocks: [], reviews: {} });

    render(<ReviewTimeline />);

    expect(screen.getByText('暂无计划块，请先添加计划')).toBeInTheDocument();
  });

  it('renders blocks when data exists', () => {
    render(<ReviewTimeline />);

    expect(screen.getByText('Morning Work')).toBeInTheDocument();
    expect(screen.getByText('Study Session')).toBeInTheDocument();
    expect(screen.getByText('日程回顾')).toBeInTheDocument();
  });

  it('click play button starts animation', () => {
    render(<ReviewTimeline />);

    const playBtn = document.querySelector('[class*="playBtn"]') as HTMLElement;
    expect(playBtn).not.toBeNull();

    fireEvent.click(playBtn!);

    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
  });

  it('click pause button pauses animation', () => {
    render(<ReviewTimeline />);

    const playBtn = document.querySelector('[class*="playBtn"]') as HTMLElement;
    expect(playBtn).not.toBeNull();

    fireEvent.click(playBtn!);
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();

    fireEvent.click(playBtn!);
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
  });

  it('speed buttons (1x/2x/4x) change speed', () => {
    render(<ReviewTimeline />);

    const speedBtns = document.querySelectorAll('[class*="speedBtn"]');
    expect(speedBtns.length).toBe(3);

    const btn1x = Array.from(speedBtns).find(
      (btn) => btn.textContent === '1x',
    ) as HTMLElement;
    const btn2x = Array.from(speedBtns).find(
      (btn) => btn.textContent === '2x',
    ) as HTMLElement;
    const btn4x = Array.from(speedBtns).find(
      (btn) => btn.textContent === '4x',
    ) as HTMLElement;

    expect(btn1x).toHaveClass(/speedBtnActive/);

    fireEvent.click(btn2x!);
    expect(btn2x).toHaveClass(/speedBtnActive/);
    expect(btn1x).not.toHaveClass(/speedBtnActive/);

    fireEvent.click(btn4x!);
    expect(btn4x).toHaveClass(/speedBtnActive/);
    expect(btn2x).not.toHaveClass(/speedBtnActive/);
  });

  it('clicking a block opens detail modal', () => {
    render(<ReviewTimeline />);

    const block = document.querySelector('[class*="block"]') as HTMLElement;
    expect(block).not.toBeNull();

    fireEvent.click(block!);

    expect(screen.getAllByText('Morning Work').length).toBe(2);
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('实际开始')).toBeInTheDocument();
    expect(screen.getByText('实际结束')).toBeInTheDocument();
    expect(screen.getByText('满意度')).toBeInTheDocument();
    expect(screen.getByText('保存评价')).toBeInTheDocument();
    expect(document.querySelector('[class*="overlay"]')).not.toBeNull();
  });

  it('saving review updates the store', () => {
    render(<ReviewTimeline />);

    const block = document.querySelector('[class*="block"]') as HTMLElement;
    fireEvent.click(block!);

    const saveBtn = screen.getByText('保存评价');
    fireEvent.click(saveBtn);

    expect(setReviewMock).toHaveBeenCalled();
    const [blockId, reviewData] = setReviewMock.mock.calls[0];
    expect(blockId).toBe('block-1');
    expect(reviewData).toHaveProperty('completed');
    expect(reviewData).toHaveProperty('actualStart');
    expect(reviewData).toHaveProperty('actualEnd');
    expect(reviewData).toHaveProperty('satisfaction');
  });

  it('progress bar click jumps to position', () => {
    render(<ReviewTimeline />);

    const progressTrack = document.querySelector('[class*="progressTrack"]') as HTMLElement;
    expect(progressTrack).not.toBeNull();

    Object.defineProperty(progressTrack, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 20,
        right: 1000,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
      writable: true,
      configurable: true,
    });

    fireEvent.click(progressTrack!, { clientX: 500, clientY: 10 });

    const progressFill = document.querySelector('[class*="progressFill"]') as HTMLElement;
    expect(progressFill).not.toBeNull();
  });
});
