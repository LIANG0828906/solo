import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import type {
  Exercise,
  TrainingRecord,
  TrainingTemplate,
  ExerciseCategory,
  TemplateExercise,
  LogFormState,
  LogFormExercise,
  SearchIndex,
} from './types';

interface ExerciseStoreState {
  exercises: Exercise[];
  trainingRecords: TrainingRecord[];
  templates: TrainingTemplate[];
  searchQuery: string;
  debouncedSearchQuery: string;
  filterCategory: ExerciseCategory | 'all';
  loading: boolean;
  deletingRecordId: string | null;
  searchIndex: SearchIndex | null;
  logForm: LogFormState;
  filteredExercisesCache: Exercise[] | null;
  cacheKey: string | null;
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
  applyTemplate: (templateId: string) => void;
  setSearchQuery: (query: string) => void;
  setDebouncedSearchQuery: (query: string) => void;
  setFilterCategory: (category: ExerciseCategory | 'all') => void;
  filterExercises: () => Exercise[];
  rebuildSearchIndex: () => void;
  setLogFormDate: (date: string) => void;
  setLogFormTime: (time: string) => void;
  addLogFormExercise: (exercise: LogFormExercise) => void;
  updateLogFormExercise: (index: number, field: keyof LogFormExercise, value: number | string) => void;
  removeLogFormExercise: (index: number) => void;
  resetLogForm: () => void;
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

const getDefaultDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
};

const buildSearchIndex = (exercises: Exercise[]): SearchIndex => {
  const nameIndex = new Map<string, string[]>();
  const categoryIndex = new Map<string, string[]>();
  const exerciseMap = new Map<string, Exercise>();

  exercises.forEach((exercise) => {
    exerciseMap.set(exercise.id, exercise);

    const nameLower = exercise.name.toLowerCase();
    for (let i = 0; i < nameLower.length; i++) {
      const prefix = nameLower.slice(0, i + 1);
      if (!nameIndex.has(prefix)) {
        nameIndex.set(prefix, []);
      }
      nameIndex.get(prefix)!.push(exercise.id);
    }

    if (!categoryIndex.has(exercise.category)) {
      categoryIndex.set(exercise.category, []);
    }
    categoryIndex.get(exercise.category)!.push(exercise.id);
  });

  return { nameIndex, categoryIndex, exerciseMap };
};

