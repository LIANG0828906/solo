import React, { createContext, useReducer, useContext, useEffect, useCallback, ReactNode } from 'react';
import type { TabState, TabAction, TabContextType } from '@/types';
import { generateTabId, extractTitleFromUrl, handleCloseTab, reorderTabs, MAX_TABS, SLEEP_TIMEOUT } from '@/utils/tabUtils';

const initialState: TabState = {
  tabs: [],
  activeTabId: null
};

const tabReducer = (state: TabState, action: TabAction): TabState => {
  switch (action.type) {
    case 'ADD_TAB': {
      if (state.tabs.length >= MAX_TABS) {
        return state;
      }
      const newTabId = generateTabId();
      const newTab = {
        id: newTabId,
        title: action.payload.title || extractTitleFromUrl(action.payload.url),
        url: action.payload.url,
        isActive: true,
        isLoading: true,
        isSleeping: false,
        lastActivityTime: Date.now()
      };
      return {
        tabs: [
          ...state.tabs.map(tab => ({ ...tab, isActive: false })),
          newTab
        ],
        activeTabId: newTabId
      };
    }
    case 'REMOVE_TAB': {
      const { newTabs, newActiveId } = handleCloseTab(state.tabs, action.payload.id);
      return {
        tabs: newTabs,
        activeTabId: newActiveId
      };
    }
    case 'SET_ACTIVE_TAB': {
      return {
        tabs: state.tabs.map(tab => ({
          ...tab,
          isActive: tab.id === action.payload.id,
          lastActivityTime: tab.id === action.payload.id ? Date.now() : tab.lastActivityTime
        })),
        activeTabId: action.payload.id
      };
    }
    case 'REORDER_TABS': {
      return {
        ...state,
        tabs: reorderTabs(state.tabs, action.payload.fromIndex, action.payload.toIndex)
      };
    }
    case 'SET_LOADING': {
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.payload.id
            ? { ...tab, isLoading: action.payload.isLoading }
            : tab
        )
      };
    }
    case 'SET_SLEEPING': {
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.payload.id
            ? { ...tab, isSleeping: action.payload.isSleeping }
            : tab
        )
      };
    }
    case 'UPDATE_ACTIVITY': {
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.payload.id
            ? { ...tab, lastActivityTime: Date.now(), isSleeping: false }
            : tab
        )
      };
    }
    case 'WAKE_UP_TAB': {
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.payload.id
            ? {
                ...tab,
                isSleeping: false,
                isLoading: true,
                lastActivityTime: Date.now()
              }
            : tab
        )
      };
    }
    default:
      return state;
  }
};

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tabReducer, initialState);

  const checkSleepingTabs = useCallback(() => {
    const now = Date.now();
    state.tabs.forEach(tab => {
      if (!tab.isSleeping && now - tab.lastActivityTime > SLEEP_TIMEOUT) {
        dispatch({ type: 'SET_SLEEPING', payload: { id: tab.id, isSleeping: true } });
      }
    });
  }, [state.tabs]);

  useEffect(() => {
    const interval = setInterval(checkSleepingTabs, 60000);
    return () => clearInterval(interval);
  }, [checkSleepingTabs]);

  return (
    <TabContext.Provider value={{ state, dispatch }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabContext = (): TabContextType => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};
