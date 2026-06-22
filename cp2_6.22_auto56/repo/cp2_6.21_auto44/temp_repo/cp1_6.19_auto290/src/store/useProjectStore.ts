import { create } from 'zustand';
import type { Project, Sketch, Annotation, Version } from '@/types';
import {
  generateId,
  generateShareToken,
  addWatermark,
  generateThumbnail,
  storeBlob,
  getBlob,
  deleteBlob,
  validateFile,
} from '@/utils/fileHelpers';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  sketches: Sketch[];
  annotations: Annotation[];
  versions: Version[];
  selectedDeliveryIds: string[];
  isLoading: boolean;

  loadFromStorage: () => void;
  setCurrentProject: (id: string | null) => void;
  addProject: (name: string, clientName: string, deadline: string) => Project;
  deleteProject: (id: string) => void;
  uploadSketches: (projectId: string, files: File[]) => Promise<Sketch[]>;
  deleteSketch: (sketchId: string) => void;
  markAsFinal: (sketchId: string) => void;
  addAnnotation: (sketchId: string, x: number, y: number, text: string, authorType: 'designer' | 'client') => Annotation;
  deleteAnnotation: (annotationId: string) => void;
  markAnnotationsRead: (sketchId: string) => void;
  uploadNewVersion: (sketchId: string, file: File) => Promise<Version>;
  confirmSketch: (sketchId: string) => void;
  unconfirmSketch: (sketchId: string) => void;
  toggleDeliverySelect: (sketchId: string) => void;
  selectAllDelivery: () => void;
  clearDeliverySelection: () => void;
  getUnreadCount: (sketchId: string) => number;
  getSketchVersions: (sketchId: string) => Version[];
  getProjectSketches: (projectId: string) => Sketch[];
  getSketchAnnotations: (sketchId: string) => Annotation[];
}

const STORAGE_KEY = 'illustration_app_data';

interface StorageData {
  projects: Project[];
  sketches: Sketch[];
  annotations: Annotation[];
  versions: Version[];
}

function saveToStorage(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full, silently fail
  }
}

