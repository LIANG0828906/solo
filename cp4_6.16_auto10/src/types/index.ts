export type ChartType = 'line' | 'bar' | 'pie' | 'scatter';

export interface DataPoint {
  x: string | number;
  y: number;
  category?: string;
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  showLegend: boolean;
  colors: string[];
  data: DataPoint[];
}

export interface DataPointInteraction {
  dataIndex: number;
  eventName: string;
  description: string;
  imageUrl: string;
}

export interface Slide {
  id: string;
  chartConfig: ChartConfig;
  notes: string;
  transition: 'fade' | 'slide';
  interactions: DataPointInteraction[];
  order: number;
}

export interface Story {
  id: string;
  title: string;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
}

export interface StoryState {
  story: Story;
  selectedSlideId: string | null;
  isPlayMode: boolean;
  currentSlideIndex: number;
  draggedChartType: ChartType | null;
  addSlide: (chartType: ChartType) => void;
  removeSlide: (slideId: string) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  selectSlide: (slideId: string | null) => void;
  updateSlide: (slideId: string, updates: Partial<Slide>) => void;
  updateChartConfig: (slideId: string, config: Partial<ChartConfig>) => void;
  importCSVData: (slideId: string, data: DataPoint[]) => void;
  setPlayMode: (isPlaying: boolean) => void;
  setCurrentSlideIndex: (index: number) => void;
  setDraggedChartType: (type: ChartType | null) => void;
  exportHTML: () => string;
  generateShareLink: () => string;
  loadFromShareLink: (storyId: string) => void;
}
