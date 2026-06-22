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

export interface TranslationResultData {
  dishName: {
    original: string
    translated: string
  }
  ingredients: ReplacedIngredient[]
  steps: {
    original: string
    translated: string
  }[]
  region: string
  sourceLang: string
  targetLang: string
}

export interface RecipeInput {
  dishName: string
  ingredients: string[]
  steps: string[]
}

export interface LanguageOption {
  code: string
  label: string
  flag: string
}

export interface RegionOption {
  code: string
  label: string
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'en', label: 'English (英文)', flag: '🇺🇸' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
]

export const REGIONS: RegionOption[] = [
  { code: 'US', label: '🇺🇸 美国 (United States)' },
  { code: 'UK', label: '🇬🇧 英国 (United Kingdom)' },
  { code: 'JP', label: '🇯🇵 日本 (Japan)' },
]
