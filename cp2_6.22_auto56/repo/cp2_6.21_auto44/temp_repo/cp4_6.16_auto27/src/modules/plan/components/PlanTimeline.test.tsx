import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { TimeBlock } from '@/types';
import { SLOT_WIDTH, MINUTE_PER_SLOT, MAX_LANES } from '@/lib/constants';

vi.mock('@/store/usePlanStore', () => {
  let blocks: TimeBlock[] = [];
  const moveBlock = vi.fn((id: string, startTime: number, endTime: number) => {
    blocks = blocks.map((b) =>
      b.id === id ? { ...b, startTime, endTime } : b,
    );
  });

  const state = {
    get blocks() { return blocks; },
    get moveBlock() { return moveBlock; },
  };

  const usePlanStore = (selector?: (state: any) => any) => {
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  };

  (usePlanStore as any).setState = (newState: any) => {
    if (newState.blocks !== undefined) blocks = newState.blocks;
  };

  (usePlanStore as any).getState = () => ({
    blocks,
    moveBlock,
  });

  return { usePlanStore };
});

import { usePlanStore } from '@/store/usePlanStore';
import PlanTimeline from './PlanTimeline';

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

function setupTimelineRect(container: HTMLElement) {
  Object.defineProperty(container, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 400,
      right: 1000,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    }),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(container, 'scrollLeft', {
    value: 0,
    writable: true,
    configurable: true,
  });
}

function flushRaf() {
  let rafId = 0;
  const callbacks: FrameRequestCallback[] = [];
  
  const mockRaf = (cb: FrameRequestCallback) => {
    callbacks.push(cb);
    return ++rafId;
  };
  
  const mockCancelRaf = () => {};
  
  const originalRaf = window.requestAnimationFrame;
  const originalCancelRaf = window.cancelAnimationFrame;
  
  window.requestAnimationFrame = mockRaf as any;
  window.cancelAnimationFrame = mockCancelRaf as any;
  
  return {
    flush: () => {
      while (callbacks.length > 0) {
        const cb = callbacks.shift()!;
        cb(performance.now());
      }
    },
    restore: () => {
      window.requestAnimationFrame = originalRaf;
      window.cancelAnimationFrame = originalCancelRaf;
    },
  };
}

