import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import type { Exercise, TrainingRecord, TrainingTemplate, ExerciseCategory, TemplateExercise } from './types';

interface ExerciseStoreState {
  exercises: Exercise[];
  trainingRecords: TrainingRecord[];
  templates: TrainingTemplate[];
  searchQuery: string;
  filterCategory: ExerciseCategory | 'all';
  loading: boolean;
  deletingRecordId: string | null;
}

interface ExerciseStoreActions {
  init: () => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => void;
  deleteExercise: (id: string) => void;
  addTrainingRecord: (record: Omit<TrainingRecord, 'id' | 'createdAt'>) => void;
  deleteTrainingRecord: (id: string) => Promise<void>;
  addTemplate: (template: Omit<TrainingTemplate, 'id' | 'createdAt'>) => void;
  deleteTemplate: (id: string) => void;
  loadTemplate: (templateId: string) => TemplateExercise[];
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: ExerciseCategory | 'all') => void;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
}

export type ExerciseStore = ExerciseStoreState & ExerciseStoreActions;

const STORAGE_KEYS = {
  EXERCISES: 'fitscribe_exercises',
  TRAINING_RECORDS: 'fitscribe_training_records',
  TEMPLATES: 'fitscribe_templates',
};

const saveExercises = async (exercises: Exercise[]) => {
  await set(STORAGE_KEYS.EXERCISES, exercises);
};

const saveTrainingRecords = async (trainingRecords: TrainingRecord[]) => {
  await set(STORAGE_KEYS.TRAINING_RECORDS, trainingRecords);
};

const saveTemplates = async (templates: TrainingTemplate[]) => {
  await set(STORAGE_KEYS.TEMPLATES, templates);
};

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  exercises: [],
  trainingRecords: [],
  templates: [],
  searchQuery: '',
  filterCategory: 'all',
  loading: true,
  deletingRecordId: null,

  init: async () => {
    try {
      const [exercises, trainingRecords, templates] = await Promise.all([
        get<Exercise[]>(STORAGE_KEYS.EXERCISES),
        get<TrainingRecord[]>(STORAGE_KEYS.TRAINING_RECORDS),
        get<TrainingTemplate[]>(STORAGE_KEYS.TEMPLATES),
      ]);

      set({
        exercises: exercises || [],
        trainingRecords: trainingRecords || [],
        templates: templates || [],
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load data from IndexedDB:', error);
      set({ loading: false });
    }
  },

  addExercise: (exercise) => {
    const newExercise: Exercise = {
      ...exercise,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    const exercises = [...get().exercises, newExercise];
    set({ exercises });
    saveExercises(exercises);
  },

  deleteExercise: (id) => {
    const exercises = get().exercises.filter((e) => e.id !== id);
    set({ exercises });
    saveExercises(exercises);
  },

  addTrainingRecord: (record) => {
    const newRecord: TrainingRecord = {
      ...record,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    const trainingRecords = [...get().trainingRecords, newRecord];
    set({ trainingRecords });
    saveTrainingRecords(trainingRecords);
  },

  deleteTrainingRecord: async (id) => {
    set({ deletingRecordId: id });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const trainingRecords = get().trainingRecords.filter((r) => r.id !== id);
    set({ trainingRecords, deletingRecordId: null });
    saveTrainingRecords(trainingRecords);
  },

  addTemplate: (template) => {
    const newTemplate: TrainingTemplate = {
      ...template,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    const templates = [...get().templates, newTemplate];
    set({ templates });
    saveTemplates(templates);
  },

  deleteTemplate: (id) => {
    const templates = get().templates.filter((t) => t.id !== id);
    set({ templates });
    saveTemplates(templates);
  },

  loadTemplate: (templateId) => {
    const template = get().templates.find((t) => t.id === templateId);
    return template?.exercises || [];
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setFilterCategory: (category) => {
    set({ filterCategory: category });
  },

  exportData: async () => {
    const { exercises, trainingRecords, templates } = get();
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exercises,
      trainingRecords,
      templates,
    };
    return JSON.stringify(data, null, 2);
  },

  importData: async (dataStr) => {
    try {
      const data = JSON.parse(dataStr);
      const { exercises, trainingRecords, templates } = data;

      if (Array.isArray(exercises)) {
        set({ exercises });
        await saveExercises(exercises);
      }
      if (Array.isArray(trainingRecords)) {
        set({ trainingRecords });
        await saveTrainingRecords(trainingRecords);
      }
      if (Array.isArray(templates)) {
        set({ templates });
        await saveTemplates(templates);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('导入数据失败，请检查文件格式');
    }
  },
}));
