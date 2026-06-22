import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  UserStory,
  WireframePage,
  WireframeElement,
  Theme,
  lightTheme,
  darkTheme,
} from '../types';

interface AppState {
  markdown: string;
  stories: UserStory[];
  pages: WireframePage[];
  theme: Theme;
  leftPaneWidth: number;
  isExporting: boolean;
  exportProgress: number;
  showExportProgress: boolean;

  setMarkdown: (markdown: string) => void;
  setStories: (stories: UserStory[]) => void;
  setPages: (pages: WireframePage[]) => void;
  toggleTheme: () => void;
  setLeftPaneWidth: (width: number) => void;
  updateElementPosition: (
    pageId: string,
    elementId: string,
    x: number,
    y: number
  ) => void;
  startExport: () => void;
  setExportProgress: (progress: number) => void;
  finishExport: () => void;
  saveLayout: (pageId: string, elements: WireframeElement[]) => void;
}

const defaultMarkdown = `# 用户故事列表

## 登录模块
- 作为一名用户，我希望能够通过邮箱和密码登录系统，以便访问我的个人数据。
- 作为一名用户，我希望能够重置我的密码，以便在忘记密码时重新获得访问权限。

## 首页模块
- 作为一名用户，我希望看到仪表盘概览，以便快速了解系统状态。
- 作为一名用户，我希望能够查看最近的活动记录，以便跟踪我的操作历史。

## 设置模块
- 作为一名用户，我希望能够修改我的个人资料，以便保持信息更新。
- 作为一名管理员，我希望能够管理用户权限，以便控制系统访问。
`;

export const useStore = create<AppState>((set) => ({
  markdown: defaultMarkdown,
  stories: [],
  pages: [],
  theme: lightTheme,
  leftPaneWidth: 35,
  isExporting: false,
  exportProgress: 0,
  showExportProgress: false,

  setMarkdown: (markdown) => set({ markdown }),
  setStories: (stories) => set({ stories }),
  setPages: (pages) => set({ pages }),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme.mode === 'light' ? darkTheme : lightTheme,
    })),

  setLeftPaneWidth: (width) => set({ leftPaneWidth: width }),

  updateElementPosition: (pageId, elementId, x, y) =>
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              elements: page.elements.map((el) =>
                el.id === elementId ? { ...el, x, y } : el
              ),
            }
          : page
      ),
    })),

  startExport: () =>
    set({ isExporting: true, exportProgress: 0, showExportProgress: true }),

  setExportProgress: (progress) => set({ exportProgress: progress }),

  finishExport: () =>
    set({ isExporting: false, exportProgress: 100, showExportProgress: false }),

  saveLayout: (pageId, elements) =>
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === pageId ? { ...page, elements } : page
      ),
    })),
}));

export const generateElementId = () => uuidv4();
export const generatePageId = () => uuidv4();
export const generateStoryId = () => uuidv4();
