import { v4 as uuidv4 } from 'uuid';
import type { ProjectState, VideoMetadata, Chapter, Transition, CropRange } from '../types';

class MemoryStore {
  private projects: Map<string, ProjectState> = new Map();
  private videos: Map<string, VideoMetadata> = new Map();
  private latestProjectId: string | null = null;

  createProject(): ProjectState {
    const project: ProjectState = {
      id: uuidv4(),
      videoId: null,
      videoMetadata: null,
      cropRange: { start: 0, end: 0 },
      transitions: [],
      chapters: [],
      lastSaved: Date.now(),
      createdAt: Date.now(),
    };
    this.projects.set(project.id, project);
    this.latestProjectId = project.id;
    return project;
  }

  getProject(id: string): ProjectState | undefined {
    return this.projects.get(id);
  }

  getLatestProject(): ProjectState | undefined {
    if (!this.latestProjectId) return undefined;
    return this.projects.get(this.latestProjectId);
  }

  updateProject(id: string, updates: Partial<ProjectState>): ProjectState | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updated: ProjectState = { ...project, ...updates, lastSaved: Date.now() };
    this.projects.set(id, updated);
    return updated;
  }

  setProjectVideo(projectId: string, metadata: VideoMetadata): ProjectState | undefined {
    return this.updateProject(projectId, {
      videoId: metadata.id,
      videoMetadata: metadata,
      cropRange: { start: 0, end: metadata.duration },
    });
  }

  updateCropRange(projectId: string, range: CropRange): ProjectState | undefined {
    return this.updateProject(projectId, { cropRange: range });
  }

  addTransition(projectId: string, transition: Transition): ProjectState | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;
    const transitions = [...project.transitions, transition];
    return this.updateProject(projectId, { transitions });
  }

  removeTransition(projectId: string, transitionId: string): ProjectState | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;
    const transitions = project.transitions.filter((t) => t.id !== transitionId);
    return this.updateProject(projectId, { transitions });
  }

  updateTransitions(projectId: string, transitions: Transition[]): ProjectState | undefined {
    return this.updateProject(projectId, { transitions });
  }

  setChapters(projectId: string, chapters: Chapter[]): ProjectState | undefined {
    return this.updateProject(projectId, { chapters });
  }

  addVideo(metadata: VideoMetadata): void {
    this.videos.set(metadata.id, metadata);
  }

  getVideo(id: string): VideoMetadata | undefined {
    return this.videos.get(id);
  }
}

export const store = new MemoryStore();