describe('PlanTimeline', () => {
  const moveBlockMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T09:00:00'));

    const store = usePlanStore as any;
    store.setState({ blocks: [...mockBlocks] });

    const state = store.getState();
    state.moveBlock.mockClear();
    state.moveBlock.mockImplementation(moveBlockMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders timeline with tick marks (hour labels visible)', () => {
    const onCreateBlock = vi.fn();
    render(<PlanTimeline onCreateBlock={onCreateBlock} />);

    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });

  it('renders time blocks from the store', () => {
    const onCreateBlock = vi.fn();
    render(<PlanTimeline onCreateBlock={onCreateBlock} />);

    expect(screen.getByText('Morning Work')).toBeInTheDocument();
    expect(screen.getByText('Study Session')).toBeInTheDocument();
  });

  it('click empty area and drag creates a new block', () => {
    const raf = flushRaf();
    const onCreateBlock = vi.fn();

    render(<PlanTimeline onCreateBlock={onCreateBlock} />);

    const container = document.querySelector('[class*="timelineContainer"]') as HTMLElement;
    expect(container).not.toBeNull();
    setupTimelineRect(container!);

    const startSlot = 32;
    const endSlot = 40;
    const startX = startSlot * SLOT_WIDTH + SLOT_WIDTH / 2;
    const endX = endSlot * SLOT_WIDTH + SLOT_WIDTH / 2;

    fireEvent.mouseDown(container!, { clientX: startX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseMove(document, { clientX: endX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseUp(document, { clientX: endX, clientY: 50, bubbles: true });
    raf.flush();

    expect(onCreateBlock).toHaveBeenCalled();
    const [startTime, endTime] = onCreateBlock.mock.calls[0];
    expect(startTime).toBeLessThan(endTime);
    expect(startTime % MINUTE_PER_SLOT).toBe(0);
    expect(endTime % MINUTE_PER_SLOT).toBe(0);

    raf.restore();
  });

  it('drag existing block moves it', () => {
    const raf = flushRaf();
    const onCreateBlock = vi.fn();
    render(<PlanTimeline onCreateBlock={onCreateBlock} />);

    const container = document.querySelector('[class*="timelineContainer"]') as HTMLElement;
    setupTimelineRect(container!);

    const block = document.querySelector('[data-block-id="block-1"]') as HTMLElement;
    expect(block).not.toBeNull();

    const startSlot = 32;
    const deltaSlots = 4;
    const startX = startSlot * SLOT_WIDTH + SLOT_WIDTH / 2;
    const endX = startX + deltaSlots * SLOT_WIDTH;

    fireEvent.mouseDown(block, { clientX: startX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseMove(document, { clientX: endX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseUp(document, { clientX: endX, clientY: 50, bubbles: true });
    raf.flush();

    expect(moveBlockMock).toHaveBeenCalled();
    const [id, newStart, newEnd] = moveBlockMock.mock.calls[0];
    expect(id).toBe('block-1');
    expect(newEnd - newStart).toBe(mockBlocks[0].endTime - mockBlocks[0].startTime);

    raf.restore();
  });

  it('drag left edge of block resizes start time', () => {
    const raf = flushRaf();
    const onCreateBlock = vi.fn();
    render(<PlanTimeline onCreateBlock={onCreateBlock} />);

    const container = document.querySelector('[class*="timelineContainer"]') as HTMLElement;
    setupTimelineRect(container!);

    const block = document.querySelector('[data-block-id="block-1"]') as HTMLElement;
    expect(block).not.toBeNull();

    const leftEdge = block.querySelector('[data-edge="left"]') as HTMLElement;
    expect(leftEdge).not.toBeNull();

    const startSlot = 32;
    const deltaSlots = -4;
    const startX = startSlot * SLOT_WIDTH;
    const endX = startX + deltaSlots * SLOT_WIDTH;

    fireEvent.mouseDown(leftEdge, { clientX: startX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseMove(document, { clientX: endX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseUp(document, { clientX: endX, clientY: 50, bubbles: true });
    raf.flush();

    expect(moveBlockMock).toHaveBeenCalled();
    const [id, newStart, newEnd] = moveBlockMock.mock.calls[0];
    expect(id).toBe('block-1');
    expect(newEnd).toBe(mockBlocks[0].endTime);
    expect(newStart).not.toBe(mockBlocks[0].startTime);

    raf.restore();
  });

  it('drag right edge of block resizes end time', () => {
    const raf = flushRaf();
    const onCreateBlock = vi.fn();
    render(<PlanTimeline onCreateBlock={onCreateBlock} />);

    const container = document.querySelector('[class*="timelineContainer"]') as HTMLElement;
    setupTimelineRect(container!);

    const block = document.querySelector('[data-block-id="block-2"]') as HTMLElement;
    expect(block).not.toBeNull();

    const rightEdge = block.querySelector('[data-edge="right"]') as HTMLElement;
    expect(rightEdge).not.toBeNull();

    const blockEndSlot = mockBlocks[1].endTime / MINUTE_PER_SLOT;
    const startX = blockEndSlot * SLOT_WIDTH;
    const deltaSlots = 4;
    const endX = startX + deltaSlots * SLOT_WIDTH;

    fireEvent.mouseDown(rightEdge, { clientX: startX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseMove(document, { clientX: endX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseUp(document, { clientX: endX, clientY: 50, bubbles: true });
    raf.flush();

    expect(moveBlockMock).toHaveBeenCalled();
    const [id, newStart, newEnd] = moveBlockMock.mock.calls[0];
    expect(id).toBe('block-2');
    expect(newStart).toBe(mockBlocks[1].startTime);
    expect(newEnd).not.toBe(mockBlocks[1].endTime);

    raf.restore();
  });

  it('drag with zero slot change triggers onBlockClick instead of move', () => {
    const raf = flushRaf();
    const onCreateBlock = vi.fn();
    const onBlockClick = vi.fn();
    render(<PlanTimeline onCreateBlock={onCreateBlock} onBlockClick={onBlockClick} />);

    const container = document.querySelector('[class*="timelineContainer"]') as HTMLElement;
    setupTimelineRect(container!);

    const block = document.querySelector('[data-block-id="block-1"]') as HTMLElement;
    expect(block).not.toBeNull();

    const startSlot = 32;
    const startX = startSlot * SLOT_WIDTH + SLOT_WIDTH / 2;

    fireEvent.mouseDown(block, { clientX: startX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseMove(document, { clientX: startX, clientY: 50, bubbles: true });
    raf.flush();
    
    fireEvent.mouseUp(document, { clientX: startX, clientY: 50, bubbles: true });
    raf.flush();

    expect(moveBlockMock).not.toHaveBeenCalled();
    expect(onBlockClick).toHaveBeenCalled();
    expect(onBlockClick.mock.calls[0][0].id).toBe('block-1');

    raf.restore();
  });

  it('current time indicator line is rendered', () => {
    const onCreateBlock = vi.fn();
    render(<PlanTimeline onCreateBlock={onCreateBlock} />);

    const currentTimeLine = document.querySelector('[class*="currentTimeLine"]');
    expect(currentTimeLine).not.toBeNull();
  });

  it('has correct number of lanes', () => {
    const onCreateBlock = vi.fn();
    render(<PlanTimeline onCreateBlock={onCreateBlock} />);

    const lanes = document.querySelectorAll('[class*="lane"]');
    expect(lanes.length).toBe(MAX_LANES);
  });
});
