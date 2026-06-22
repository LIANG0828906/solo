import { create } from 'zustand';
import { Student, AssessmentRecord, RankingItem, StudentScore, CategoryType, GradeType, CATEGORY_CONFIG } from './types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_STUDENTS: Student[] = [
  { id: '1', name: '张子明', seatRow: 0, seatCol: 0 },
  { id: '2', name: '李道纯', seatRow: 0, seatCol: 1 },
  { id: '3', name: '王思义', seatRow: 0, seatCol: 2 },
  { id: '4', name: '赵景行', seatRow: 0, seatCol: 3 },
  { id: '5', name: '刘居仁', seatRow: 1, seatCol: 0 },
  { id: '6', name: '陈敬之', seatRow: 1, seatCol: 1 },
  { id: '7', name: '杨伯达', seatRow: 1, seatCol: 2 },
  { id: '8', name: '黄叔度', seatRow: 1, seatCol: 3 },
  { id: '9', name: '周茂叔', seatRow: 2, seatCol: 0 },
  { id: '10', name: '吴季子', seatRow: 2, seatCol: 1 },
  { id: '11', name: '郑子产', seatRow: 2, seatCol: 2 },
  { id: '12', name: '孙明复', seatRow: 2, seatCol: 3 },
];

interface StoreState {
  students: Student[];
  records: AssessmentRecord[];
  ranking: RankingItem[];
  selectedStudent: Student | null;
  showModal: boolean;
  animatedScores: Record<string, { score: number; type: 'add' | 'sub' }>;
  expandedAward: string | null;
  isLoading: boolean;
  
  fetchRecords: () => Promise<void>;
  fetchRanking: () => Promise<void>;
  submitRecord: (studentId: string, category: CategoryType, grade: GradeType) => Promise<void>;
  resetMonth: () => Promise<void>;
  
  setSelectedStudent: (student: Student | null) => void;
  setShowModal: (show: boolean) => void;
  setExpandedAward: (award: string | null) => void;
  clearAnimatedScore: (studentId: string) => void;
  getStudentScore: (studentId: string) => number;
  getStudentRecords: (studentId: string) => AssessmentRecord[];
}

export const useStore = create<StoreState>((set, get) => ({
  students: DEFAULT_STUDENTS,
  records: [],
  ranking: [],
  selectedStudent: null,
  showModal: false,
  animatedScores: {},
  expandedAward: null,
  isLoading: false,

  fetchRecords: async () => {
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      set({ records: data.records || [] });
    } catch (e) {
      console.error('获取记录失败:', e);
    }
  },

  fetchRanking: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/ranking');
      const data = await res.json();
      set({ ranking: data.ranking || [], isLoading: false });
    } catch (e) {
      console.error('获取排行失败:', e);
      set({ isLoading: false });
    }
  },

  submitRecord: async (studentId, category, grade) => {
    const config = CATEGORY_CONFIG[category];
    const score = grade === 'good' ? config.good : config.bad;
    const student = get().students.find(s => s.id === studentId);
    if (!student) return;

    const record: Omit<AssessmentRecord, 'id'> = {
      studentId,
      studentName: student.name,
      category,
      grade,
      score,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch('/api/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const data = await res.json();
      
      if (data.record) {
        set(state => ({
          records: [...state.records, data.record],
          animatedScores: {
            ...state.animatedScores,
            [studentId]: { score: Math.abs(score), type: score > 0 ? 'add' : 'sub' }
          }
        }));
        
        setTimeout(() => {
          get().clearAnimatedScore(studentId);
        }, 1000);
        
        get().fetchRanking();
      }
    } catch (e) {
      console.error('提交记录失败:', e);
    }
  },

  resetMonth: async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      set({ records: [], ranking: [] });
      get().fetchRanking();
    } catch (e) {
      console.error('重置失败:', e);
    }
  },

  setSelectedStudent: (student) => set({ selectedStudent: student }),
  setShowModal: (show) => set({ showModal: show }),
  setExpandedAward: (award) => set({ expandedAward: award }),
  clearAnimatedScore: (studentId) => set(state => {
    const { [studentId]: _, ...rest } = state.animatedScores;
    return { animatedScores: rest };
  }),

  getStudentScore: (studentId) => {
    return get().records
      .filter(r => r.studentId === studentId)
      .reduce((sum, r) => sum + r.score, 0);
  },

  getStudentRecords: (studentId) => {
    return get().records
      .filter(r => r.studentId === studentId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}));
