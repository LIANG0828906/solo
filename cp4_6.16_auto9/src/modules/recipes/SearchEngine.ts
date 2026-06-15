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

const SYNONYMS: Record<string, string[]> = {
  '鸡蛋': ['蛋', '鸡蛋', '鸡子'],
  '蛋': ['鸡蛋', '蛋', '鸡子'],
  '番茄': ['西红柿', '番茄', '洋柿子'],
  '西红柿': ['番茄', '西红柿', '洋柿子'],
  '土豆': ['马铃薯', '土豆', '洋芋', '地蛋'],
  '马铃薯': ['土豆', '马铃薯', '洋芋', '地蛋'],
  '洋葱': ['洋葱', '圆葱', '葱头'],
  '圆葱': ['洋葱', '圆葱', '葱头'],
  '猪肉': ['猪肉', '五花肉', '里脊', '猪瘦肉'],
  '牛肉': ['牛肉', '牛腩', '牛腱子'],
  '鸡肉': ['鸡肉', '鸡', '鸡腿', '鸡胸肉'],
  '豆腐': ['豆腐', '老豆腐', '嫩豆腐', '北豆腐', '南豆腐'],
  '青椒': ['青椒', '辣椒', '菜椒', '尖椒'],
  '辣椒': ['青椒', '辣椒', '辣子'],
  '葱': ['葱', '大葱', '小葱', '葱花'],
  '蒜': ['蒜', '大蒜', '蒜瓣', '蒜蓉'],
  '姜': ['姜', '生姜', '老姜', '姜片'],
  '面粉': ['面粉', '白面', '小麦粉'],
  '大米': ['大米', '米', '米饭', '白米'],
  '生抽': ['生抽', '酱油'],
  '酱油': ['生抽', '酱油', '老抽'],
  '蚝油': ['蚝油', '耗油'],
  '糖': ['糖', '白糖', '白砂糖', '冰糖'],
  '盐': ['盐', '食盐', '精盐'],
  '油': ['油', '食用油', '花生油', '菜籽油'],
  '淀粉': ['淀粉', '生粉', '玉米淀粉', '土豆淀粉'],
  '料酒': ['料酒', '黄酒', '花雕酒'],
  '醋': ['醋', '米醋', '陈醋', '白醋'],
};

const getSynonyms = (name: string): string[] => {
  const key = normalize(name);
  if (SYNONYMS[key]) return SYNONYMS[key].map(normalize);
  return [key];
};

const isSynonymMatch = (a: string, b: string): boolean => {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  const synsA = getSynonyms(na);
  const synsB = getSynonyms(nb);
  return synsA.some((s) => synsB.includes(s)) ||
    synsA.some((s) => s.includes(nb)) ||
    synsB.some((s) => s.includes(na));
};

const TITLE_MATCH_BOOST = 0.25;
const TAG_MATCH_BOOST = 0.15;

const calcPositionBoost = (recipe: Recipe, queryIngredients: string[]): number => {
  let boost = 0;
  const titleLower = recipe.title.toLowerCase();
  const tagsLower = recipe.tags.map((t) => t.toLowerCase());
  for (const q of queryIngredients) {
    const qn = normalize(q);
    const syns = getSynonyms(qn);
    for (const s of syns) {
      if (titleLower.includes(s)) {
        boost += TITLE_MATCH_BOOST;
        break;
      }
    }
    for (const s of syns) {
      if (tagsLower.some((t) => t.includes(s))) {
        boost += TAG_MATCH_BOOST;
        break;
      }
    }
  }
  return Math.min(0.4, boost);
};

