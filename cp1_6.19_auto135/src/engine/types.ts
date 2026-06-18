export type PersonalityDimension = 'Melody' | 'Rhythm' | 'Lyric' | 'Mood' | 'Complexity'

export interface Option {
  id: string
  text: string
  dimension: PersonalityDimension
  score: number
}

export interface Question {
  id: number
  text: string
  options: Option[]
}

export interface Profile {
  id?: string
  nickname?: string
  dimensions: Record<PersonalityDimension, number>
  primaryType: PersonalityDimension
  secondaryType: PersonalityDimension
}

export interface MatchResult {
  profile: Profile
  similarity: number
}

export interface Answer {
  questionId: number
  optionId: string
}

export type PageType = 'test' | 'result' | 'match'
