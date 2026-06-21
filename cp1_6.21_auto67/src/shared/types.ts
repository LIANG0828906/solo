export interface Recipe {
  id: string
  name: string
  ingredients: string[]
  duration: number
  difficulty: 1 | 2 | 3 | 4 | 5
  steps: string[]
  imageGradient: string
}

export interface MatchedRecipe extends Recipe {
  matchRate: number
  matchedIngredients: string[]
  missingIngredients: string[]
}

export interface IdentifyResponse {
  success: boolean
  ingredients: string[]
  processingTime: number
}

export interface RecipeRequest {
  ingredients: string[]
}

export interface RecipeResponse {
  success: boolean
  recipes: MatchedRecipe[]
  total: number
}

export interface UploadedImage {
  id: string
  file: File
  thumbnail: string
}
