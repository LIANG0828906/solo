import { Router, type Request, type Response } from 'express'
import { recipes } from './recipes.js'
import type { Ingredient } from '../data/seedRecipes.js'

interface GroceryItem {
  name: string
  amount: string
  category: 'vegetable' | 'meat' | 'seasoning' | 'other'
  checked: boolean
  recipeSource: string
}

const router = Router()

router.post('/generate-list', (req: Request, res: Response) => {
  const { recipeIds } = req.body as { recipeIds: string[] }

  const items: GroceryItem[] = []

  for (const id of recipeIds) {
    const recipe = recipes.find((r) => r.id === id)
    if (!recipe) continue

    for (const ing of recipe.ingredients) {
      items.push({
        name: ing.name,
        amount: ing.amount,
        category: ing.category,
        checked: false,
        recipeSource: recipe.name,
      })
    }
  }

  const categoryOrder: Ingredient['category'][] = ['meat', 'vegetable', 'seasoning', 'other']
  items.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))

  res.json({ success: true, data: { items, totalCount: items.length } })
})

export default router
