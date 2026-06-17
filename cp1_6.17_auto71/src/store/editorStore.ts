import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type Language =
  | 'javascript'
  | 'python'
  | 'html'
  | 'css'
  | 'typescript'
  | 'json'
  | 'markdown';

export interface Draft {
  id: string;
  title: string;
  code: string;
  language: Language;
  updatedAt: number;
}

export interface Version {
  id: string;
  draftId: string;
  code: string;
  timestamp: number;
}

export interface Annotation {
  id: string;
  draftId: string;
  lineNumber: number;
  content: string;
  createdAt: number;
}

interface EditorState {
  currentDraftId: string | null;
  drafts: Draft[];
  versions: Version[];
  annotations: Annotation[];
  code: string;
  language: Language;

  setCode: (code: string) => void;
  setLanguage: (lang: Language) => void;
  saveDraft: (title?: string) => Draft;
  loadDraft: (draftId: string) => void;
  createVersion: () => Version | null;
  addAnnotation: (lineNumber: number, content: string) => void;
  getAnnotationsByLine: (draftId: string, lineNumber: number) => Annotation[];
}

const DEFAULT_CODE = `// 欢迎使用 CodeCollab
// 在这里输入或粘贴你的代码

function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to CodeCollab\`;
}

greet('Developer');
`;

export const useEditorStore = create<EditorState>((set, get) => ({
  currentDraftId: null,
  drafts: [],
  versions: [],
  annotations: [],
  code: DEFAULT_CODE,
  language: 'javascript',

  setCode: (code) => set({ code }),

  setLanguage: (language) => set({ language }),

  saveDraft: (title) => {
    const state = get();
    const now = Date.now();
    const draftTitle =
      title || state.code.split('\n')[0]?.slice(0, 30) || `草稿 ${new Date(now).toLocaleString('zh-CN')}`;

    if (state.currentDraftId) {
      const updatedDrafts = state.drafts.map((d) =>
        d.id === state.currentDraftId
          ? { ...d, code: state.code, language: state.language, updatedAt: now, title: draftTitle }
          : d,
      );
      set({ drafts: updatedDrafts });
      return updatedDrafts.find((d) => d.id === state.currentDraftId)!;
    }

    const newDraft: Draft = {
      id: uuidv4(),
      title: draftTitle,
      code: state.code,
      language: state.language,
      updatedAt: now,
    };
    set({
      drafts: [newDraft, ...state.drafts],
      currentDraftId: newDraft.id,
    });
    return newDraft;
  },

  loadDraft: (draftId) => {
    const state = get();
    const draft = state.drafts.find((d) => d.id === draftId);
    if (draft) {
      set({
        currentDraftId: draftId,
        code: draft.code,
        language: draft.language,
      });
    }
  },

  createVersion: () => {
    const state = get();
    if (!state.currentDraftId) return null;

    const newVersion: Version = {
      id: uuidv4(),
      draftId: state.currentDraftId,
      code: state.code,
      timestamp: Date.now(),
    };
    set({ versions: [...state.versions, newVersion] });
    return newVersion;
  },

  addAnnotation: (lineNumber, content) => {
    const state = get();
    if (!state.currentDraftId) return;

    const annotation: Annotation = {
      id: uuidv4(),
      draftId: state.currentDraftId,
      lineNumber,
      content,
      createdAt: Date.now(),
    };
    set({ annotations: [...state.annotations, annotation] });
  },

  getAnnotationsByLine: (draftId, lineNumber) => {
    return get().annotations.filter(
      (a) => a.draftId === draftId && a.lineNumber === lineNumber,
    );
  },
}));
