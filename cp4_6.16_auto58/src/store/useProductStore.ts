import { create } from 'zustand';
import type { Product, Step, MaterialUsage } from '@/types';
import { useProjectStore } from './useProjectStore';

interface ProductStoreState {
  products: Product[];
  refreshProducts: () => void;
  getProductById: (id: string) => Product | undefined;
  getProductStats: (id: string) => {
    steps: Step[];
    materialUsages: MaterialUsage[];
    totalCost: number;
  } | null;
}

function computeProducts(): Product[] {
  const { projects } = useProjectStore.getState();
  return projects
    .filter((p) => p.isCompleted)
    .map((p) => {
      const totalCost = p.materialUsages.reduce(
        (sum, u) => sum + u.quantityUsed * u.unitPrice,
        0
      );
      return {
        id: p.id,
        title: p.title,
        coverImage: p.coverImage,
        description: p.description,
        totalHours: p.totalHours,
        totalCost,
        completedDate: p.endDate || p.startDate
      };
    })
    .sort((a, b) => b.completedDate - a.completedDate);
}

export const useProductStore = create<ProductStoreState>((set, get) => ({
  products: [],

  refreshProducts: () => {
    set({ products: computeProducts() });
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  getProductStats: (id) => {
    const { projects } = useProjectStore.getState();
    const project = projects.find((p) => p.id === id);
    if (!project) return null;
    const steps = [...project.steps].sort((a, b) => a.order - b.order);
    const materialUsages = project.materialUsages;
    const totalCost = materialUsages.reduce(
      (sum, u) => sum + u.quantityUsed * u.unitPrice,
      0
    );
    return { steps, materialUsages, totalCost };
  }
}));

useProjectStore.subscribe(() => {
  useProductStore.getState().refreshProducts();
});
