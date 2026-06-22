import { create } from 'zustand';
import { splitContent, CardContent } from '../utils/splitContent';

export type ThemeType = 'light' | 'warm' | 'dark';
export type FontType = 'noto' | 'kuaile' | 'serif';
export type TransitionType = 'fade' | 'slide' | 'flip' | 'zoom';

interface ContentState {
  rawText: string;
  cards: CardContent[];
  highlightedCardId: string | null;
  currentTheme: ThemeType;
  currentFont: FontType;
  transitionEffect: TransitionType;
  isFullscreen: boolean;
  fullscreenCardId: string | null;
  fullscreenIndex: number;
  isExporting: boolean;
  isIconPickerFor: string | null;
  
  setRawText: (text: string) => void;
  performSplit: () => void;
  setHighlightedCard: (id: string | null) => void;
  setTheme: (theme: ThemeType) => void;
  setFont: (font: FontType) => void;
  setTransition: (transition: TransitionType) => void;
  replaceIcon: (cardId: string, iconId: string) => void;
  toggleFullscreen: (cardId?: string) => void;
  setFullscreenIndex: (index: number) => void;
  setExporting: (exporting: boolean) => void;
  setIconPickerFor: (cardId: string | null) => void;
}

const defaultText = `# 欢迎使用拆文成卡

这是一款帮助创作者快速制作精美卡片的工具。

## 如何使用

只需将你的 Markdown 内容粘贴到左侧编辑区，然后点击"自动拆分"按钮，系统会自动将内容拆分成多张精美的信息卡片。

每张卡片都会自动匹配主题色和相关图标，让你的内容更加生动有趣。

## 核心功能

### 内容智能拆分

系统会根据段落长度和标点符号智能拆分内容，确保每张卡片的内容长度适中，阅读体验最佳。

### 自动插图生成

每张卡片的标题旁会自动插入与内容相关的SVG图标，图标颜色与卡片背景形成互补色，视觉效果出色。

### 多种过渡动画

提供淡入淡出、向左滑动、向下翻页、缩放等多种翻页过渡效果，让你的卡片展示更加生动。

### 主题与字体切换

支持极简白、暖黄复古、暗夜森林三套配色主题，以及Noto Sans SC、ZCOOL KuaiLe、Source Han Serif三款字体随心切换。

### 编辑器同步滚动

编辑区滚动时，预览区会自动高亮显示当前编辑段落对应的卡片，方便你快速定位内容。

### 一键导出HTML

点击导出按钮，即可将所有卡片合成为一张带CSS动画的HTML单页，所有依赖内联，可直接在浏览器打开播放。

## 开始创作吧

现在就试试粘贴你的内容，体验一下一键生成精美卡片的魔力吧！
`;

export const useContentStore = create<ContentState>((set, get) => ({
  rawText: defaultText,
  cards: [],
  highlightedCardId: null,
  currentTheme: 'light',
  currentFont: 'noto',
  transitionEffect: 'fade',
  isFullscreen: false,
  fullscreenCardId: null,
  fullscreenIndex: 0,
  isExporting: false,
  isIconPickerFor: null,

  setRawText: (text) => set({ rawText: text }),

  performSplit: () => {
    const { rawText } = get();
    const cards = splitContent(rawText);
    set({ cards });
  },

  setHighlightedCard: (id) => set({ highlightedCardId: id }),

  setTheme: (theme) => set({ currentTheme: theme }),

  setFont: (font) => set({ currentFont: font }),

  setTransition: (transition) => set({ transitionEffect: transition }),

  replaceIcon: (cardId, iconId) => {
    const { cards } = get();
    const updatedCards = cards.map(card =>
      card.id === cardId ? { ...card, iconId } : card
    );
    set({ cards: updatedCards });
  },

  toggleFullscreen: (cardId) => {
    const { isFullscreen, cards } = get();
    
    if (isFullscreen) {
      set({ isFullscreen: false, fullscreenCardId: null });
    } else if (cardId) {
      const index = cards.findIndex(c => c.id === cardId);
      set({ 
        isFullscreen: true, 
        fullscreenCardId: cardId,
        fullscreenIndex: index >= 0 ? index : 0
      });
    }
  },

  setFullscreenIndex: (index) => {
    const { cards } = get();
    const safeIndex = Math.max(0, Math.min(index, cards.length - 1));
    set({ 
      fullscreenIndex: safeIndex,
      fullscreenCardId: cards[safeIndex]?.id || null
    });
  },

  setExporting: (exporting) => set({ isExporting: exporting }),

  setIconPickerFor: (cardId) => set({ isIconPickerFor: cardId }),
}));
