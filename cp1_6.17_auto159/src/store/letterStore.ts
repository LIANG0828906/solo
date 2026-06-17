import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { PaperTextureType, FontFamilyType } from '../engine/LetterPaperEngine';
import type { EnvelopeStyleType } from '../engine/EnvelopeAnimator';

export interface Letter {
  id: string;
  content: string;
  paperTexture: PaperTextureType;
  fontFamily: FontFamilyType;
  textColor: string;
  envelopeStyle: EnvelopeStyleType;
  createdAt: Date;
}

interface LetterState {
  currentContent: string;
  currentPaperTexture: PaperTextureType;
  currentFontFamily: FontFamilyType;
  currentTextColor: string;
  currentEnvelopeStyle: EnvelopeStyleType;

  letters: Letter[];

  isAnimating: boolean;
  currentAnimationLetterId: string | null;

  setContent: (content: string) => void;
  setPaperTexture: (texture: PaperTextureType) => void;
  setFontFamily: (font: FontFamilyType) => void;
  setTextColor: (color: string) => void;
  setEnvelopeStyle: (style: EnvelopeStyleType) => void;
  saveLetter: () => void;
  startAnimation: (letterId: string) => void;
  stopAnimation: () => void;
  getCurrentAnimationLetter: () => Letter | undefined;
  hasNextLetter: () => boolean;
  hasPrevLetter: () => boolean;
  goToNextLetter: () => void;
  goToPrevLetter: () => void;
}

const sampleLetters: Letter[] = [
  {
    id: uuidv4(),
    content: '亲爱的朋友：\n\n见信如晤。街角的梧桐又绿了，风里带着淡淡的花香。想起我们曾一起在这条街上散步，说说笑笑的日子。\n\n最近工作忙吗？要多注意身体。有空的话，一起喝杯茶吧。\n\n祝好\n\n你的老朋友',
    paperTexture: 'parchment',
    fontFamily: 'caveat',
    textColor: '#4A3B32',
    envelopeStyle: 'wax-seal',
    createdAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: uuidv4(),
    content: '致未来的自己：\n\n希望你看到这封信的时候，已经实现了当初的梦想。不管路途多么艰难，都要记得坚持走下去。\n\n生活不只是眼前的苟且，还有诗和远方。',
    paperTexture: 'letterhead',
    fontFamily: 'playfair',
    textColor: '#2C3E50',
    envelopeStyle: 'airmail',
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: uuidv4(),
    content: '妈妈：\n\n谢谢您一直以来的关爱和支持。我在这边一切都好，工作顺利，同事们也很友善。\n\n您要多注意休息，别太劳累了。等放假了我就回家看您。\n\n爱您的儿子',
    paperTexture: 'kraft',
    fontFamily: 'inter',
    textColor: '#3D2914',
    envelopeStyle: 'kraft-bag',
    createdAt: new Date(Date.now() - 86400000),
  },
];

export const useLetterStore = create<LetterState>((set, get) => ({
  currentContent: '',
  currentPaperTexture: 'parchment',
  currentFontFamily: 'caveat',
  currentTextColor: '#2C3E50',
  currentEnvelopeStyle: 'wax-seal',

  letters: sampleLetters,

  isAnimating: false,
  currentAnimationLetterId: null,

  setContent: (content: string) => {
    if (content.length <= 500) {
      set({ currentContent: content });
    }
  },

  setPaperTexture: (texture: PaperTextureType) => {
    set({ currentPaperTexture: texture });
  },

  setFontFamily: (font: FontFamilyType) => {
    set({ currentFontFamily: font });
  },

  setTextColor: (color: string) => {
    set({ currentTextColor: color });
  },

  setEnvelopeStyle: (style: EnvelopeStyleType) => {
    set({ currentEnvelopeStyle: style });
  },

  saveLetter: () => {
    const state = get();
    if (!state.currentContent.trim()) return;

    const newLetter: Letter = {
      id: uuidv4(),
      content: state.currentContent,
      paperTexture: state.currentPaperTexture,
      fontFamily: state.currentFontFamily,
      textColor: state.currentTextColor,
      envelopeStyle: state.currentEnvelopeStyle,
      createdAt: new Date(),
    };

    set((state) => ({
      letters: [newLetter, ...state.letters],
      currentContent: '',
    }));
  },

  startAnimation: (letterId: string) => {
    set({
      isAnimating: true,
      currentAnimationLetterId: letterId,
    });
  },

  stopAnimation: () => {
    set({
      isAnimating: false,
      currentAnimationLetterId: null,
    });
  },

  getCurrentAnimationLetter: () => {
    const state = get();
    return state.letters.find((l) => l.id === state.currentAnimationLetterId);
  },

  hasNextLetter: () => {
    const state = get();
    const currentIndex = state.letters.findIndex((l) => l.id === state.currentAnimationLetterId);
    return currentIndex >= 0 && currentIndex < state.letters.length - 1;
  },

  hasPrevLetter: () => {
    const state = get();
    const currentIndex = state.letters.findIndex((l) => l.id === state.currentAnimationLetterId);
    return currentIndex > 0;
  },

  goToNextLetter: () => {
    const state = get();
    const currentIndex = state.letters.findIndex((l) => l.id === state.currentAnimationLetterId);
    if (currentIndex >= 0 && currentIndex < state.letters.length - 1) {
      set({
        currentAnimationLetterId: state.letters[currentIndex + 1].id,
      });
    }
  },

  goToPrevLetter: () => {
    const state = get();
    const currentIndex = state.letters.findIndex((l) => l.id === state.currentAnimationLetterId);
    if (currentIndex > 0) {
      set({
        currentAnimationLetterId: state.letters[currentIndex - 1].id,
      });
    }
  },
}));
