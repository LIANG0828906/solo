import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/helpers';
import type { Highlight, Note, Chapter, HighlightColor } from '@/types';

export const ReaderEngine = {
  getChapterById(chapterId: string): Chapter | undefined {
    return useAppStore.getState().chapters.find(c => c.id === chapterId);
  },

  getHighlightsByChapter(chapterId: string, memberId?: string): Highlight[] {
    const state = useAppStore.getState();
    let highlights = [...state.highlights.filter(h => h.chapterId === chapterId)];
    if (memberId) {
      highlights = [...highlights.filter(h => h.memberId === memberId)];
    }
    return [...highlights].sort((a, b) => a.startOffset - b.startOffset).map(h => structuredClone(h));
  },

  getNotesByHighlight(highlightId: string): Note[] {
    return [...useAppStore.getState().notes.filter(n => n.highlightId === highlightId)].map(n => structuredClone(n));
  },

  getNoteByHighlightAndMember(highlightId: string, memberId: string): Note | undefined {
    const note = useAppStore.getState().notes.find(
      n => n.highlightId === highlightId && n.memberId === memberId
    );
    return note ? structuredClone(note) : undefined;
  },

  createHighlight(
    chapterId: string,
    memberId: string,
    startOffset: number,
    endOffset: number,
    color: HighlightColor,
    text: string
  ): Highlight {
    const state = useAppStore.getState();
    
    const highlight: Highlight = structuredClone({
      id: generateId(),
      chapterId,
      memberId,
      startOffset,
      endOffset,
      color,
      text,
      createdAt: Date.now(),
    });

    state.addHighlight(structuredClone(highlight));
    state.addToast('已添加高亮', 'success');

    return structuredClone(highlight);
  },

  updateHighlightColor(highlightId: string, color: HighlightColor): void {
    const state = useAppStore.getState();
    const highlight = state.highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    const clonedHighlight = structuredClone(highlight);
    clonedHighlight.color = color;
    state.updateHighlight(clonedHighlight);
  },

  deleteHighlight(highlightId: string): void {
    const state = useAppStore.getState();
    state.deleteHighlight(highlightId);
    state.addToast('已删除高亮', 'info');
  },

  createNote(highlightId: string, memberId: string, content: string): Note {
    const state = useAppStore.getState();
    
    const existingNote = state.notes.find(
      n => n.highlightId === highlightId && n.memberId === memberId
    );

    if (existingNote) {
      const clonedNote = structuredClone(existingNote);
      clonedNote.content = content;
      clonedNote.createdAt = Date.now();
      state.updateNote(structuredClone(clonedNote));
      state.addToast('笔记已更新', 'success');
      return structuredClone(clonedNote);
    }

    const note: Note = structuredClone({
      id: generateId(),
      highlightId,
      memberId,
      content,
      createdAt: Date.now(),
    });

    state.addNote(structuredClone(note));
    state.addToast('笔记已保存', 'success');

    return structuredClone(note);
  },

  getHighlightPosition(highlightId: string): { top: number; left: number } | null {
    const state = useAppStore.getState();
    const highlight = state.highlights.find(h => h.id === highlightId);
    if (!highlight) return null;

    return structuredClone({ top: highlight.startOffset, left: 0 });
  },

  buildHighlightedContent(chapterId: string, memberId: string): { text: string; highlights: Highlight[] } {
    const state = useAppStore.getState();
    const chapter = state.chapters.find(c => c.id === chapterId);
    if (!chapter) return structuredClone({ text: '', highlights: [] });

    const highlights = [...state.highlights
      .filter(h => h.chapterId === chapterId && h.memberId === memberId)]
      .sort((a, b) => a.startOffset - b.startOffset)
      .map(h => structuredClone(h));

    return structuredClone({ text: chapter.content, highlights: [...highlights] });
  },
};
