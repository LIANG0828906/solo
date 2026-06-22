import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FlavorPanel from '../FlavorPanel';
import { useStore, FLAVORS } from '../../store/useStore';

vi.mock('../../store/useStore', async () => {
  const actual = await vi.importActual('../../store/useStore');
  return {
    ...actual,
    useStore: vi.fn(),
  };
});

vi.mock('../ChocolatePreview', () => ({
  default: () => <div data-testid="chocolate-preview" />,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(),
  DragOverlay: ({ children }: any) => <div>{children}</div>,
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  rectSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: '',
    isDragging: false,
  })),
  arrayMove: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Translate: {
      toString: vi.fn(),
    },
  },
}));

const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;

describe('FlavorPanel', () => {
  const mockAddChocolate = vi.fn();
  const mockRemoveChocolate = vi.fn();
  const mockSwapChocolates = vi.fn();
  const mockSelectChocolate = vi.fn();
  const mockReorderChocolates = vi.fn();

  const createMockStore = (chocolates: any[] = [], selectedId: string | null = null) => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        selectedChocolates: chocolates,
        selectedChocolateId: selectedId,
        addChocolate: mockAddChocolate,
        removeChocolate: mockRemoveChocolate,
        swapChocolates: mockSwapChocolates,
        selectChocolate: mockSelectChocolate,
        reorderChocolates: mockReorderChocolates,
      };
      return selector(state);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    createMockStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the 6 flavor cards correctly', () => {
    render(<FlavorPanel />);
    
    FLAVORS.forEach((flavor) => {
      expect(screen.getByText(flavor.name)).toBeInTheDocument();
      expect(screen.getByText(flavor.description)).toBeInTheDocument();
    });
    
    expect(screen.getByText('选择口味')).toBeInTheDocument();
    expect(screen.getByText('礼盒预览')).toBeInTheDocument();
  });

  it('should show the 6 empty slots initially', () => {
    render(<FlavorPanel />);
    
    const emptySlots = screen.getAllByText('+');
    expect(emptySlots).toHaveLength(6);
  });

  it('should add chocolate when clicking a flavor card', () => {
    const { container } = render(<FlavorPanel />);
    
    const matchaText = screen.getByText('抹茶');
    const matchaCard = matchaText.closest('div[style*="cursor: pointer"]');
    
    expect(matchaCard).toBeTruthy();
    
    fireEvent.click(matchaCard!);
    
    expect(mockAddChocolate).toHaveBeenCalledWith('matcha');
  });

  it('should show tooltip when clicking an already-added flavor', async () => {
    const mockChocolate = {
      id: 'test-id',
      flavorId: 'matcha',
      shape: 'circle' as const,
      color: '#5D4037',
      texture: 'glossy' as const,
    };
    
    createMockStore([mockChocolate]);
    
    const { container } = render(<FlavorPanel />);
    
    const matchaText = screen.getByText('抹茶');
    const matchaCard = matchaText.closest('div[style*="cursor: pointer"]');
    expect(matchaCard).toBeTruthy();
    
    fireEvent.click(matchaCard!);
    
    expect(mockAddChocolate).not.toHaveBeenCalled();
    
    const tooltip = container.querySelector('div[style*="position: absolute"]');
    expect(tooltip).toBeTruthy();
    expect(tooltip?.textContent).toContain('已添加');
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    
    const tooltipAfter = container.querySelector('div[style*="position: absolute"]');
    expect(tooltipAfter?.textContent).not.toContain('已添加');
  });

  it('should show selected count correctly', () => {
    const mockChocolates = [
      {
        id: '1',
        flavorId: 'matcha',
        shape: 'circle' as const,
        color: '#5D4037',
        texture: 'glossy' as const,
      },
      {
        id: '2',
        flavorId: 'dark-chocolate',
        shape: 'square' as const,
        color: '#3E2723',
        texture: 'matte' as const,
      },
    ];
    
    createMockStore(mockChocolates);
    
    render(<FlavorPanel />);
    
    expect(screen.getByText(/已选.*2.*\/6 颗/)).toBeInTheDocument();
  });

  it('should show empty slots when some chocolates are selected', () => {
    const mockChocolates = [
      {
        id: '1',
        flavorId: 'matcha',
        shape: 'circle' as const,
        color: '#5D4037',
        texture: 'glossy' as const,
      },
    ];
    
    createMockStore(mockChocolates);
    
    render(<FlavorPanel />);
    
    const emptySlots = screen.getAllByText('+');
    expect(emptySlots).toHaveLength(5);
  });
});
