import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import type { Magazine, MagazineElement, Page } from './types';
import { MAX_PAGES } from './types';

function createPage(order: number): Page {
  return {
    id: uuidv4(),
    title: `第 ${order} 页`,
    elements: [],
    isCover: false,
    isToc: false,
    order,
  };
}

function createDefaultMagazine(): Magazine {
  const firstPage = createPage(1);
  return {
    id: uuidv4(),
    name: '我的杂志',
    author: '作者',
    pages: [firstPage],
    coverPageId: null,
  };
}

interface MagazineStore {
  magazine: Magazine;
  currentPageId: string | null;
  selectedElementId: string | null;
  isPreviewMode: boolean;
  addPage: () => void;
  removePage: (id: string) => void;
  movePage: (fromIndex: number, toIndex: number) => void;
  setCurrentPage: (id: string | null) => void;
  addElement: (pageId: string, element: MagazineElement) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<MagazineElement>) => void;
  removeElement: (pageId: string, elementId: string) => void;
  bringForward: (pageId: string, elementId: string) => void;
  sendBackward: (pageId: string, elementId: string) => void;
  selectElement: (id: string | null) => void;
  setCoverPage: (pageId: string | null) => void;
  generateToc: () => void;
  setPreviewMode: (mode: boolean) => void;
  importMagazine: (data: Magazine) => void;
  updateMagazineInfo: (name: string, author: string) => void;
}

