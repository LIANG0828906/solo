import type { Chapter, Panel } from './types';
import { storyboardManager } from './StoryboardManager';
import { characterManager } from './CharacterManager';

export interface TimelineChapter {
  chapter: Chapter;
  panels: Panel[];
}

export interface PlayerState {
  isPlaying: boolean;
  currentChapterId: string | null;
  currentPanelIndex: number;
  expandedChapterIds: Set<string>;
}

export class TimelinePlayer {
  private state: PlayerState = {
    isPlaying: false,
    currentChapterId: null,
    currentPanelIndex: 0,
    expandedChapterIds: new Set<string>(),
  };

  private playTimer: number | null = null;
  private onStateChange: (() => void) | null = null;

  setStateChangeListener(listener: (() => void) | null): void {
    this.onStateChange = listener;
  }

  private notifyChange(): void {
    this.onStateChange?.();
  }

  getTimeline(projectId: string): TimelineChapter[] {
    const chapters = storyboardManager.getChapters(projectId);
    return chapters.map((chapter) => ({
      chapter,
      panels: storyboardManager.getPanels(chapter.id),
    }));
  }

  getState(): PlayerState {
    return { ...this.state, expandedChapterIds: new Set(this.state.expandedChapterIds) };
  }

  toggleChapter(chapterId: string): void {
    if (this.state.expandedChapterIds.has(chapterId)) {
      this.state.expandedChapterIds.delete(chapterId);
    } else {
      this.state.expandedChapterIds.add(chapterId);
    }
    this.notifyChange();
  }

  isChapterExpanded(chapterId: string): boolean {
    return this.state.expandedChapterIds.has(chapterId);
  }

  selectChapter(chapterId: string): void {
    this.state.currentChapterId = chapterId;
    this.state.currentPanelIndex = 0;
    this.stopPlaying();
    this.notifyChange();
  }

  setCurrentPanelIndex(index: number): void {
    this.state.currentPanelIndex = index;
    this.notifyChange();
  }

  getCurrentPanels(chapterId: string): Panel[] {
    return storyboardManager.getPanels(chapterId);
  }

  getCurrentPanel(chapterId: string, panelIndex: number): Panel | null {
    const panels = this.getCurrentPanels(chapterId);
    return panels[panelIndex] ?? null;
  }

  getPanelCharacterNames(panel: Panel): string[] {
    return panel.characterIds.map((id) => characterManager.getCharacterName(id));
  }

  getPanelCharacterColors(panel: Panel): string[] {
    return panel.characterIds.map((id) => characterManager.getCharacterColor(id));
  }

  startPlaying(chapterId: string): void {
    if (this.playTimer !== null) return;
    this.state.currentChapterId = chapterId;
    this.state.currentPanelIndex = 0;
    this.state.isPlaying = true;
    this.notifyChange();

    this.playTimer = window.setInterval(() => {
      const panels = this.getCurrentPanels(chapterId);
      if (this.state.currentPanelIndex < panels.length - 1) {
        this.state.currentPanelIndex++;
        this.notifyChange();
      } else {
        this.stopPlaying();
      }
    }, 2000);
  }

  stopPlaying(): void {
    if (this.playTimer !== null) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    if (this.state.isPlaying) {
      this.state.isPlaying = false;
      this.notifyChange();
    }
  }

  nextPanel(): boolean {
    if (!this.state.currentChapterId) return false;
    const panels = this.getCurrentPanels(this.state.currentChapterId);
    if (this.state.currentPanelIndex < panels.length - 1) {
      this.state.currentPanelIndex++;
      this.notifyChange();
      return true;
    }
    return false;
  }

  prevPanel(): boolean {
    if (this.state.currentPanelIndex > 0) {
      this.state.currentPanelIndex--;
      this.notifyChange();
      return true;
    }
    return false;
  }

  cleanup(): void {
    this.stopPlaying();
    this.onStateChange = null;
  }
}

export const timelinePlayer = new TimelinePlayer();
