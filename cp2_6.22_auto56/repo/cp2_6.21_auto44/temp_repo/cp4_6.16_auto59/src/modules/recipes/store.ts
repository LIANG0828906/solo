import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'
import {
  Recipe,
  CanvasBlock,
  Ingredient,
  CuisineType,
  DifficultyLevel,
  PRESET_INGREDIENTS
} from './types'

interface RecipesState {
  recipes: Recipe[]
  currentRecipe: Recipe | null
  customIngredients: Ingredient[]
  isLoading: boolean
  error: string | null
  initStore: () => Promise<void>
  createRecipe: (data: Partial<Recipe>) => Recipe
  updateRecipe: (id: string, data: Partial<Recipe>) => void
  deleteRecipe: (id: string) => void
  setCurrentRecipe: (id: string | null) => void
  toggleFavorite: (id: string) => void
  addRating: (id: string, rating: number) => void
  incrementViews: (id: string) => void
  addBlock: (recipeId: string, block?: Partial<CanvasBlock>) => void
  updateBlock: (recipeId: string, blockId: string, data: Partial<CanvasBlock>) => void
  deleteBlock: (recipeId: string, blockId: string) => void
  reorderBlocks: (recipeId: string, orderedIds: string[]) => void
  addIngredientToBlock: (recipeId: string, blockId: string, ingredient: Ingredient) => void
  removeIngredientFromBlock: (recipeId: string, blockId: string, ingredientId: string) => void
  updateBlockIngredient: (
    recipeId: string,
    blockId: string,
    ingredientId: string,
    data: Partial<Ingredient>
  ) => void
  addCustomIngredient: (ingredient: Omit<Ingredient, 'id'>) => void
  getAllIngredients: () => Ingredient[]
}

function ensureRecipes(val: unknown): Recipe[] {
  return Array.isArray(val) ? val : []
}

function ensureIngredients(val: unknown): Ingredient[] {
  return Array.isArray(val) ? val : []
}

const createEmptyRecipe = (data: Partial<Recipe> = {}): Recipe => ({
  id: uuidv4(),
  title: data.title || '无标题食谱',
  coverImage: data.coverImage,
  cuisine: data.cuisine || 'chinese',
  difficulty: data.difficulty || 2,
  totalTime: data.totalTime || 30,
  blocks: data.blocks || [],
  description: data.description || '',
  author: data.author || '美食创作者',
  authorAvatar: data.authorAvatar || '👨‍🍳',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isFavorite: false,
  ratings: [],
  views: 0
})

