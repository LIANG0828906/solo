import { create } from 'zustand';
import { runExecution, type StepSnapshot } from '@/services/executionService';
import { defaultCode } from '@/data/defaultCode';

interface SandboxState {
  code: string;
  steps: StepSnapshot[];
  currentStepIndex: number;
  isRunning: boolean;
  error: string | null;
  setCode: (code: string) => void;
  runCode: () => void;
  setStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useSandboxStore = create<SandboxState>((set, get) => ({
  code: defaultCode,
  steps: [],
  currentStepIndex: 0,
  isRunning: false,
  error: null,

  setCode: (code: string) => set({ code }),

  runCode: () => {
    const { code } = get();
    set({ isRunning: true, error: null });
    try {
      const steps = runExecution(code);
      set({ steps, currentStepIndex: 0, isRunning: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), isRunning: false });
    }
  },

  setStepIndex: (index: number) => {
    const { steps } = get();
    if (index >= 0 && index < steps.length) {
      set({ currentStepIndex: index });
    }
  },

  nextStep: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  reset: () => set({ code: defaultCode, steps: [], currentStepIndex: 0, isRunning: false, error: null }),
}));
