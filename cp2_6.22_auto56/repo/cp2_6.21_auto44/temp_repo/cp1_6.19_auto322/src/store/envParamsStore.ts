import { create } from 'zustand';
import type { EnvParams } from '../core/types';
import { createDefaultEnvParams, clampEnvParams } from '../core/envParams';

export interface EnvParamsStoreState {
  params: EnvParams;
  prevParams: EnvParams;
  setParam: <K extends keyof EnvParams>(key: K, value: number) => void;
  setParams: (p: Partial<EnvParams>) => void;
  reset: () => void;
}

export const useEnvParamsStore = create<EnvParamsStoreState>((set, get) => ({
  params: createDefaultEnvParams(),
  prevParams: createDefaultEnvParams(),
  setParam: (key, value) =>
    set((state) => {
      const next = clampEnvParams({ ...state.params, [key]: value });
      return { prevParams: state.params, params: next };
    }),
  setParams: (p) =>
    set((state) => {
      const next = clampEnvParams({ ...state.params, ...p });
      return { prevParams: state.params, params: next };
    }),
  reset: () => {
    const defaults = createDefaultEnvParams();
    set({ prevParams: get().params, params: defaults });
  },
}));
