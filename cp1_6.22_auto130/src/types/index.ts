export type ComponentType = 'input' | 'button' | 'switch' | 'table';

export interface ComponentProps {
  [key: string]: any;
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  props: ComponentProps;
  mockDataKey?: string;
}

export interface SandboxState {
  components: ComponentInstance[];
  selectedComponentId: string | null;
  draggingComponentId: string | null;
}

export interface MockDataItem {
  id: string;
  key: string;
  value: any;
}

export interface MockState {
  data: MockDataItem[];
}

export type EventType =
  | 'component_select'
  | 'component_drag_start'
  | 'component_drag_end'
  | 'component_reorder'
  | 'prop_change'
  | 'mock_data_add'
  | 'mock_data_update'
  | 'mock_data_delete'
  | 'undo'
  | 'redo';

export interface LogEntry {
  id: string;
  type: EventType;
  timestamp: number;
  payload: Record<string, any>;
}

export interface LoggerState {
  logs: LogEntry[];
  expandedLogId: string | null;
}

export interface StateSnapshot {
  sandbox: SandboxState;
  mock: MockState;
  logger: LoggerState;
  timestamp: number;
}

export type ActiveTab = 'props' | 'mock' | 'logs';

export interface PropEditorConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'json';
  options?: string[];
}