function loadFromStorageInternal(): StorageData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // parse error
  }
  return null;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  sketches: [],
  annotations: [],
  versions: [],
  selectedDeliveryIds: [],
  isLoading: false,

  loadFromStorage: () => {
    const data = loadFromStorageInternal();
    if (data) {
      set({
        projects: data.projects,
        sketches: data.sketches,
        annotations: data.annotations,
        versions: data.versions,
      });
    }
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  addProject: (name, clientName, deadline) => {
    const project: Project = {
      id: generateId(),
      name,
      clientName,
      deadline,
      shareToken: generateShareToken(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => {
      const projects = [...state.projects, project];
      saveToStorage({ projects, sketches: state.sketches, annotations: state.annotations, versions: state.versions });
      return { projects };
    });
    return project;
  },

  deleteProject: (id) => {
    set((state) => {
      const sketchIds = state.sketches.filter((s) => s.projectId === id).map((s) => s.id);
      const versionIds = state.versions.filter((v) => sketchIds.includes(v.sketchId)).map((v) => v.id);

      sketchIds.forEach((sid) => {
        const sketch = state.sketches.find((s) => s.id === sid);
        if (sketch) {
          deleteBlob(sketch.originalBlobKey).catch(() => {});
          deleteBlob(sketch.watermarkedBlobKey).catch(() => {});
          deleteBlob(sketch.thumbnailBlobKey).catch(() => {});
        }
      });
      versionIds.forEach((vid) => {
        const version = state.versions.find((v) => v.id === vid);
        if (version) {
          deleteBlob(version.originalBlobKey).catch(() => {});
          deleteBlob(version.watermarkedBlobKey).catch(() => {});
        }
      });

      const projects = state.projects.filter((p) => p.id !== id);
      const sketches = state.sketches.filter((s) => s.projectId !== id);
      const annotations = state.annotations.filter((a) => !sketchIds.includes(a.sketchId));
      const versions = state.versions.filter((v) => !sketchIds.includes(v.sketchId));
      saveToStorage({ projects, sketches, annotations, versions });
      return { projects, sketches, annotations, versions };
    });
  },

  uploadSketches: async (projectId, files) => {
    set({ isLoading: true });
    const newSketches: Sketch[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) continue;

      const id = generateId();
      const versionId = generateId();
      const originalKey = `orig_${id}`;
      const watermarkedKey = `wm_${id}`;
      const thumbnailKey = `thumb_${id}`;

      const watermarkedBlob = await addWatermark(file);
      const thumbnailBlob = await generateThumbnail(file);

      await storeBlob(originalKey, file);
      await storeBlob(watermarkedKey, watermarkedBlob);
      await storeBlob(thumbnailKey, thumbnailBlob);

      const sketch: Sketch = {
        id,
        projectId,
        currentVersionId: versionId,
        fileName: file.name,
        originalBlobKey: originalKey,
        watermarkedBlobKey: watermarkedKey,
        thumbnailBlobKey: thumbnailKey,
        isFinal: false,
        isConfirmed: false,
        createdAt: new Date().toISOString(),
      };

      const version: Version = {
        id: versionId,
        sketchId: id,
        versionNumber: 1,
        originalBlobKey: originalKey,
        watermarkedBlobKey: watermarkedKey,
        createdAt: new Date().toISOString(),
      };

      set((state) => {
        const sketches = [...state.sketches, sketch];
        const versions = [...state.versions, version];
        saveToStorage({ projects: state.projects, sketches, annotations: state.annotations, versions });
        return { sketches, versions };
      });

      newSketches.push(sketch);
    }

    set((state) => {
      const projects = state.projects.map((p) =>
        p.id === projectId ? { ...p, updatedAt: new Date().toISOString() } : p
      );
      saveToStorage({ projects, sketches: state.sketches, annotations: state.annotations, versions: state.versions });
      return { projects, isLoading: false };
    });

    return newSketches;
  },

  deleteSketch: (sketchId) => {
    set((state) => {
      const sketch = state.sketches.find((s) => s.id === sketchId);
      if (sketch) {
        deleteBlob(sketch.originalBlobKey).catch(() => {});
        deleteBlob(sketch.watermarkedBlobKey).catch(() => {});
        deleteBlob(sketch.thumbnailBlobKey).catch(() => {});
      }
      state.versions
        .filter((v) => v.sketchId === sketchId)
        .forEach((v) => {
          deleteBlob(v.originalBlobKey).catch(() => {});
          deleteBlob(v.watermarkedBlobKey).catch(() => {});
        });

      const sketches = state.sketches.filter((s) => s.id !== sketchId);
      const annotations = state.annotations.filter((a) => a.sketchId !== sketchId);
      const versions = state.versions.filter((v) => v.sketchId !== sketchId);
      const selectedDeliveryIds = state.selectedDeliveryIds.filter((id) => id !== sketchId);
      saveToStorage({ projects: state.projects, sketches, annotations, versions });
      return { sketches, annotations, versions, selectedDeliveryIds };
    });
  },

  markAsFinal: (sketchId) => {
    set((state) => {
      const sketches = state.sketches.map((s) =>
        s.id === sketchId ? { ...s, isFinal: true } : s
      );
      saveToStorage({ projects: state.projects, sketches, annotations: state.annotations, versions: state.versions });
      return { sketches };
    });
  },

  addAnnotation: (sketchId, x, y, text, authorType) => {
    const annotation: Annotation = {
      id: generateId(),
      sketchId,
      x,
      y,
      text,
      authorType,
      isRead: authorType === 'designer',
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const annotations = [...state.annotations, annotation];
      saveToStorage({ projects: state.projects, sketches: state.sketches, annotations, versions: state.versions });
      return { annotations };
    });
    return annotation;
  },

  deleteAnnotation: (annotationId) => {
    set((state) => {
      const annotations = state.annotations.filter((a) => a.id !== annotationId);
      saveToStorage({ projects: state.projects, sketches: state.sketches, annotations, versions: state.versions });
      return { annotations };
    });
  },

  markAnnotationsRead: (sketchId) => {
    set((state) => {
      const annotations = state.annotations.map((a) =>
        a.sketchId === sketchId ? { ...a, isRead: true } : a
      );
      saveToStorage({ projects: state.projects, sketches: state.sketches, annotations, versions: state.versions });
      return { annotations };
    });
  },

  uploadNewVersion: async (sketchId, file) => {
    const validation = validateFile(file);
    if (!validation.valid) throw new Error(validation.error);

    const state = get();
    const sketch = state.sketches.find((s) => s.id === sketchId);
    if (!sketch) throw new Error('Sketch not found');

    const versionId = generateId();
    const originalKey = `orig_v${versionId}`;
    const watermarkedKey = `wm_v${versionId}`;

    const watermarkedBlob = await addWatermark(file);

    await storeBlob(originalKey, file);
    await storeBlob(watermarkedKey, watermarkedBlob);

    const thumbnailBlob = await generateThumbnail(file);
    await storeBlob(sketch.thumbnailBlobKey, thumbnailBlob);

    const versionCount = state.versions.filter((v) => v.sketchId === sketchId).length;

    const version: Version = {
      id: versionId,
      sketchId,
      versionNumber: versionCount + 1,
      originalBlobKey: originalKey,
      watermarkedBlobKey: watermarkedKey,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const sketches = state.sketches.map((s) =>
        s.id === sketchId
          ? {
              ...s,
              currentVersionId: versionId,
              originalBlobKey: originalKey,
              watermarkedBlobKey: watermarkedKey,
            }
          : s
      );
      const versions = [...state.versions, version];
      saveToStorage({ projects: state.projects, sketches, annotations: state.annotations, versions });
      return { sketches, versions };
    });

    return version;
  },

  confirmSketch: (sketchId) => {
    set((state) => {
      const sketches = state.sketches.map((s) =>
        s.id === sketchId ? { ...s, isConfirmed: true } : s
      );
      saveToStorage({ projects: state.projects, sketches, annotations: state.annotations, versions: state.versions });
      return { sketches };
    });
  },

  unconfirmSketch: (sketchId) => {
    set((state) => {
      const sketches = state.sketches.map((s) =>
        s.id === sketchId ? { ...s, isConfirmed: false } : s
      );
      const selectedDeliveryIds = state.selectedDeliveryIds.filter((id) => id !== sketchId);
      saveToStorage({ projects: state.projects, sketches, annotations: state.annotations, versions: state.versions });
      return { sketches, selectedDeliveryIds };
    });
  },

  toggleDeliverySelect: (sketchId) => {
    set((state) => {
      const selectedDeliveryIds = state.selectedDeliveryIds.includes(sketchId)
        ? state.selectedDeliveryIds.filter((id) => id !== sketchId)
        : [...state.selectedDeliveryIds, sketchId];
      return { selectedDeliveryIds };
    });
  },

  selectAllDelivery: () => {
    const state = get();
    const confirmedIds = state.sketches
      .filter((s) => s.projectId === state.currentProjectId && s.isConfirmed)
      .map((s) => s.id);
    set({ selectedDeliveryIds: confirmedIds });
  },

  clearDeliverySelection: () => set({ selectedDeliveryIds: [] }),

  getUnreadCount: (sketchId) => {
    return get().annotations.filter((a) => a.sketchId === sketchId && !a.isRead).length;
  },

  getSketchVersions: (sketchId) => {
    return get().versions.filter((v) => v.sketchId === sketchId).sort((a, b) => a.versionNumber - b.versionNumber);
  },

  getProjectSketches: (projectId) => {
    return get().sketches.filter((s) => s.projectId === projectId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getSketchAnnotations: (sketchId) => {
    return get().annotations.filter((a) => a.sketchId === sketchId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));