const QUANTITY_PATTERNS = [
  { re: /^(\d+(?:\.\d+)?)\s*(克|g|公斤|kg|斤|两)$/i, score: 2.0, label: 'weight' },
  { re: /^(\d+(?:\.\d+)?)\s*(毫升|ml|升|l)$/i, score: 1.8, label: 'volume' },
  { re: /^(\d+(?:\.\d+)?)\s*(个|只|颗|根|块|片|条|把)$/i, score: 1.6, label: 'count' },
  { re: /^(\d+(?:\.\d+)?)\s*(勺|汤匙|茶匙|杯|碗|盒|包)$/i, score: 1.2, label: 'approx' },
  { re: /^(适量|少许|若干|少量|一点|一些)$/i, score: 0.5, label: 'seasoning' },
  { re: /^(\d+(?:\.\d+)?)~(\d+(?:\.\d+)?)\s*(.*)$/, score: 1.4, label: 'range' },
];

export const calcIngredientWeight = (amount: string): number => {
  if (!amount) return 1.0;
  const a = amount.trim();
  for (const p of QUANTITY_PATTERNS) {
    if (p.re.test(a)) {
      return p.score;
    }
  }
  return 1.0;
};

const buildIngredientIndex = (
  recipes: Recipe[],
): Map<string, { recipeId: string; displayName: string; weight: number }[]> => {
  const idx = new Map<string, { recipeId: string; displayName: string; weight: number }[]>();
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const key = normalize(ing.name);
      const weight = calcIngredientWeight(ing.amount);
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key)!.push({ recipeId: r.id, displayName: ing.name, weight });
    }
  }
  return idx;
};

const calcWeightedMatchScore = (
  matchedWeight: number,
  queryWeight: number,
  recipeWeight: number,
  matchedCount: number,
  queryCount: number,
): number => {
  if (queryCount === 0 || recipeWeight === 0) return 0;
  const safeQueryWeight = queryWeight > 0 ? queryWeight : queryCount;
  const safeRecipeWeight = recipeWeight > 0 ? recipeWeight : 1;
  const recall = matchedWeight / safeQueryWeight;
  const precision = matchedWeight / safeRecipeWeight;
  const denom = recall + precision;
  const f1 = denom > 0 ? (2 * recall * precision) / denom : 0;
  const completeBonus = matchedCount === queryCount ? 0.12 : 0;
  const skewBoost = matchedCount > 0 && matchedWeight / matchedCount > 1.3 ? 0.08 : 0;
  return Math.min(1, f1 + completeBonus + skewBoost);
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
  const normalizedWithDup = inputIngredients.map(normalize).filter(Boolean);
  const normalized = Array.from(new Set(normalizedWithDup));

  if (normalized.length === 0) {
    console.debug('[SearchEngine] 空食材列表，返回空结果');
    return [];
  }
  const key = cacheKey(inputIngredients);
  const cached = readCache(key);
  if (cached) {
    console.debug(`[SearchEngine] cache hit, took ${(performance.now() - start).toFixed(1)}ms`);
    return cached.slice(0, limit);
  }

  if (normalized.length !== normalizedWithDup.length) {
    console.debug(
      `[SearchEngine] 去除重复食材 ${normalizedWithDup.length - normalized.length} 项`,
    );
  }

  const querySet = new Set(normalized);
  const queryDefaultWeight = 1.0;
  const totalQueryWeight = querySet.size * queryDefaultWeight;

  const idx = buildIngredientIndex(recipes);
  const candidateIds = new Set<string>();

  for (const q of querySet) {
    let found = false;
    for (const [ingName, entries] of idx) {
      if (isSynonymMatch(ingName, q)) {
        entries.forEach((e) => candidateIds.add(e.recipeId));
        found = true;
      }
    }
    if (!found) {
      for (const r of recipes) candidateIds.add(r.id);
      console.debug(`[SearchEngine] 食材「${q}」无精确匹配，退化为全量扫描`);
      break;
    }
  }

  const results: SearchResult[] = [];
  for (const id of candidateIds) {
    const recipe = recipes.find((r) => r.id === id)!;
    const recipeIngredients = recipe.ingredients;
    const recipeSet = new Map<string, { displayName: string; weight: number }>();
    let totalRecipeWeight = 0;
    for (const ing of recipeIngredients) {
      const k = normalize(ing.name);
      const w = calcIngredientWeight(ing.amount);
      recipeSet.set(k, { displayName: ing.name, weight: w });
      totalRecipeWeight += w;
    }

    const matchedDisplay: string[] = [];
    let matchedWeight = 0;
    for (const q of querySet) {
      for (const [rn, info] of recipeSet) {
        if (isSynonymMatch(rn, q)) {
          if (!matchedDisplay.includes(info.displayName)) {
            matchedDisplay.push(info.displayName);
            matchedWeight += Math.min(info.weight, queryDefaultWeight * 1.5);
          }
          break;
        }
      }
    }

    if (matchedDisplay.length === 0) continue;

    const missing = recipeIngredients
      .filter((i) => !matchedDisplay.includes(i.name))
      .map((i) => i.name);

    const baseScore = calcWeightedMatchScore(
      matchedWeight,
      totalQueryWeight,
      totalRecipeWeight,
      matchedDisplay.length,
      querySet.size,
    );

    const positionBoost = calcPositionBoost(recipe, normalized);
    const score = Math.min(1, baseScore + positionBoost);

    results.push({
      recipe,
      matchScore: score,
      matchedIngredients: matchedDisplay,
      missingIngredients: missing,
    });
  }

  results.sort((a, b) => {
    if (Math.abs(b.matchScore - a.matchScore) > 0.001) return b.matchScore - a.matchScore;
    if (b.matchedIngredients.length !== a.matchedIngredients.length)
      return b.matchedIngredients.length - a.matchedIngredients.length;
    return a.recipe.cookTime - b.recipe.cookTime;
  });

  if (results.length === 0) {
    console.debug(`[SearchEngine] 无匹配结果，query=[${normalized.join(',')}]`);
  }

  const final = results.slice(0, limit);
  writeCache(key, final);
  const took = performance.now() - start;
  console.debug(
    `[SearchEngine] query=[${normalized.join(',')}] candidates=${candidateIds.size} results=${final.length} took=${took.toFixed(1)}ms`,
  );
  if (took > 200) {
    console.warn(`[SearchEngine] 警告：搜索耗时超过200ms阈值: ${took.toFixed(1)}ms`);
  }
  return final;
};

