import { Router, type Request, type Response } from 'express'
import { seedRecipes, type Recipe } from '../data/seedRecipes.js'

export let recipes: Recipe[] = [...seedRecipes]

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { keyword, cuisine } = req.query

  let result = [...recipes]

  if (cuisine && typeof cuisine === 'string') {
    result = result.filter((r) => r.cuisine === cuisine)
  }

  if (keyword && typeof keyword === 'string') {
    const kw = keyword.toLowerCase()
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(kw)),
    )
  }

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response) => {
  const recipe = recipes.find((r) => r.id === req.params.id)
  if (!recipe) {
    res.status(404).json({ success: false, error: 'Recipe not found' })
    return
  }
  res.json({ success: true, data: recipe })
})

router.post('/', (req: Request, res: Response) => {
  const body = req.body
  const newRecipe: Recipe = {
    id: Date.now().toString(),
    name: body.name,
    coverImage: body.coverImage ?? '',
    author: body.author,
    prepTime: body.prepTime,
    cookTime: body.cookTime,
    difficulty: body.difficulty,
    cuisine: body.cuisine,
    ingredients: body.ingredients,
    steps: body.steps,
    likes: 0,
  }
  recipes.push(newRecipe)
  res.json({ success: true, data: newRecipe })
})

export default router
