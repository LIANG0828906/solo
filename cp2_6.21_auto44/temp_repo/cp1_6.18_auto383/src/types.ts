export type EventType = 'text' | 'image' | 'video';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: EventType;
  mediaUrl?: string;
  position: {
    x: number;
    y: number;
  };
  span: number;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

export type LineAnimation = 'none' | 'flowing' | 'wave';

export interface Connection {
  id: string;
  fromEventId: string;
  toEventId: string;
  color: string;
  width: number;
  animation: LineAnimation;
  createdAt: number;
}

export type ViewMode = 'scroll' | 'slides';

export interface TimelineConfig {
  viewMode: ViewMode;
  startDate: string;
  endDate: string;
  title: string;
  zoomLevel: number;
}

export const PRESET_COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#EC4899'
];

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  text: '#3B82F6',
  image: '#10B981',
  video: '#F59E0B',
};

export const EVENT_NODE_WIDTH = 120;
export const EVENT_NODE_HEIGHT = 60;
export const SNAP_MINUTES = 15;
export const MIN_NODE_SPACING = 30;
export const HOUR_PIXELS = 80;

export type RendererEventType = 
  | 'event-click'
  | 'event-drag-start'
  | 'event-drag-move'
  | 'event-drag-end'
  | 'connection-click'
  | 'canvas-double-click'
  | 'create-connection-start'
  | 'create-connection-end';

export interface RendererEvent {
  type: RendererEventType;
  eventId?: string;
  connectionId?: string;
  position?: { x: number; y: number };
  payload?: unknown;
}

export type RendererEventHandler = (event: RendererEvent) => void;

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}