const createSampleRecipes = (): Recipe[] => {
  const now = new Date().toISOString()
  return [
    {
      id: 'sample-1',
      title: '番茄炒蛋',
      coverImage: undefined,
      cuisine: 'chinese' as CuisineType,
      difficulty: 1 as DifficultyLevel,
      totalTime: 15,
      description: '经典家常菜，酸甜可口，简单易做。',
      author: '小厨神',
      authorAvatar: '👩‍🍳',
      createdAt: now,
      updatedAt: now,
      isFavorite: true,
      ratings: [5, 4, 5, 5, 4],
      views: 128,
      blocks: [
        {
          id: 'block-1',
          title: '准备食材',
          description: '番茄切丁，鸡蛋打散，葱切葱花备用。',
          ingredients: [
            { ...PRESET_INGREDIENTS[23], id: 'bi-1' },
            { ...PRESET_INGREDIENTS[17], id: 'bi-2' }
          ],
          position: { x: 50, y: 50 },
          order: 1
        },
        {
          id: 'block-2',
          title: '炒鸡蛋',
          description: '热锅冷油，倒入蛋液，中火翻炒至凝固盛出。',
          ingredients: [
            { ...PRESET_INGREDIENTS[48], id: 'bi-3', quantity: 20 }
          ],
          position: { x: 320, y: 50 },
          order: 2
        },
        {
          id: 'block-3',
          title: '炒番茄',
          description: '锅中加油，放入番茄丁翻炒出汁，加少许糖和盐调味。',
          ingredients: [
            { ...PRESET_INGREDIENTS[44], id: 'bi-4', quantity: 10 },
            { ...PRESET_INGREDIENTS[45], id: 'bi-5', quantity: 3 }
          ],
          position: { x: 590, y: 50 },
          order: 3
        },
        {
          id: 'block-4',
          title: '合炒出锅',
          description: '倒入炒好的鸡蛋，翻炒均匀，撒上葱花出锅。',
          ingredients: [],
          position: { x: 185, y: 280 },
          order: 4
        }
      ]
    },
    {
      id: 'sample-2',
      title: '提拉米苏',
      coverImage: undefined,
      cuisine: 'dessert' as CuisineType,
      difficulty: 3 as DifficultyLevel,
      totalTime: 60,
      description: '意式经典甜品，咖啡与奶酪的完美融合。',
      author: '甜品师Leo',
      authorAvatar: '🧑‍🍳',
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      ratings: [5, 5, 4, 5],
      views: 256,
      blocks: [
        {
          id: 'block-5',
          title: '打发奶油',
          description: '马斯卡彭奶酪与糖拌匀，加入打发的淡奶油。',
          ingredients: [
            { ...PRESET_INGREDIENTS[20], id: 'bi-6', quantity: 250 },
            { ...PRESET_INGREDIENTS[21], id: 'bi-7', quantity: 150 },
            { ...PRESET_INGREDIENTS[44], id: 'bi-8', quantity: 60 }
          ],
          position: { x: 50, y: 50 },
          order: 1
        },
        {
          id: 'block-6',
          title: '泡手指饼干',
          description: '浓缩咖啡冷却，手指饼干快速蘸取咖啡液。',
          ingredients: [
            { ...PRESET_INGREDIENTS[18], id: 'bi-9', quantity: 2 }
          ],
          position: { x: 320, y: 50 },
          order: 2
        },
        {
          id: 'block-7',
          title: '层层叠加',
          description: '一层饼干一层奶酪糊，重复两次，冷藏4小时。',
          ingredients: [],
          position: { x: 590, y: 50 },
          order: 3
        }
      ]
    },
    {
      id: 'sample-3',
      title: '日式咖喱饭',
      coverImage: undefined,
      cuisine: 'japanese' as CuisineType,
      difficulty: 2 as DifficultyLevel,
      totalTime: 45,
      description: '浓郁的日式咖喱搭配热腾腾的白米饭，幸福感满满。',
      author: '和风料理',
      authorAvatar: '🍱',
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      ratings: [4, 5, 4, 4, 5],
      views: 89,
      blocks: [
        {
          id: 'block-8',
          title: '处理蔬菜',
          description: '土豆、胡萝卜、洋葱切块备用。',
          ingredients: [
            { ...PRESET_INGREDIENTS[24], id: 'bi-10' },
            { ...PRESET_INGREDIENTS[25], id: 'bi-11' },
            { ...PRESET_INGREDIENTS[31], id: 'bi-12' }
          ],
          position: { x: 50, y: 50 },
          order: 1
        },
        {
          id: 'block-9',
          title: '炒肉和菜',
          description: '先炒鸡肉块，再加入蔬菜翻炒均匀。',
          ingredients: [
            { ...PRESET_INGREDIENTS[7], id: 'bi-13', quantity: 300 }
          ],
          position: { x: 320, y: 50 },
          order: 2
        },
        {
          id: 'block-10',
          title: '炖煮加咖喱',
          description: '加水没过食材，炖煮20分钟后加入咖喱块搅匀。',
          ingredients: [],
          position: { x: 590, y: 50 },
          order: 3
        },
        {
          id: 'block-11',
          title: '装盘',
          description: '盛上热米饭，浇上咖喱即可享用。',
          ingredients: [
            { ...PRESET_INGREDIENTS[0], id: 'bi-14', quantity: 400 }
          ],
          position: { x: 185, y: 280 },
          order: 4
        }
      ]
    },
    {
      id: 'sample-4',
      title: '奶油蘑菇意面',
      coverImage: undefined,
      cuisine: 'western' as CuisineType,
      difficulty: 2 as DifficultyLevel,
      totalTime: 25,
      description: '经典意式风味，奶油与蘑菇的香气令人陶醉。',
      author: '意面达人',
      authorAvatar: '🍝',
      createdAt: now,
      updatedAt: now,
      isFavorite: true,
      ratings: [4, 4, 5, 4],
      views: 167,
      blocks: [
        {
          id: 'block-12',
          title: '煮意面',
          description: '沸水中加盐，意面煮至八分熟捞出。',
          ingredients: [
            { ...PRESET_INGREDIENTS[2], id: 'bi-15' }
          ],
          position: { x: 50, y: 50 },
          order: 1
        },
        {
          id: 'block-13',
          title: '炒蘑菇',
          description: '黄油融化，加入蒜末和蘑菇片炒香。',
          ingredients: [
            { ...PRESET_INGREDIENTS[19], id: 'bi-16', quantity: 30 },
            { ...PRESET_INGREDIENTS[35], id: 'bi-17' },
            { ...PRESET_INGREDIENTS[32], id: 'bi-18', quantity: 3 }
          ],
          position: { x: 320, y: 50 },
          order: 2
        },
        {
          id: 'block-14',
          title: '加奶油混合',
          description: '倒入淡奶油煮至浓稠，加入意面拌匀，撒黑胡椒。',
          ingredients: [
            { ...PRESET_INGREDIENTS[21], id: 'bi-19', quantity: 200 }
          ],
          position: { x: 590, y: 50 },
          order: 3
        }
      ]
    }
  ]
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  recipes: [] as Recipe[],
  currentRecipe: null,
  customIngredients: [] as Ingredient[],
  isLoading: true,
  error: null,

  initStore: async () => {
    try {
      const storedRecipes = await idbGet('recipes')
      const storedCustomIngredients = await idbGet('customIngredients')

      let recipes: Recipe[] = ensureRecipes(storedRecipes)
      const customIngredients: Ingredient[] = ensureIngredients(storedCustomIngredients)

      if (recipes.length === 0) {
        recipes = createSampleRecipes()
        await idbSet('recipes', recipes)
      }

      set({ recipes, customIngredients, isLoading: false })
    } catch {
      set({
        recipes: createSampleRecipes(),
        customIngredients: [],
        isLoading: false,
        error: '加载数据失败'
      })
    }
  },

  createRecipe: (data) => {
    const newRecipe = createEmptyRecipe(data)
    const recipes = ensureRecipes(get().recipes)
    const updated = [...recipes, newRecipe]
    set({ recipes: updated, currentRecipe: newRecipe })
    idbSet('recipes', updated)
    return newRecipe
  },

  updateRecipe: (id, data) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.map((r) =>
      r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === id) {
      set({ currentRecipe: updated.find((r) => r.id === id) || null })
    }
    idbSet('recipes', updated)
  },

  deleteRecipe: (id) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.filter((r) => r.id !== id)
    set({
      recipes: updated,
      currentRecipe: get().currentRecipe?.id === id ? null : get().currentRecipe
    })
    idbSet('recipes', updated)
  },

  setCurrentRecipe: (id) => {
    if (id === null) {
      set({ currentRecipe: null })
      return
    }
    const recipes = ensureRecipes(get().recipes)
    const recipe = recipes.find((r) => r.id === id) || null
    set({ currentRecipe: recipe })
  },

  toggleFavorite: (id) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.map((r) =>
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === id) {
      set({ currentRecipe: updated.find((r) => r.id === id) || null })
    }
    idbSet('recipes', updated)
  },

  addRating: (id, rating) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.map((r) =>
      r.id === id ? { ...r, ratings: Array.isArray(r.ratings) ? [...r.ratings, rating] : [rating] } : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === id) {
      set({ currentRecipe: updated.find((r) => r.id === id) || null })
    }
    idbSet('recipes', updated)
  },

  incrementViews: (id) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.map((r) =>
      r.id === id ? { ...r, views: (typeof r.views === 'number' ? r.views : 0) + 1 } : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === id) {
      set({ currentRecipe: updated.find((r) => r.id === id) || null })
    }
    idbSet('recipes', updated)
  },

  addBlock: (recipeId, blockData) => {
    const recipes = ensureRecipes(get().recipes)
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    const recipeBlocks = Array.isArray(recipe.blocks) ? recipe.blocks : []
    const newBlock: CanvasBlock = {
      id: uuidv4(),
      title: blockData?.title || `步骤 ${recipeBlocks.length + 1}`,
      description: blockData?.description || '',
      imageUrl: blockData?.imageUrl,
      ingredients: Array.isArray(blockData?.ingredients) ? blockData!.ingredients! : [],
      position: blockData?.position || { x: 50 + recipeBlocks.length * 40, y: 50 + recipeBlocks.length * 30 },
      order: recipeBlocks.length + 1
    }

    const updated = recipes.map((r) =>
      r.id === recipeId
        ? { ...r, blocks: [...recipeBlocks, newBlock], updatedAt: new Date().toISOString() }
        : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === recipeId) {
      set({ currentRecipe: updated.find((r) => r.id === recipeId) || null })
    }
    idbSet('recipes', updated)
  },

  updateBlock: (recipeId, blockId, data) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.map((r) =>
      r.id === recipeId
        ? {
            ...r,
            blocks: Array.isArray(r.blocks)
              ? r.blocks.map((b) => (b.id === blockId ? { ...b, ...data } : b))
              : [],
            updatedAt: new Date().toISOString()
          }
        : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === recipeId) {
      set({ currentRecipe: updated.find((r) => r.id === recipeId) || null })
    }
    idbSet('recipes', updated)
  },

  deleteBlock: (recipeId, blockId) => {
    const recipes = ensureRecipes(get().recipes)
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    const recipeBlocks = Array.isArray(recipe.blocks) ? recipe.blocks : []
    const targetBlock = recipeBlocks.find((b) => b.id === blockId)
    if (!targetBlock) return

    const remainingBlocks = recipeBlocks
      .filter((b) => b.id !== blockId)
      .map((b) => {
        if (b.order > targetBlock.order) {
          return { ...b, order: b.order - 1 }
        }
        return b
      })

    const updated = recipes.map((r) =>
      r.id === recipeId
        ? { ...r, blocks: remainingBlocks, updatedAt: new Date().toISOString() }
        : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === recipeId) {
      set({ currentRecipe: updated.find((r) => r.id === recipeId) || null })
    }
    idbSet('recipes', updated)
  },

  reorderBlocks: (recipeId, orderedIds) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.map((r) => {
      if (r.id !== recipeId) return r
      const blocks = Array.isArray(r.blocks) ? r.blocks : []
      const newBlocks = orderedIds
        .map((id, index) => {
          const block = blocks.find((b) => b.id === id)
          if (block) {
            return { ...block, order: index + 1 }
          }
          return null
        })
        .filter((b): b is CanvasBlock => b !== null)
      return { ...r, blocks: newBlocks, updatedAt: new Date().toISOString() }
    })
    set({ recipes: updated })
    if (get().currentRecipe?.id === recipeId) {
      set({ currentRecipe: updated.find((r) => r.id === recipeId) || null })
    }
    idbSet('recipes', updated)
  },

  addIngredientToBlock: (recipeId, blockId, ingredient) => {
    const recipes = ensureRecipes(get().recipes)
    const newIngredient = { ...ingredient, id: `${ingredient.id}-${Date.now()}` }
    const updated = recipes.map((r) =>
      r.id === recipeId
        ? {
            ...r,
            blocks: Array.isArray(r.blocks)
              ? r.blocks.map((b) =>
                  b.id === blockId
                    ? { ...b, ingredients: Array.isArray(b.ingredients) ? [...b.ingredients, newIngredient] : [newIngredient] }
                    : b
                )
              : [],
            updatedAt: new Date().toISOString()
          }
        : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === recipeId) {
      set({ currentRecipe: updated.find((r) => r.id === recipeId) || null })
    }
    idbSet('recipes', updated)
  },

  removeIngredientFromBlock: (recipeId, blockId, ingredientId) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.map((r) =>
      r.id === recipeId
        ? {
            ...r,
            blocks: Array.isArray(r.blocks)
              ? r.blocks.map((b) =>
                  b.id === blockId
                    ? { ...b, ingredients: Array.isArray(b.ingredients) ? b.ingredients.filter((i) => i.id !== ingredientId) : [] }
                    : b
                )
              : [],
            updatedAt: new Date().toISOString()
          }
        : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === recipeId) {
      set({ currentRecipe: updated.find((r) => r.id === recipeId) || null })
    }
    idbSet('recipes', updated)
  },

  updateBlockIngredient: (recipeId, blockId, ingredientId, data) => {
    const recipes = ensureRecipes(get().recipes)
    const updated = recipes.map((r) =>
      r.id === recipeId
        ? {
            ...r,
            blocks: Array.isArray(r.blocks)
              ? r.blocks.map((b) =>
                  b.id === blockId
                    ? {
                        ...b,
                        ingredients: Array.isArray(b.ingredients)
                          ? b.ingredients.map((i) =>
                              i.id === ingredientId ? { ...i, ...data } : i
                            )
                          : []
                      }
                    : b
                )
              : [],
            updatedAt: new Date().toISOString()
          }
        : r
    )
    set({ recipes: updated })
    if (get().currentRecipe?.id === recipeId) {
      set({ currentRecipe: updated.find((r) => r.id === recipeId) || null })
    }
    idbSet('recipes', updated)
  },

  addCustomIngredient: (ingredient) => {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: `custom-${uuidv4()}`
    }
    const customIngredients = ensureIngredients(get().customIngredients)
    const updated = [...customIngredients, newIngredient]
    set({ customIngredients: updated })
    idbSet('customIngredients', updated)
  },

  getAllIngredients: () => {
    return [...PRESET_INGREDIENTS, ...ensureIngredients(get().customIngredients)]
  }
}))
