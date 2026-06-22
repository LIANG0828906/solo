import { ProjectData, ProjectMeta, MarkData } from '@/types';
import { saveAs } from 'file-saver';

const PROJECTS_KEY = 'framemark_projects';
const PROJECT_PREFIX = 'framemark_project_';

export const MarkManager = {
  saveProject(project: ProjectData): void {
    const metas = this.loadProjectMetas();
    const idx = metas.findIndex((m) => m.id === project.id);
    const meta: ProjectMeta = {
      id: project.id,
      fileName: project.fileName,
      createdAt: project.createdAt,
      frameCount: project.frameCount,
      markCount: project.markCount,
    };
    if (idx >= 0) {
      metas[idx] = meta;
    } else {
      metas.unshift(meta);
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(metas));
    localStorage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(project));
  },

  loadProject(id: string): ProjectData | null {
    const raw = localStorage.getItem(PROJECT_PREFIX + id);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ProjectData;
    } catch {
      return null;
    }
  },

  loadProjectMetas(): ProjectMeta[] {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ProjectMeta[];
    } catch {
      return [];
    }
  },

  deleteProject(id: string): void {
    let metas = this.loadProjectMetas();
    metas = metas.filter((m) => m.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(metas));
    localStorage.removeItem(PROJECT_PREFIX + id);
  },

  exportJSON(marks: MarkData[], frames: { id: string; index: number; timestamp: number }[]): void {
    const data = frames.map((f) => {
      const mark = marks.find((m) => m.frameId === f.id);
      return {
        frameIndex: f.index,
        timestamp: f.timestamp,
        tags: mark ? mark.tags.map((t) => t.name) : [],
        rating: mark ? mark.rating : 0,
        note: mark ? mark.note : '',
      };
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'framemark_export.json');
  },

  exportCSV(marks: MarkData[], frames: { id: string; index: number; timestamp: number }[]): void {
    const header = '帧序号,时间戳,标签,评分,备注';
    const rows = frames.map((f) => {
      const mark = marks.find((m) => m.frameId === f.id);
      const tags = mark ? mark.tags.map((t) => t.name).join(';') : '';
      const rating = mark ? mark.rating : 0;
      const note = mark ? `"${mark.note.replace(/"/g, '""')}"` : '""';
      return `${f.index},${f.timestamp},${tags},${rating},${note}`;
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'framemark_export.csv');
  },
};