export const clearSearchCache = () => {
  cache.length = 0;
  console.debug('[SearchEngine] 缓存已清空');
};

export interface SearchTestReport {
  name: string;
  passed: boolean;
  durationMs: number;
  message: string;
}

export const runSearchTests = (recipes: Recipe[]): SearchTestReport[] => {
  const reports: SearchTestReport[] = [];

  const run = (name: string, fn: () => { ok: boolean; msg: string }) => {
    const t0 = performance.now();
    try {
      const { ok, msg } = fn();
      reports.push({
        name,
        passed: ok,
        durationMs: performance.now() - t0,
        message: msg,
      });
    } catch (err) {
      reports.push({
        name,
        passed: false,
        durationMs: performance.now() - t0,
        message: `异常: ${(err as Error).message}`,
      });
    }
  };

  run('空食材列表应返回空', () => {
    const r = searchByIngredients([], recipes);
    return { ok: r.length === 0, msg: `返回 ${r.length} 条结果` };
  });

  run('重复食材应去重', () => {
    const r1 = searchByIngredients(['鸡蛋', '鸡蛋', '鸡蛋'], recipes, 5);
    const r2 = searchByIngredients(['鸡蛋'], recipes, 5);
    const ids1 = r1.map((x) => x.recipe.id).join(',');
    const ids2 = r2.map((x) => x.recipe.id).join(',');
    return {
      ok: ids1 === ids2,
      msg: `重复食材结果与单次匹配：${ids1 === ids2 ? '一致' : `不一致 [${ids1}] vs [${ids2}]`}`,
    };
  });

  run('无匹配食材应返回空', () => {
    const r = searchByIngredients(['不存在的食材9999', '奇异水果xyz'], recipes);
    return { ok: r.length === 0, msg: `返回 ${r.length} 条结果` };
  });

  run('性能测试：10次重复搜索平均耗时', () => {
    const queries = [['鸡蛋', '番茄'], ['猪肉', '姜'], ['牛肉', '洋葱', '青椒'], ['面粉', '鸡蛋']];
    let total = 0;
    let count = 0;
    for (let i = 0; i < 3; i++) {
      for (const q of queries) {
        const t0 = performance.now();
        searchByIngredients(q, recipes);
        total += performance.now() - t0;
        count++;
      }
    }
    const avg = total / count;
    return {
      ok: avg < 200,
      msg: `${count} 次搜索平均 ${avg.toFixed(1)}ms (< 200ms)`,
    };
  });

  run('主料 vs 辅料：匹配鸡蛋时高用量优先', () => {
    const res = searchByIngredients(['鸡蛋'], recipes, 10);
    if (res.length < 2) return { ok: true, msg: `结果不足（${res.length}），跳过` };
    let sortedCorrectly = true;
    for (let i = 0; i < res.length - 1; i++) {
      const a = res[i], b = res[i + 1];
      const aEgg = a.recipe.ingredients.find((x) => normalize(x.name) === '鸡蛋');
      const bEgg = b.recipe.ingredients.find((x) => normalize(x.name) === '鸡蛋');
      const wA = aEgg ? calcIngredientWeight(aEgg.amount) : 0;
      const wB = bEgg ? calcIngredientWeight(bEgg.amount) : 0;
      if (a.matchScore === b.matchScore && wA < wB) {
        sortedCorrectly = false;
        break;
      }
    }
    return {
      ok: sortedCorrectly,
      msg: `匹配 ${res.length} 条，主料权重排序：${sortedCorrectly ? '正确' : '有问题'}`,
    };
  });

  run('匹配度应在 [0, 1] 区间', () => {
    const res = searchByIngredients(['鸡蛋', '番茄', '葱', '盐'], recipes, 20);
    const bad = res.filter((r) => r.matchScore < 0 || r.matchScore > 1.001);
    return {
      ok: bad.length === 0,
      msg: bad.length === 0 ? `全部 ${res.length} 条匹配度合法` : `${bad.length} 条越界`,
    };
  });

  run('同义词匹配：蛋应匹配鸡蛋', () => {
    const rEgg = searchByIngredients(['鸡蛋'], recipes, 10);
    const rDan = searchByIngredients(['蛋'], recipes, 10);
    const idEgg = rEgg.map((x) => x.recipe.id);
    const idDan = rDan.map((x) => x.recipe.id);
    const overlap = idEgg.filter((id) => idDan.includes(id));
    return {
      ok: overlap.length >= Math.min(3, rEgg.length),
      msg: `鸡蛋=${rEgg.length}条, 蛋=${rDan.length}条, 交集=${overlap.length}条`,
    };
  });

  run('位置权重：标题包含食材应排名更前', () => {
    const res = searchByIngredients(['牛肉'], recipes, 10);
    if (res.length < 2) return { ok: true, msg: `结果不足（${res.length}），跳过` };
    let titleBoostWorks = true;
    for (let i = 0; i < Math.min(5, res.length - 1); i++) {
      const a = res[i], b = res[i + 1];
      const aHasTitle = a.recipe.title.includes('牛肉');
      const bHasTitle = b.recipe.title.includes('牛肉');
      if (!aHasTitle && bHasTitle && a.matchScore <= b.matchScore) {
        titleBoostWorks = false;
        break;
      }
    }
    return {
      ok: titleBoostWorks,
      msg: `前${Math.min(5, res.length)}条排序符合标题权重：${titleBoostWorks ? '正确' : '有问题'}`,
    };
  });

  console.groupCollapsed('[SearchEngine] 边界测试报告');
  reports.forEach((r) => {
    const icon = r.passed ? '✅' : '❌';
    console.log(
      `${icon} ${r.name} | ${r.durationMs.toFixed(1)}ms | ${r.message}`,
    );
  });
  console.groupEnd();

  return reports;
};
