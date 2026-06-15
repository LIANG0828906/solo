export interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  isLoading: boolean;
  isSleeping: boolean;
  lastActivityTime: number;
}

export interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

export type TabAction =
  | { type: 'ADD_TAB'; payload: { url: string; title: string } }
  | { type: 'REMOVE_TAB'; payload: { id: string } }
  | { type: 'SET_ACTIVE_TAB'; payload: { id: string } }
  | { type: 'REORDER_TABS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_LOADING'; payload: { id: string; isLoading: boolean } }
  | { type: 'SET_SLEEPING'; payload: { id: string; isSleeping: boolean } }
  | { type: 'SLEEP_INACTIVE_TABS' }
  | { type: 'UPDATE_ACTIVITY'; payload: { id: string } }
  | { type: 'WAKE_UP_TAB'; payload: { id: string } };

export interface Bookmark {
  id: string;
  name: string;
  url: string;
  favicon: string;
}

export interface TabContextType {
  state: TabState;
  dispatch: React.Dispatch<TabAction>;
}