export const useMagazineStore = create<MagazineStore>((set, get) => {
  const defaultMag = createDefaultMagazine();
  return {
    magazine: defaultMag,
    currentPageId: defaultMag.pages[0].id,
    selectedElementId: null,
    isPreviewMode: false,

    addPage: () => {
      const { magazine } = get();
      if (magazine.pages.length >= MAX_PAGES) return;
      const newPage = createPage(magazine.pages.length + 1);
      set({
        magazine: {
          ...magazine,
          pages: [...magazine.pages, newPage],
        },
        currentPageId: newPage.id,
        selectedElementId: null,
      });
    },

    removePage: (id) => {
      const { magazine, currentPageId } = get();
      if (magazine.pages.length <= 1) return;
      const filtered = magazine.pages.filter((p) => p.id !== id);
      const reindexed = filtered.map((p, i) => ({ ...p, order: i + 1 }));
      const newCurrentId = currentPageId === id
        ? reindexed[0]?.id ?? null
        : currentPageId;
      set({
        magazine: {
          ...magazine,
          pages: reindexed,
          coverPageId: magazine.coverPageId === id ? null : magazine.coverPageId,
        },
        currentPageId: newCurrentId,
        selectedElementId: null,
      });
    },

    movePage: (fromIndex, toIndex) => {
      const { magazine } = get();
      const pages = [...magazine.pages];
      const [moved] = pages.splice(fromIndex, 1);
      pages.splice(toIndex, 0, moved);
      const reindexed = pages.map((p, i) => ({ ...p, order: i + 1 }));
      set({ magazine: { ...magazine, pages: reindexed } });
    },

    setCurrentPage: (id) => {
      set({ currentPageId: id, selectedElementId: null });
    },

    addElement: (pageId, element) => {
      const { magazine } = get();
      set({
        magazine: {
          ...magazine,
          pages: magazine.pages.map((p) =>
            p.id === pageId ? { ...p, elements: [...p.elements, element] } : p
          ),
        },
        selectedElementId: element.id,
      });
    },

    updateElement: (pageId, elementId, updates) => {
      const { magazine } = get();
      set({
        magazine: {
          ...magazine,
          pages: magazine.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  elements: p.elements.map((el) =>
                    el.id === elementId ? { ...el, ...updates } : el
                  ),
                }
              : p
          ),
        },
      });
    },

    removeElement: (pageId, elementId) => {
      const { magazine, selectedElementId } = get();
      set({
        magazine: {
          ...magazine,
          pages: magazine.pages.map((p) =>
            p.id === pageId
              ? { ...p, elements: p.elements.filter((el) => el.id !== elementId) }
              : p
          ),
        },
        selectedElementId: selectedElementId === elementId ? null : selectedElementId,
      });
    },

    bringForward: (pageId, elementId) => {
      const { magazine } = get();
      set({
        magazine: {
          ...magazine,
          pages: magazine.pages.map((p) => {
            if (p.id !== pageId) return p;
            const el = p.elements.find((e) => e.id === elementId);
            if (!el) return p;
            return {
              ...p,
              elements: p.elements.map((e) =>
                e.id === elementId ? { ...e, zIndex: e.zIndex + 1 } : e
              ),
            };
          }),
        },
      });
    },

    sendBackward: (pageId, elementId) => {
      const { magazine } = get();
      set({
        magazine: {
          ...magazine,
          pages: magazine.pages.map((p) => {
            if (p.id !== pageId) return p;
            return {
              ...p,
              elements: p.elements.map((e) =>
                e.id === elementId ? { ...e, zIndex: Math.max(0, e.zIndex - 1) } : e
              ),
            };
          }),
        },
      });
    },

    selectElement: (id) => {
      set({ selectedElementId: id });
    },

    setCoverPage: (pageId) => {
      const { magazine } = get();
      set({
        magazine: {
          ...magazine,
          pages: magazine.pages.map((p) => ({
            ...p,
            isCover: p.id === pageId,
          })),
          coverPageId: pageId,
        },
      });
    },

    generateToc: () => {
      const { magazine } = get();
      const existingToc = magazine.pages.find((p) => p.isToc);
      if (existingToc) {
        const updatedPages = magazine.pages.map((p) => {
          if (!p.isToc) return p;
          return {
            ...p,
            elements: magazine.pages
              .filter((pg) => !pg.isToc)
              .map((pg, idx) => {
                const textEl = pg.elements.find((e) => e.type === 'text');
                const title = textEl?.content
                  ? textEl.content.substring(0, 18)
                  : `第 ${pg.order} 页`;
                return {
                  id: uuidv4(),
                  type: 'text' as const,
                  x: 40,
                  y: 60 + idx * 50,
                  width: 400,
                  height: 36,
                  rotation: 0,
                  zIndex: idx + 1,
                  content: `${pg.order}. ${title}`,
                  fontFamily: 'Noto Serif SC',
                  fontSize: 18,
                  color: '#2c3e50',
                };
              }),
          };
        });
        set({ magazine: { ...magazine, pages: updatedPages } });
        return;
      }
      if (magazine.pages.length >= MAX_PAGES) return;
      const tocElements = magazine.pages
        .filter((p) => !p.isToc)
        .map((pg, idx) => {
          const textEl = pg.elements.find((e) => e.type === 'text');
          const title = textEl?.content
            ? textEl.content.substring(0, 18)
            : `第 ${pg.order} 页`;
          return {
            id: uuidv4(),
            type: 'text' as const,
            x: 40,
            y: 60 + idx * 50,
            width: 400,
            height: 36,
            rotation: 0,
            zIndex: idx + 1,
            content: `${pg.order}. ${title}`,
            fontFamily: 'Noto Serif SC',
            fontSize: 18,
            color: '#2c3e50',
          };
        });
      const tocPage: Page = {
        id: uuidv4(),
        title: '目录',
        elements: tocElements,
        isCover: false,
        isToc: true,
        order: 1,
      };
      const reindexed = [tocPage, ...magazine.pages].map((p, i) => ({
        ...p,
        order: i + 1,
      }));
      set({
        magazine: { ...magazine, pages: reindexed },
        currentPageId: tocPage.id,
        selectedElementId: null,
      });
    },

    setPreviewMode: (mode) => {
      set({ isPreviewMode: mode, selectedElementId: null });
    },

    importMagazine: (data) => {
      set({
        magazine: data,
        currentPageId: data.pages[0]?.id ?? null,
        selectedElementId: null,
        isPreviewMode: false,
      });
    },

    updateMagazineInfo: (name, author) => {
      const { magazine } = get();
      set({
        magazine: { ...magazine, name, author },
      });
    },
  };
});
