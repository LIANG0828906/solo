import { create } from 'zustand';
import type { Product, Step, MaterialUsage } from '@/types';
import { useProjectStore } from './useProjectStore';

interface ProductStoreState {
  products: Product[];
  productMap: Map<string, Product>;
  projectMap: Map<string, ReturnType<typeof useProjectStore.getState>['projects'][number]>;
  refreshProducts: () => void;
  getProductById: (id: string) => Product | undefined;
  getProductStats: (id: string) => {
    steps: Step[];
    materialUsages: MaterialUsage[];
    totalCost: number;
  } | null;
}

function computeProducts(): { products: Product[]; productMap: Map<string, Product>; projectMap: Map<string, ReturnType<typeof useProjectStore.getState>['projects'][number]> } {
  const { projects } = useProjectStore.getState();
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const products = projects
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
  const productMap = new Map(products.map(p => [p.id, p]));
  return { products, productMap, projectMap };
}

export const useProductStore = create<ProductStoreState>((set, get) => ({
  products: [],
  productMap: new Map(),
  projectMap: new Map(),

  refreshProducts: () => {
    const { products, productMap, projectMap } = computeProducts();
    set({ products, productMap, projectMap });
  },

  getProductById: (id) => {
    return get().productMap.get(id);
  },

  getProductStats: (id) => {
    const project = get().projectMap.get(id);
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