export const useExerciseStore = create<ExerciseStore>((set, get) => {
  const { date: defaultDate, time: defaultTime } = getDefaultDateTime();

  return {
    exercises: [],
    trainingRecords: [],
    templates: [],
    searchQuery: '',
    debouncedSearchQuery: '',
    filterCategory: 'all',
    loading: true,
    deletingRecordId: null,
    searchIndex: null,
    filteredExercisesCache: null,
    cacheKey: null,
    logForm: {
      date: defaultDate,
      time: defaultTime,
      exercises: [],
    },

    init: async () => {
      try {
        const [exercises, trainingRecords, templates] = await Promise.all([
          get<Exercise[]>(STORAGE_KEYS.EXERCISES),
          get<TrainingRecord[]>(STORAGE_KEYS.TRAINING_RECORDS),
          get<TrainingTemplate[]>(STORAGE_KEYS.TEMPLATES),
        ]);

        const exerciseList = Array.isArray(exercises) ? exercises : [];
        const recordList = Array.isArray(trainingRecords) ? trainingRecords : [];
        const templateList = Array.isArray(templates) ? templates : [];

        set({
          exercises: exerciseList,
          trainingRecords: recordList,
          templates: templateList,
          loading: false,
          searchIndex: buildSearchIndex(exerciseList),
          filteredExercisesCache: null,
          cacheKey: null,
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
      set({
        exercises,
        searchIndex: buildSearchIndex(exercises),
        filteredExercisesCache: null,
        cacheKey: null,
      });
      saveExercises(exercises);
    },

    deleteExercise: (id) => {
      const exercises = get().exercises.filter((e) => e.id !== id);
      set({
        exercises,
        searchIndex: buildSearchIndex(exercises),
        filteredExercisesCache: null,
        cacheKey: null,
      });
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

    applyTemplate: (templateId) => {
      const template = get().templates.find((t) => t.id === templateId);
      if (!template) return;

      const exercises: LogFormExercise[] = template.exercises.map((te) => ({
        exerciseId: te.exerciseId,
        exerciseName: te.exerciseName,
        category: te.category,
        sets: te.defaultSets,
        reps: te.defaultReps,
        weight: te.defaultWeight,
      }));

      const { date, time } = getDefaultDateTime();
      set({
        logForm: {
          date,
          time,
          exercises,
        },
      });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    setDebouncedSearchQuery: (query) => {
      set({
        debouncedSearchQuery: query,
        filteredExercisesCache: null,
        cacheKey: null,
      });
    },

    setFilterCategory: (category) => {
      set({
        filterCategory: category,
        filteredExercisesCache: null,
        cacheKey: null,
      });
    },

    rebuildSearchIndex: () => {
      set({
        searchIndex: buildSearchIndex(get().exercises),
        filteredExercisesCache: null,
        cacheKey: null,
      });
    },

    filterExercises: () => {
      const state = get();
      const { debouncedSearchQuery: query, filterCategory, exercises, searchIndex, filteredExercisesCache, cacheKey } = state;

      const newCacheKey = `${query}:${filterCategory}:${exercises.length}`;
      if (filteredExercisesCache && cacheKey === newCacheKey) {
        return filteredExercisesCache;
      }

      let resultIds: Set<string> | null = null;

      if (searchIndex && query.trim()) {
        const queryLower = query.toLowerCase().trim();
        const matchedIds = searchIndex.nameIndex.get(queryLower);
        if (matchedIds) {
          resultIds = new Set(matchedIds);
        } else {
          const allIds: string[] = [];
          searchIndex.nameIndex.forEach((ids, prefix) => {
            if (prefix.includes(queryLower)) {
              allIds.push(...ids);
            }
          });
          resultIds = new Set(allIds);
        }
      }

      let categoryIds: Set<string> | null = null;
      if (searchIndex && filterCategory !== 'all') {
        const catIds = searchIndex.categoryIndex.get(filterCategory);
        categoryIds = new Set(catIds || []);
      }

      let result: Exercise[];

      if (!searchIndex) {
        result = exercises.filter((e) => {
          const matchesName = !query.trim() || e.name.toLowerCase().includes(query.toLowerCase().trim());
          const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
          return matchesName && matchesCategory;
        });
      } else {
        let finalIds: Set<string>;

        if (resultIds && categoryIds) {
          finalIds = new Set([...resultIds].filter((id) => categoryIds!.has(id)));
        } else if (resultIds) {
          finalIds = resultIds;
        } else if (categoryIds) {
          finalIds = categoryIds;
        } else {
          finalIds = new Set(exercises.map((e) => e.id));
        }

        result = [...finalIds].map((id) => searchIndex.exerciseMap.get(id)!).filter(Boolean);
      }

      result.sort((a, b) => b.createdAt - a.createdAt);

      set({
        filteredExercisesCache: result,
        cacheKey: newCacheKey,
      });

      return result;
    },

    setLogFormDate: (date) => {
      set((state) => ({
        logForm: { ...state.logForm, date },
      }));
    },

    setLogFormTime: (time) => {
      set((state) => ({
        logForm: { ...state.logForm, time },
      }));
    },

    addLogFormExercise: (exercise) => {
      set((state) => ({
        logForm: {
          ...state.logForm,
          exercises: [...state.logForm.exercises, exercise],
        },
      }));
    },

    updateLogFormExercise: (index, field, value) => {
      set((state) => {
        const newExercises = [...state.logForm.exercises];
        if (newExercises[index]) {
          (newExercises[index] as any)[field] = value;
        }
        return {
          logForm: {
            ...state.logForm,
            exercises: newExercises,
          },
        };
      });
    },

    removeLogFormExercise: (index) => {
      set((state) => ({
        logForm: {
          ...state.logForm,
          exercises: state.logForm.exercises.filter((_, i) => i !== index),
        },
      }));
    },

    resetLogForm: () => {
      const { date, time } = getDefaultDateTime();
      set({
        logForm: {
          date,
          time,
          exercises: [],
        },
      });
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

        let newExercises = get().exercises;
        let newTrainingRecords = get().trainingRecords;
        let newTemplates = get().templates;

        if (Array.isArray(exercises)) {
          newExercises = exercises;
          set({ exercises: newExercises });
          await saveExercises(newExercises);
        }
        if (Array.isArray(trainingRecords)) {
          newTrainingRecords = trainingRecords;
          set({ trainingRecords: newTrainingRecords });
          await saveTrainingRecords(newTrainingRecords);
        }
        if (Array.isArray(templates)) {
          newTemplates = templates;
          set({ templates: newTemplates });
          await saveTemplates(newTemplates);
        }

        set({
          searchIndex: buildSearchIndex(newExercises),
          filteredExercisesCache: null,
          cacheKey: null,
        });
      } catch (error) {
        console.error('Failed to import data:', error);
        throw new Error('导入数据失败，请检查文件格式');
      }
    },
  };
});
