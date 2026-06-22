import { create } from 'zustand';
import type { Recipe, Collaborator, VersionSnapshot, FavoriteFolder } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  isLoading: boolean;
  ingredientsLoading: boolean;
  stepsLoading: boolean;
  searchQuery: string;
  totalRecipes: number;
  currentPage: number;
  collaborators: Collaborator[];
  versionHistory: VersionSnapshot[];
  selectedVersionId: string | null;
  favoriteFolders: FavoriteFolder[];
  conflictData: { localOp: unknown; remoteOp: unknown } | null;
  favoritedRecipeIds: Set<string>;

  setRecipes: (recipes: Recipe[], total: number) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  setLoading: (loading: boolean) => void;
  setIngredientsLoading: (loading: boolean) => void;
  setStepsLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  setCollaborators: (collaborators: Collaborator[]) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (userId: string) => void;
  setVersionHistory: (versions: VersionSnapshot[]) => void;
  setSelectedVersionId: (id: string | null) => void;
  setFavoriteFolders: (folders: FavoriteFolder[]) => void;
  addFavoriteFolder: (folder: FavoriteFolder) => void;
  removeFavoriteFolder: (id: string) => void;
  renameFavoriteFolder: (id: string, name: string) => void;
  setConflictData: (data: { localOp: unknown; remoteOp: unknown } | null) => void;
  updateRecipeInList: (recipe: Recipe) => void;
  toggleFavorite: (recipeId: string) => void;
  rateRecipe: (recipeId: string, rating: number) => void;
}

const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  currentRecipe: null,
  isLoading: false,
  ingredientsLoading: false,
  stepsLoading: false,
  searchQuery: '',
  totalRecipes: 0,
  currentPage: 1,
  collaborators: [],
  versionHistory: [],
  selectedVersionId: null,
  favoriteFolders: [],
  conflictData: null,
  favoritedRecipeIds: new Set<string>(),

  setRecipes: (recipes, total) => set({ recipes, totalRecipes: total }),
  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
  setLoading: (isLoading) => set({ isLoading }),
  setIngredientsLoading: (ingredientsLoading) => set({ ingredientsLoading }),
  setStepsLoading: (stepsLoading) => set({ stepsLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setCollaborators: (collaborators) => set({ collaborators }),
  addCollaborator: (collaborator) => set((s) => ({ collaborators: [...s.collaborators, collaborator] })),
  removeCollaborator: (userId) => set((s) => ({ collaborators: s.collaborators.filter((c) => c.userId !== userId) })),
  setVersionHistory: (versionHistory) => set({ versionHistory }),
  setSelectedVersionId: (selectedVersionId) => set({ selectedVersionId }),
  setFavoriteFolders: (favoriteFolders) => set({ favoriteFolders }),
  addFavoriteFolder: (folder) => set((s) => ({ favoriteFolders: [...s.favoriteFolders, folder] })),
  removeFavoriteFolder: (id) => set((s) => ({ favoriteFolders: s.favoriteFolders.filter((f) => f.id !== id) })),
  renameFavoriteFolder: (id, name) => set((s) => ({
    favoriteFolders: s.favoriteFolders.map((f) => f.id === id ? { ...f, name } : f),
  })),
  setConflictData: (conflictData) => set({ conflictData }),
  updateRecipeInList: (recipe) => set((s) => ({
    recipes: s.recipes.map((r) => r.id === recipe.id ? recipe : r),
    currentRecipe: s.currentRecipe?.id === recipe.id ? recipe : s.currentRecipe,
  })),
  toggleFavorite: (recipeId) => set((s) => {
    const next = new Set(s.favoritedRecipeIds);
    if (next.has(recipeId)) next.delete(recipeId);
    else next.add(recipeId);
    return { favoritedRecipeIds: next };
  }),
  rateRecipe: (recipeId, rating) => set((s) => {
    const updatedRecipes = s.recipes.map((r) => {
      if (r.id !== recipeId) return r;
      const newCount = r.ratingCount + 1;
      const newAvg = (r.avgRating * r.ratingCount + rating) / newCount;
      const dist = [...r.ratingDistribution];
      dist[rating - 1] = (dist[rating - 1] || 0) + 1;
      return { ...r, avgRating: newAvg, ratingCount: newCount, ratingDistribution: dist };
    });
    const updatedCurrent = s.currentRecipe?.id === recipeId ? updatedRecipes.find((r) => r.id === recipeId)! : s.currentRecipe;
    return { recipes: updatedRecipes, currentRecipe: updatedCurrent };
  }),
}));

export default useRecipeStore;
