import { create } from 'zustand';
import { Station, Document, InTransitDocument, GameState } from '../types';
import axios from 'axios';

interface GameStore extends GameState {
  fetchInitialData: () => Promise<void>;
  setStations: (stations: Station[]) => void;
  setDocuments: (documents: Document[]) => void;
  setInTransitDocuments: (docs: InTransitDocument[]) => void;
  addInTransitDocument: (doc: InTransitDocument) => void;
  removeInTransitDocument: (documentId: string) => void;
  updateInTransitProgress: (documentId: string, progress: number) => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  setSalary: (salary: number) => void;
  addSalary: (amount: number) => void;
  deductSalary: (amount: number) => void;
  setCurrentTime: (time: number) => void;
  updateStation: (station: Station) => void;
  updateDocument: (document: Document) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  stations: [],
  documents: [],
  inTransitDocuments: [],
  score: 100,
  salary: 100,
  currentTime: Date.now(),

  fetchInitialData: async () => {
    try {
      const [stationsRes, stateRes] = await Promise.all([
        axios.get('http://localhost:3001/api/stations'),
        axios.get('http://localhost:3001/api/state')
      ]);
      set({
        stations: stationsRes.data,
        documents: stateRes.data.documents,
        inTransitDocuments: stateRes.data.inTransitDocuments,
        score: stateRes.data.score,
        salary: stateRes.data.salary,
        currentTime: stateRes.data.currentTime
      });
    } catch (error) {
      console.error('获取初始数据失败:', error);
    }
  },

  setStations: (stations) => set({ stations }),
  setDocuments: (documents) => set({ documents }),
  setInTransitDocuments: (inTransitDocuments) => set({ inTransitDocuments }),

  addInTransitDocument: (doc) => set((state) => ({
    inTransitDocuments: [...state.inTransitDocuments, doc]
  })),

  removeInTransitDocument: (documentId) => set((state) => ({
    inTransitDocuments: state.inTransitDocuments.filter(d => d.document.id !== documentId)
  })),

  updateInTransitProgress: (documentId, progress) => set((state) => ({
    inTransitDocuments: state.inTransitDocuments.map(d =>
      d.document.id === documentId ? { ...d, progress } : d
    )
  })),

  setScore: (score) => set({ score }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  setSalary: (salary) => set({ salary }),
  addSalary: (amount) => set((state) => ({ salary: state.salary + amount })),
  deductSalary: (amount) => set((state) => ({ salary: Math.max(0, state.salary - amount) })),
  setCurrentTime: (currentTime) => set({ currentTime }),

  updateStation: (station) => set((state) => ({
    stations: state.stations.map(s => s.id === station.id ? station : s)
  })),

  updateDocument: (document) => set((state) => ({
    documents: state.documents.map(d => d.id === document.id ? document : d)
  }))
}));
