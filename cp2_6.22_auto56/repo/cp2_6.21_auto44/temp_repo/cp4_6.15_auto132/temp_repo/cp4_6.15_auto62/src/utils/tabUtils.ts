import { v4 as uuidv4 } from 'uuid';
import type { Tab } from '@/types';

export const generateTabId = (): string => {
  return uuidv4();
};

export const extractTitleFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.replace(/^www\./, '').split('.');
    if (parts.length >= 2) {
      const mainPart = parts[parts.length - 2];
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    }
    return hostname;
  } catch {
    return url;
  }
};

export const extractDomain = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const getFirstLetter = (url: string): string => {
  const title = extractTitleFromUrl(url);
  return title.charAt(0).toUpperCase();
};

export const handleCloseTab = (
  tabs: Tab[],
  closingTabId: string
): { newTabs: Tab[]; newActiveId: string | null } => {
  const closingIndex = tabs.findIndex(tab => tab.id === closingTabId);
  if (closingIndex === -1) {
    return { newTabs: tabs, newActiveId: tabs[0]?.id || null };
  }

  const closingTab = tabs[closingIndex];
  const newTabs = tabs.filter(tab => tab.id !== closingTabId);

  if (newTabs.length === 0) {
    return { newTabs: [], newActiveId: null };
  }

  if (!closingTab.isActive) {
    const activeTab = newTabs.find(tab => tab.isActive);
    return { newTabs, newActiveId: activeTab?.id || newTabs[0].id };
  }

  const newActiveIndex = closingIndex > 0 ? closingIndex - 1 : 0;
  const newActiveId = newTabs[newActiveIndex]?.id || null;

  return {
    newTabs: newTabs.map(tab => ({
      ...tab,
      isActive: tab.id === newActiveId
    })),
    newActiveId
  };
};

export const reorderTabs = (
  tabs: Tab[],
  fromIndex: number,
  toIndex: number
): Tab[] => {
  const result = [...tabs];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

export const MAX_TABS = 10;

export const SLEEP_TIMEOUT = 5 * 60 * 1000;
