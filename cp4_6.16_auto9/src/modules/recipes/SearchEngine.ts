import type { Recipe, SearchResult } from '@/types';

interface CacheEntry {
  key: string;
  results: SearchResult[];
  timestamp: number;
}

const CACHE_MAX = 10;
const CACHE_TTL = 5 * 60 * 1000;
const cache: CacheEntry[] = [];

const normalize = (s: string) => s.trim().toLowerCase();

const buildIngredientIndex = (recipes: Recipe[]): Map<string, Set<string>> => {
  const idx = new Map<string, Set<string>>();
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const key = normalize(ing.name);
      if (!idx.has(key)) idx.set(key, new Set());
      idx.get(key)!.add(r.id);
    }
  }
  return idx;
};

const calcMatchScore = (
  matched: number,
  totalQuery: number,
  totalRecipe: number,
): number => {
  if (totalQuery === 0 || totalRecipe === 0) return 0;
  const recall = matched / totalQuery;
  const precision = matched / totalRecipe;
  const f1 = (2 * recall * precision) / (recall + precision);
  const bonus = matched === totalQuery ? 0.1 : 0;
  return Math.min(1, f1 + bonus);
};

const cacheKey = (inputs: string[]) =>
  inputs.map(normalize).filter(Boolean).sort().join('|');

const readCache = (key: string): SearchResult[] | null => {
  const now = Date.now();
  const entry = cache.find((e) => e.key === key);
  if (!entry) return null;
  if (now - entry.timestamp > CACHE_TTL) {
    const i = cache.indexOf(entry);
    cache.splice(i, 1);
    return null;
  }
  return entry.results;
};

const writeCache = (key: string, results: SearchResult[]) => {
  const idx = cache.findIndex((e) => e.key === key);
  if (idx >= 0) cache.splice(idx, 1);
  cache.unshift({ key, results, timestamp: Date.now() });
  while (cache.length > CACHE_MAX) cache.pop();
};

export const searchByIngredients = (
  inputIngredients: string[],
  recipes: Recipe[],
  limit: number = 20,
): SearchResult[] => {
  const start = performance.now();
  const normalized = inputIngredients.map(normalize).filter(Boolean);

  if (normalized.length === 0) return [];
  const key = cacheKey(inputIngredients);
  const cached = readCache(key);
  if (cached) {
    console.debug(`[SearchEngine] cache hit, took ${(performance.now() - start).toFixed(1)}ms`);
    return cached.slice(0, limit);
  }

  const querySet = new Set(normalized);
  const idx = buildIngredientIndex(recipes);
  const candidateIds = new Set<string>();

  for (const q of querySet) {
    let found = false;
    for (const [ingName, recipeIds] of idx) {
      if (ingName === q || ingName.includes(q) || q.includes(ingName)) {
        recipeIds.forEach((id) => candidateIds.add(id));
        found = true;
      }
    }
    if (!found) {
      for (const r of recipes) {
        candidateIds.add(r.id);
      }
      break;
    }
  }

  const results: SearchResult[] = [];
  for (const id of candidateIds) {
    const recipe = recipes.find((r) => r.id === id)!;
    const recipeIngredientNames = recipe.ingredients.map((i) => normalize(i.name));
    const recipeSet = new Set(recipeIngredientNames);

    const matched: string[] = [];
    for (const q of querySet) {
      for (const rn of recipeSet) {
        if (rn === q || rn.includes(q) || q.includes(rn)) {
          matched.push(recipe.ingredients.find((i) => normalize(i.name) === rn)!.name);
          break;
        }
      }
    }

    const uniqueMatched = Array.from(new Set(matched));
    const missing = recipe.ingredients
      .filter((i) => !uniqueMatched.includes(i.name))
      .map((i) => i.name);

    if (uniqueMatched.length === 0) continue;

    const score = calcMatchScore(
      uniqueMatched.length,
      querySet.size,
      recipeSet.size,
    );

    results.push({
      recipe,
      matchScore: score,
      matchedIngredients: uniqueMatched,
      missingIngredients: missing,
    });
  }

  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.matchedIngredients.length !== a.matchedIngredients.length)
      return b.matchedIngredients.length - a.matchedIngredients.length;
    return a.recipe.cookTime - b.recipe.cookTime;
  });

  const final = results.slice(0, limit);
  writeCache(key, final);
  const took = performance.now() - start;
  console.debug(
    `[SearchEngine] query=[${normalized.join(',')}] candidates=${candidateIds.size} results=${final.length} took=${took.toFixed(1)}ms`,
  );
  return final;
};

export const clearSearchCache = () => {
  cache.length = 0;
};
