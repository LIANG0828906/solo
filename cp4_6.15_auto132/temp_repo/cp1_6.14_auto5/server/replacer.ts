import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { TranslationResult } from './translator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface IngredientReplacement {
  name: string
  reason: string
}

export interface IngredientMapEntry {
  translation: string
  replacements: IngredientReplacement[]
}

export interface ReplacedIngredient {
  original: string
  translated: string
  replaced: boolean
  selectedReplacement: IngredientReplacement | null
  availableReplacements: IngredientReplacement[]
  mapEntry?: IngredientMapEntry
}

export interface ReplaceResult {
  ingredients: ReplacedIngredient[]
  steps: TranslationResult[]
  region: string
}

let ingredientMapCache: Record<string, Record<string, IngredientMapEntry>> | null = null

function loadIngredientMap(): Record<string, Record<string, IngredientMapEntry>> {
  if (ingredientMapCache) return ingredientMapCache

  const mapPath = path.resolve(__dirname, '..', 'data', 'ingredient-map.json')

  try {
    const raw = fs.readFileSync(mapPath, 'utf-8')
    ingredientMapCache = JSON.parse(raw) as Record<string, Record<string, IngredientMapEntry>>
  } catch (e) {
    console.error('[Replacer] Failed to load ingredient map:', e)
    ingredientMapCache = {}
  }

  return ingredientMapCache!
}

export function getAvailableRegions(): string[] {
  const map = loadIngredientMap()
  return Object.keys(map)
}

export function replaceIngredients(
  ingredientList: string[],
  translatedIngredients: TranslationResult[],
  region: string
): ReplacedIngredient[] {
  const map = loadIngredientMap()
  const regionMap = map[region] || {}

  return ingredientList.map((original, idx) => {
    const translated = translatedIngredients[idx]?.text || original

    let matchedEntry: IngredientMapEntry | undefined
    let matchedKey = ''

    const sortedKeys = Object.keys(regionMap).sort((a, b) => b.length - a.length)
    for (const key of sortedKeys) {
      if (original.includes(key)) {
        matchedEntry = regionMap[key]
        matchedKey = key
        break
      }
    }

    if (matchedEntry) {
      const finalTranslation = original.replace(matchedKey, matchedEntry.translation)

      return {
        original,
        translated: finalTranslation,
        replaced: true,
        selectedReplacement: matchedEntry.replacements[0] || null,
        availableReplacements: matchedEntry.replacements,
        mapEntry: matchedEntry,
      }
    }

    return {
      original,
      translated,
      replaced: false,
      selectedReplacement: null,
      availableReplacements: [],
    }
  })
}

export function updateReplacement(
  ingredient: ReplacedIngredient,
  replacementIndex: number
): ReplacedIngredient {
  if (!ingredient.availableReplacements[replacementIndex]) {
    return ingredient
  }
  return {
    ...ingredient,
    selectedReplacement: ingredient.availableReplacements[replacementIndex],
  }
}
