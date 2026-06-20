import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import {
  Magazine,
  Page,
  Element,
  TextElement,
  ImageElement,
  ShapeElement,
  FontFamily,
  Element as TElement,
} from './types';

function createDefaultMagazine(): Magazine {
  const firstPageId = uuid();
  return {
    id: uuid(),
    name: '我的电子杂志',
    author: '作者',
    pages: [{ id: firstPageId, order: 0, elements: [] }],
    coverPageId: firstPageId,
  };
}

type PartialPatch<T> = {
  [P in keyof T]?: T[P];
};

interface EditorState {
  magazine: Magazine;
  currentPageId: string | null;
  selectedElementId: string | null;
  previewOpen: boolean;

  setMagazineName: (name: string) => void;
  setMagazineAuthor: (author: string) => void;

  addPage: () => void;
  deletePage: (pageId: string) => void;
  reorderPages: (fromOrder: number, toOrder: number) => void;
  selectPage: (pageId: string) => void;
  setCoverPage: (pageId: string | null) => void;

  addTextElement: (pageId: string) => void;
  addImageElement: (pageId: string, src: string) => void;
  addShapeElement: (pageId: string) => void;
  updateElement: (
    pageId: string,
    elementId: string,
    patch: PartialPatch<TElement>,
  ) => void;
  deleteElement: (pageId: string, elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  bringElementForward: (pageId: string, elementId: string) => void;
  sendElementBackward: (pageId: string, elementId: string) => void;

  generateTocPage: () => void;

  setPreviewOpen: (open: boolean) => void;

  importMagazine: (data: Magazine) => void;
  reset: () => void;
}

const getSortedPages = (pages: Page[]) =>
  [...pages].sort((a, b) => a.order - b.order);

const getMaxZIndex = (elements: Element[]) =>
  elements.reduce((m, e) => Math.max(m, e.zIndex), 0);

export const useEditorStore = create<EditorState>((set, get) => ({
  magazine: createDefaultMagazine(),
  currentPageId: createDefaultMagazine().pages[0].id,
  selectedElementId: null,
  previewOpen: false,

  setMagazineName: (name) =>
    set((s) => ({ magazine: { ...s.magazine, name } })),

  setMagazineAuthor: (author) =>
    set((s) => ({ magazine: { ...s.magazine, author } })),

  addPage: () =>
    set((s) => {
      if (s.magazine.pages.length >= 12) return {};
      const maxOrder = s.magazine.pages.reduce(
        (m, p) => Math.max(m, p.order),
        -1,
      );
      const newPage: Page = {
        id: uuid(),
        order: maxOrder + 1,
        elements: [],
      };
      return {
        magazine: { ...s.magazine, pages: [...s.magazine.pages, newPage] },
        currentPageId: s.currentPageId ?? newPage.id,
      };
    }),

  deletePage: (pageId) =>
    set((s) => {
      if (s.magazine.pages.length <= 1) return {};
      const pages = s.magazine.pages.filter((p) => p.id !== pageId);
      const sorted = getSortedPages(pages).map((p, i) => ({ ...p, order: i }));
      const coverPageId =
        s.magazine.coverPageId === pageId ? sorted[0].id : s.magazine.coverPageId;
      const currentPageId =
        s.currentPageId === pageId ? sorted[0].id : s.currentPageId;
      return {
        magazine: { ...s.magazine, pages: sorted, coverPageId },
        currentPageId,
        selectedElementId: null,
      };
    }),

  reorderPages: (fromOrder, toOrder) =>
    set((s) => {
      const sorted = getSortedPages(s.magazine.pages);
      const [moved] = sorted.splice(fromOrder, 1);
      sorted.splice(toOrder, 0, moved);
      const pages = sorted.map((p, i) => ({ ...p, order: i }));
      return { magazine: { ...s.magazine, pages } };
    }),

  selectPage: (pageId) => set({ currentPageId: pageId, selectedElementId: null }),

  setCoverPage: (pageId) =>
    set((s) => ({ magazine: { ...s.magazine, coverPageId: pageId } })),

  addTextElement: (pageId) =>
    set((s) => {
      const page = s.magazine.pages.find((p) => p.id === pageId);
      if (!page) return {};
      const z = getMaxZIndex(page.elements) + 1;
      const fontFamily: FontFamily = 'Noto Serif SC';
      const el: TextElement = {
        id: uuid(),
        type: 'text',
        x: 60,
        y: 80,
        width: 360,
        height: 80,
        rotation: 0,
        zIndex: z,
        content: '请输入文字内容',
        fontFamily,
        fontSize: 24,
        color: '#2c3e50',
      };
      return {
        magazine: {
          ...s.magazine,
          pages: s.magazine.pages.map((p) =>
            p.id === pageId ? { ...p, elements: [...p.elements, el] } : p,
          ),
        },
        selectedElementId: el.id,
      };
    }),

  addImageElement: (pageId, src) =>
    set((s) => {
      const page = s.magazine.pages.find((p) => p.id === pageId);
      if (!page) return {};
      const z = getMaxZIndex(page.elements) + 1;
      const el: ImageElement = {
        id: uuid(),
        type: 'image',
        x: 90,
        y: 120,
        width: 320,
        height: 240,
        rotation: 0,
        zIndex: z,
        src,
        fitMode: 'cover',
      };
      return {
        magazine: {
          ...s.magazine,
          pages: s.magazine.pages.map((p) =>
            p.id === pageId ? { ...p, elements: [...p.elements, el] } : p,
          ),
        },
        selectedElementId: el.id,
      };
    }),

  addShapeElement: (pageId) =>
    set((s) => {
      const page = s.magazine.pages.find((p) => p.id === pageId);
      if (!page) return {};
      const z = getMaxZIndex(page.elements) + 1;
      const el: ShapeElement = {
        id: uuid(),
        type: 'shape',
        x: 120,
        y: 180,
        width: 240,
        height: 160,
        rotation: 0,
        zIndex: z,
        fillColor: '#e67e22',
        borderRadius: 8,
      };
      return {
        magazine: {
          ...s.magazine,
          pages: s.magazine.pages.map((p) =>
            p.id === pageId ? { ...p, elements: [...p.elements, el] } : p,
          ),
        },
        selectedElementId: el.id,
      };
    }),

  updateElement: (pageId, elementId, patch) =>
    set((s) => ({
      magazine: {
        ...s.magazine,
        pages: s.magazine.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                elements: p.elements.map((e) =>
                  e.id === elementId
                    ? ({ ...e, ...patch } as TElement)
                    : e,
                ),
              }
            : p,
        ),
      },
    })),

  deleteElement: (pageId, elementId) =>
    set((s) => ({
      magazine: {
        ...s.magazine,
        pages: s.magazine.pages.map((p) =>
          p.id === pageId
            ? { ...p, elements: p.elements.filter((e) => e.id !== elementId) }
            : p,
        ),
      },
      selectedElementId:
        s.selectedElementId === elementId ? null : s.selectedElementId,
    })),

  selectElement: (elementId) => set({ selectedElementId: elementId }),

  bringElementForward: (pageId, elementId) =>
    set((s) => {
      const page = s.magazine.pages.find((p) => p.id === pageId);
      if (!page) return {};
      const sortedEls = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sortedEls.findIndex((e) => e.id === elementId);
      if (idx === -1 || idx >= sortedEls.length - 1) return {};
      const swapIdx = idx + 1;
      const a = sortedEls[idx];
      const b = sortedEls[swapIdx];
      const newEls = page.elements.map((e) => {
        if (e.id === a.id) return { ...e, zIndex: b.zIndex };
        if (e.id === b.id) return { ...e, zIndex: a.zIndex };
        return e;
      });
      return {
        magazine: {
          ...s.magazine,
          pages: s.magazine.pages.map((p) =>
            p.id === pageId ? { ...p, elements: newEls } : p,
          ),
        },
      };
    }),

  sendElementBackward: (pageId, elementId) =>
    set((s) => {
      const page = s.magazine.pages.find((p) => p.id === pageId);
      if (!page) return {};
      const sortedEls = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sortedEls.findIndex((e) => e.id === elementId);
      if (idx <= 0) return {};
      const swapIdx = idx - 1;
      const a = sortedEls[idx];
      const b = sortedEls[swapIdx];
      const newEls = page.elements.map((e) => {
        if (e.id === a.id) return { ...e, zIndex: b.zIndex };
        if (e.id === b.id) return { ...e, zIndex: a.zIndex };
        return e;
      });
      return {
        magazine: {
          ...s.magazine,
          pages: s.magazine.pages.map((p) =>
            p.id === pageId ? { ...p, elements: newEls } : p,
          ),
        },
      };
    }),

  generateTocPage: () =>
    set((s) => {
      const { magazine } = s;
      const pages = getSortedPages(magazine.pages);
      const tocPageId = uuid();
      const startY = 110;
      const lineGap = 64;
      const font: FontFamily = 'Noto Serif SC';

      const titleText: TextElement = {
        id: uuid(),
        type: 'text',
        x: 60,
        y: 40,
        width: 560,
        height: 60,
        rotation: 0,
        zIndex: 1,
        content: '目 录',
        fontFamily: font,
        fontSize: 40,
        color: '#2c3e50',
      };
      const tocElements: Element[] = [titleText];
      let zc = 2;

      const pageTitles = pages.map((p, idx) => {
        if (p.id === magazine.coverPageId) return { id: p.id, title: '封面' };
        const textEls = p.elements.filter((e) => e.type === 'text') as TextElement[];
        const firstText = textEls[0]?.content ?? '';
        const trimmed = firstText.replace(/\s+/g, '').slice(0, 18);
        return {
          id: p.id,
          title: trimmed || `第${idx + 1}页`,
        };
      });

      pageTitles.forEach((info, idx) => {
        const y = startY + idx * lineGap;
        const titleEl: TextElement = {
          id: uuid(),
          type: 'text',
          x: 80,
          y,
          width: 440,
          height: 40,
          rotation: 0,
          zIndex: zc++,
          content: info.title,
          fontFamily: font,
          fontSize: 22,
          color: '#2c3e50',
        };
        const orderEl: TextElement = {
          id: uuid(),
          type: 'text',
          x: 540,
          y,
          width: 60,
          height: 40,
          rotation: 0,
          zIndex: zc++,
          content: String(idx + 1).padStart(2, '0'),
          fontFamily: font,
          fontSize: 20,
          color: '#e67e22',
        };
        tocElements.push(titleEl, orderEl);
      });

      const newTocPage: Page = {
        id: tocPageId,
        order: magazine.coverPageId ? 1 : 0,
        elements: tocElements,
        isToc: true,
      };

      let newPages = pages.map((p) => {
        if (p.id === magazine.coverPageId) return { ...p, order: 0 };
        return p;
      });
      if (magazine.coverPageId) {
        newPages = newPages.filter((p) => p.id !== magazine.coverPageId);
        newPages.unshift(pages.find((p) => p.id === magazine.coverPageId)!);
      }
      newPages = newPages.filter((p) => !p.isToc);
      newPages.splice(newTocPage.order, 0, newTocPage);
      newPages = newPages.map((p, i) => ({ ...p, order: i }));

      return {
        magazine: { ...magazine, pages: newPages },
        currentPageId: tocPageId,
        selectedElementId: null,
      };
    }),

  setPreviewOpen: (open) => set({ previewOpen: open }),

  importMagazine: (data) =>
    set({
      magazine: data,
      currentPageId: data.pages[0]?.id ?? null,
      selectedElementId: null,
    }),

  reset: () => {
    const m = createDefaultMagazine();
    set({
      magazine: m,
      currentPageId: m.pages[0].id,
      selectedElementId: null,
      previewOpen: false,
    });
  },
}));

export function getPageTitle(page: Page, index: number): string {
  if (page.isToc) return '目录';
  const textEls = page.elements.filter((e) => e.type === 'text') as TextElement[];
  const firstText = textEls[0]?.content ?? '';
  const trimmed = firstText.replace(/\s+/g, '').slice(0, 18);
  return trimmed || `第${index + 1}页`;
}
