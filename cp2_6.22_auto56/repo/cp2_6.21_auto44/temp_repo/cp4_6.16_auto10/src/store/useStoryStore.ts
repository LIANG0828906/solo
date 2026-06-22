import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';
import type {
  ChartType,
  DataPoint,
  ChartConfig,
  Slide,
  Story,
  StoryState,
} from '../types';
import { exportHTML, generateShareLink, loadFromShareLink } from '../utils/storySerializer';

const DEFAULT_COLORS = ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E89', '#1A659E'];

const generateSampleData = (type: ChartType): DataPoint[] => {
  switch (type) {
    case 'line':
      return d3.range(5).map((i) => ({
        x: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'][i],
        y: Math.floor(Math.random() * 80) + 20,
      }));
    case 'bar':
      return d3.range(4).map((i) => ({
        x: ['产品A', '产品B', '产品C', '产品D'][i],
        y: Math.floor(Math.random() * 100) + 30,
      }));
    case 'pie':
      return d3.range(5).map((i) => ({
        x: ['分类1', '分类2', '分类3', '分类4', '分类5'][i],
        y: Math.floor(Math.random() * 60) + 15,
      }));
    case 'scatter':
      return d3.range(8).map((i) => ({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        category: ['组A', '组B', '组C'][i % 3],
      }));
    default:
      return [];
  }
};

const createChartConfig = (type: ChartType): ChartConfig => ({
  id: uuidv4(),
  type,
  title: `${type === 'line' ? '折线图' : type === 'bar' ? '柱状图' : type === 'pie' ? '饼图' : '散点图'}示例`,
  xAxisLabel: 'X轴',
  yAxisLabel: 'Y轴',
  showLegend: true,
  colors: [...DEFAULT_COLORS],
  data: generateSampleData(type),
});

const createInitialStory = (): Story => {
  const now = Date.now();
  return {
    id: uuidv4(),
    title: '我的数据故事',
    slides: [
      {
        id: uuidv4(),
        chartConfig: createChartConfig('line'),
        notes: '## 趋势分析\n\n这是一个展示数据趋势的折线图示例。',
        transition: 'fade',
        interactions: [],
        order: 0,
      },
      {
        id: uuidv4(),
        chartConfig: createChartConfig('bar'),
        notes: '## 产品对比\n\n柱状图清晰展示了各产品的销售数据。',
        transition: 'slide',
        interactions: [],
        order: 1,
      },
      {
        id: uuidv4(),
        chartConfig: createChartConfig('pie'),
        notes: '## 市场份额\n\n饼图展示了各分类的占比情况。',
        transition: 'fade',
        interactions: [],
        order: 2,
      },
      {
        id: uuidv4(),
        chartConfig: createChartConfig('scatter'),
        notes: '## 相关性分析\n\n散点图展示了两个变量之间的关系。',
        transition: 'slide',
        interactions: [],
        order: 3,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
};

export const useStoryStore = create<StoryState>((set, get) => ({
  story: createInitialStory(),
  selectedSlideId: null,
  isPlayMode: false,
  currentSlideIndex: 0,
  draggedChartType: null,

  addSlide: (chartType: ChartType) => {
    set((state) => {
      const newSlide: Slide = {
        id: uuidv4(),
        chartConfig: createChartConfig(chartType),
        notes: '',
        transition: 'fade',
        interactions: [],
        order: state.story.slides.length,
      };
      return {
        story: {
          ...state.story,
          slides: [...state.story.slides, newSlide],
          updatedAt: Date.now(),
        },
        selectedSlideId: newSlide.id,
      };
    });
  },

  removeSlide: (slideId: string) => {
    set((state) => {
      const newSlides = state.story.slides.filter((s) => s.id !== slideId);
      const reorderedSlides = newSlides.map((s, i) => ({ ...s, order: i }));
      return {
        story: {
          ...state.story,
          slides: reorderedSlides,
          updatedAt: Date.now(),
        },
        selectedSlideId: state.selectedSlideId === slideId ? null : state.selectedSlideId,
      };
    });
  },

  reorderSlides: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const slides = [...state.story.slides];
      const [removed] = slides.splice(fromIndex, 1);
      slides.splice(toIndex, 0, removed);
      const reorderedSlides = slides.map((s, i) => ({ ...s, order: i }));
      return {
        story: {
          ...state.story,
          slides: reorderedSlides,
          updatedAt: Date.now(),
        },
      };
    });
  },

  selectSlide: (slideId: string | null) => {
    set({ selectedSlideId: slideId });
  },

  updateSlide: (slideId: string, updates: Partial<Slide>) => {
    set((state) => ({
      story: {
        ...state.story,
        slides: state.story.slides.map((s) =>
          s.id === slideId ? { ...s, ...updates } : s
        ),
        updatedAt: Date.now(),
      },
    }));
  },

  updateChartConfig: (slideId: string, config: Partial<ChartConfig>) => {
    set((state) => ({
      story: {
        ...state.story,
        slides: state.story.slides.map((s) =>
          s.id === slideId
            ? { ...s, chartConfig: { ...s.chartConfig, ...config } }
            : s
        ),
        updatedAt: Date.now(),
      },
    }));
  },

  importCSVData: (slideId: string, data: DataPoint[]) => {
    set((state) => ({
      story: {
        ...state.story,
        slides: state.story.slides.map((s) =>
          s.id === slideId
            ? { ...s, chartConfig: { ...s.chartConfig, data } }
            : s
        ),
        updatedAt: Date.now(),
      },
    }));
  },

  setPlayMode: (isPlaying: boolean) => {
    set({ isPlayMode: isPlaying, currentSlideIndex: 0 });
  },

  setCurrentSlideIndex: (index: number) => {
    set({ currentSlideIndex: index });
  },

  setDraggedChartType: (type: ChartType | null) => {
    set({ draggedChartType: type });
  },

  exportHTML: () => {
    const { story } = get();
    return exportHTML(story);
  },

  generateShareLink: () => {
    const { story } = get();
    return generateShareLink(story);
  },

  loadFromShareLink: (storyId: string) => {
    const story = loadFromShareLink(storyId);
    if (story) {
      set({ story, selectedSlideId: null });
    }
  },
}));
