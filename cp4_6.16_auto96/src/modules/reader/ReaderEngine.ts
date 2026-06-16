import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/helpers';
import type { Highlight, Note, Chapter, HighlightColor } from '@/types';

export const ReaderEngine = {
  getChapterById(chapterId: string): Chapter | undefined {
    return useAppStore.getState().chapters.find(c => c.id === chapterId);
  },

  getHighlightsByChapter(chapterId: string, memberId?: string): Highlight[] {
    const state = useAppStore.getState();
    let highlights = state.highlights.filter(h => h.chapterId === chapterId);
    if (memberId) {
      highlights = highlights.filter(h => h.memberId === memberId);
    }
    return highlights.sort((a, b) => a.startOffset - b.startOffset);
  },

  getNotesByHighlight(highlightId: string): Note[] {
    return useAppStore.getState().notes.filter(n => n.highlightId === highlightId);
  },

  getNoteByHighlightAndMember(highlightId: string, memberId: string): Note | undefined {
    return useAppStore.getState().notes.find(
      n => n.highlightId === highlightId && n.memberId === memberId
    );
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
    
    const highlight: Highlight = {
      id: generateId(),
      chapterId,
      memberId,
      startOffset,
      endOffset,
      color,
      text,
      createdAt: Date.now(),
    };

    state.addHighlight(highlight);
    state.addToast('已添加高亮', 'success');

    return highlight;
  },

  updateHighlightColor(highlightId: string, color: HighlightColor): void {
    const state = useAppStore.getState();
    const highlight = state.highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    state.updateHighlight({ ...highlight, color });
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
      const updatedNote = { ...existingNote, content, createdAt: Date.now() };
      state.updateNote(updatedNote);
      state.addToast('笔记已更新', 'success');
      return updatedNote;
    }

    const note: Note = {
      id: generateId(),
      highlightId,
      memberId,
      content,
      createdAt: Date.now(),
    };

    state.addNote(note);
    state.addToast('笔记已保存', 'success');

    return note;
  },

  getHighlightPosition(highlightId: string): { top: number; left: number } | null {
    const state = useAppStore.getState();
    const highlight = state.highlights.find(h => h.id === highlightId);
    if (!highlight) return null;

    return { top: highlight.startOffset, left: 0 };
  },

  buildHighlightedContent(chapterId: string, memberId: string): { text: string; highlights: Highlight[] } {
    const state = useAppStore.getState();
    const chapter = state.chapters.find(c => c.id === chapterId);
    if (!chapter) return { text: '', highlights: [] };

    const highlights = state.highlights
      .filter(h => h.chapterId === chapterId && h.memberId === memberId)
      .sort((a, b) => a.startOffset - b.startOffset);

    return { text: chapter.content, highlights };
  },
};
