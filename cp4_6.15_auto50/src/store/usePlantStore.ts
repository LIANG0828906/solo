import { create } from 'zustand';
import type {
  Plant,
  SymptomRecord,
  DiagnosisResult,
  PlantLocation,
  MatchedCause,
} from '@/utils/db';
import {
  getPlants,
  savePlant as dbSavePlant,
  updatePlant as dbUpdatePlant,
  deletePlant as dbDeletePlant,
  getSymptomRecords,
  saveSymptomRecord as dbSaveSymptomRecord,
  getDiagnosisResults,
  saveDiagnosisResult as dbSaveDiagnosisResult,
} from '@/utils/db';
import { v4 as uuidv4 } from 'uuid';

const PAGE_SIZE = 10;

interface PlantStore {
  plants: Plant[];
  symptomRecords: SymptomRecord[];
  diagnosisResults: DiagnosisResult[];
  currentPlantId: string | null;
  searchQuery: string;
  locationFilter: PlantLocation | '全部';
  listPage: number;
  listHasMore: boolean;

  loadAllData: () => void;
  setCurrentPlantId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setLocationFilter: (filter: PlantLocation | '全部') => void;
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt'>) => Plant;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  addSymptomRecord: (record: Omit<SymptomRecord, 'id' | 'createdAt'>) => SymptomRecord;
  addDiagnosisResult: (result: Omit<DiagnosisResult, 'id'>) => DiagnosisResult;
  confirmDiagnosis: (id: string) => void;
  loadMorePlants: () => void;
  getFilteredPlants: () => Plant[];
  getPlantDiagnoses: (plantId: string) => DiagnosisResult[];
  getPlantSymptoms: (plantId: string) => SymptomRecord[];
}

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  symptomRecords: [],
  diagnosisResults: [],
  currentPlantId: null,
  searchQuery: '',
  locationFilter: '全部',
  listPage: 1,
  listHasMore: true,

  loadAllData: () => {
    const plants = getPlants();
    const symptomRecords = getSymptomRecords();
    const diagnosisResults = getDiagnosisResults();
    set({
      plants,
      symptomRecords,
      diagnosisResults,
      listPage: 1,
      listHasMore: plants.length > PAGE_SIZE,
    });
  },

  setCurrentPlantId: (id) => set({ currentPlantId: id }),

  setSearchQuery: (query) => set({ searchQuery: query, listPage: 1 }),

  setLocationFilter: (filter) => set({ locationFilter: filter, listPage: 1 }),

  addPlant: (plantData) => {
    const newPlant = dbSavePlant(plantData);
    set((state) => ({
      plants: [...state.plants, newPlant],
      listHasMore: state.plants.length + 1 > state.listPage * PAGE_SIZE,
    }));
    return newPlant;
  },

  updatePlant: (id, updates) => {
    dbUpdatePlant(id, updates);
    set((state) => ({
      plants: state.plants.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  deletePlant: (id) => {
    dbDeletePlant(id);
    set((state) => ({
      plants: state.plants.filter((p) => p.id !== id),
      symptomRecords: state.symptomRecords.filter((r) => r.plantId !== id),
      diagnosisResults: state.diagnosisResults.filter((d) => d.plantId !== id),
      currentPlantId: state.currentPlantId === id ? null : state.currentPlantId,
    }));
  },

  addSymptomRecord: (recordData) => {
    const newRecord = dbSaveSymptomRecord(recordData);
    set((state) => ({
      symptomRecords: [...state.symptomRecords, newRecord],
    }));
    return newRecord;
  },

  addDiagnosisResult: (resultData) => {
    const newResult = dbSaveDiagnosisResult(resultData);
    set((state) => ({
      diagnosisResults: [...state.diagnosisResults, newResult],
    }));
    return newResult;
  },

  confirmDiagnosis: (id) => {
    set((state) => ({
      diagnosisResults: state.diagnosisResults.map((d) =>
        d.id === id ? { ...d, confirmed: true } : d,
      ),
    }));
    const result = get().diagnosisResults.find((d) => d.id === id);
    if (result) {
      dbUpdatePlant(result.plantId, { lastDiagnosisDate: new Date().toISOString() });
    }
    const updatedResults = get().diagnosisResults;
    const storageResults = getDiagnosisResults();
    const updatedStorage = storageResults.map((d) =>
      d.id === id ? { ...d, confirmed: true } : d,
    );
    localStorage.setItem('plant_doctor_diagnoses', JSON.stringify(updatedStorage));
  },

  loadMorePlants: () => {
    set((state) => {
      const nextPage = state.listPage + 1;
      const filtered = get().getFilteredPlants();
      return {
        listPage: nextPage,
        listHasMore: filtered.length > nextPage * PAGE_SIZE,
      };
    });
  },

  getFilteredPlants: () => {
    const { plants, searchQuery, locationFilter } = get();
    let filtered = plants;
    if (locationFilter !== '全部') {
      filtered = filtered.filter((p) => p.location === locationFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }
    return filtered;
  },

  getPlantDiagnoses: (plantId) => {
    return get().diagnosisResults.filter((d) => d.plantId === plantId);
  },

  getPlantSymptoms: (plantId) => {
    return get().symptomRecords.filter((r) => r.plantId === plantId);
  },
}));
