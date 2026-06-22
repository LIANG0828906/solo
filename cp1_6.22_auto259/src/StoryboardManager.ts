import { v4 as uuidv4 } from 'uuid';
import type { Project, Chapter, Panel, ChapterStatus } from './types';

export const STORYBOARD_CHANGED_EVENT = 'storyboard:changed';

export class StoryboardManager {
  private projects: Map<string, Project> = new Map();
  private chapters: Map<string, Chapter> = new Map();
  private panels: Map<string, Panel> = new Map();
  private currentProjectId: string | null = null;

  constructor() {
    this.initializeMockData();
  }

  private emitChanged(): void {
    document.dispatchEvent(new CustomEvent(STORYBOARD_CHANGED_EVENT));
  }

  private initializeMockData(): void {
    const projectId = uuidv4();
    this.projects.set(projectId, {
      id: projectId,
      title: '星海征程',
      createdAt: new Date().toISOString(),
    });
    this.currentProjectId = projectId;

    const chaptersData: Array<Omit<Chapter, 'id' | 'projectId' | 'createdAt'>> = [
      { title: '第一章：启程', pageCount: 6, status: 'completed', orderIndex: 0 },
      { title: '第二章：迷雾星域', pageCount: 6, status: 'serializing', orderIndex: 1 },
      { title: '第三章：归航之约', pageCount: 6, status: 'draft', orderIndex: 2 },
    ];

    const chapterIds: string[] = [];
    chaptersData.forEach((ch) => {
      const id = uuidv4();
      this.chapters.set(id, {
        ...ch,
        id,
        projectId,
        createdAt: new Date().toISOString(),
      });
      chapterIds.push(id);
    });

    const panelContents = [
      { dialogueText: '终于……终于等到这一天了！', notes: '主角仰望星空，特写镜头', charIdx: [0] },
      { dialogueText: '指挥官，飞船系统已全部就绪，随时可以出发。', notes: '舰桥全景', charIdx: [1] },
      { dialogueText: '「星海号，启航目标：半人马座α星！」', notes: '飞船驶离轨道', charIdx: [0, 1] },
      { dialogueText: '前方检测到异常能量波动，是否绕行？', notes: '雷达屏幕特写', charIdx: [2] },
      { dialogueText: '不，这可能是我们要找的信号……全舰一级战备！', notes: '指挥官决断神情', charIdx: [0] },
      { dialogueText: '不管前方是什么，我们都已经没有退路了。', notes: '主角与船员并肩', charIdx: [0, 1, 2] },
    ];

    chapterIds.forEach((cid, ci) => {
      for (let i = 0; i < 6; i++) {
        const pid = uuidv4();
        const content = panelContents[(ci + i) % panelContents.length];
        this.panels.set(pid, {
          id: pid,
          chapterId: cid,
          gridIndex: i,
          dialogueText: content.dialogueText,
          notes: content.notes,
          characterIds: content.charIdx.map((idx) => `mock-char-${idx}`),
        });
      }
    });
  }

  getProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  getCurrentProject(): Project | null {
    return this.currentProjectId ? this.projects.get(this.currentProjectId) ?? null : null;
  }

  setCurrentProject(projectId: string): void {
    if (this.projects.has(projectId)) {
      this.currentProjectId = projectId;
      this.emitChanged();
    }
  }

  addProject(title: string): Project {
    const id = uuidv4();
    const project: Project = {
      id,
      title,
      createdAt: new Date().toISOString(),
    };
    this.projects.set(id, project);
    this.currentProjectId = id;
    this.emitChanged();
    return project;
  }

  removeProject(projectId: string): void {
    this.projects.delete(projectId);
    Array.from(this.chapters.values())
      .filter((c) => c.projectId === projectId)
      .forEach((c) => {
        this.chapters.delete(c.id);
        Array.from(this.panels.values())
          .filter((p) => p.chapterId === c.id)
          .forEach((p) => this.panels.delete(p.id));
      });
    if (this.currentProjectId === projectId) {
      const firstKey = this.projects.keys().next().value;
      this.currentProjectId = this.projects.size > 0 && firstKey ? firstKey : null;
    }
    this.emitChanged();
  }

  getChapters(projectId: string): Chapter[] {
    return Array.from(this.chapters.values())
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  addChapter(projectId: string, title: string, status: ChapterStatus = 'draft'): Chapter {
    const projectChapters = this.getChapters(projectId);
    const id = uuidv4();
    const chapter: Chapter = {
      id,
      projectId,
      title,
      pageCount: 6,
      status,
      orderIndex: projectChapters.length,
      createdAt: new Date().toISOString(),
    };
    this.chapters.set(id, chapter);
    for (let i = 0; i < 6; i++) {
      const pid = uuidv4();
      this.panels.set(pid, {
        id: pid,
        chapterId: id,
        gridIndex: i,
        dialogueText: '',
        notes: '',
        characterIds: [],
      });
    }
    this.emitChanged();
    return chapter;
  }

  updateChapter(chapterId: string, updates: Partial<Omit<Chapter, 'id' | 'projectId' | 'createdAt'>>): void {
    const chapter = this.chapters.get(chapterId);
    if (chapter) {
      this.chapters.set(chapterId, { ...chapter, ...updates });
      this.emitChanged();
    }
  }

  removeChapter(chapterId: string): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return;
    this.chapters.delete(chapterId);
    Array.from(this.panels.values())
      .filter((p) => p.chapterId === chapterId)
      .forEach((p) => this.panels.delete(p.id));
    const remaining = this.getChapters(chapter.projectId);
    remaining.forEach((c, idx) => {
      if (c.orderIndex !== idx) {
        this.chapters.set(c.id, { ...c, orderIndex: idx });
      }
    });
    this.emitChanged();
  }

  getPanels(chapterId: string): Panel[] {
    return Array.from(this.panels.values())
      .filter((p) => p.chapterId === chapterId)
      .sort((a, b) => a.gridIndex - b.gridIndex);
  }

  getPanel(panelId: string): Panel | null {
    return this.panels.get(panelId) ?? null;
  }

  updatePanel(panelId: string, updates: Partial<Omit<Panel, 'id' | 'chapterId' | 'gridIndex'>>): void {
    const panel = this.panels.get(panelId);
    if (panel) {
      this.panels.set(panelId, { ...panel, ...updates });
      this.emitChanged();
    }
  }

  removeCharacterFromAllPanels(characterId: string): void {
    let changed = false;
    this.panels.forEach((panel) => {
      if (panel.characterIds.includes(characterId)) {
        this.panels.set(panel.id, {
          ...panel,
          characterIds: panel.characterIds.filter((id) => id !== characterId),
        });
        changed = true;
      }
    });
    if (changed) this.emitChanged();
  }
}

export const storyboardManager = new StoryboardManager();
