import type { Answer, Profile, PersonalityDimension, MatchResult } from './types'
import { questions } from '../data/questions'
import { virtualFriends } from '../data/virtualFriends'

const DIMENSIONS: PersonalityDimension[] = ['Melody', 'Rhythm', 'Lyric', 'Mood', 'Complexity']

const MAX_SCORE_PER_DIMENSION = 15 * 25

export function calculateProfile(answers: Answer[]): Profile {
  const dimensionScores: Record<PersonalityDimension, number> = {
    Melody: 0,
    Rhythm: 0,
    Lyric: 0,
    Mood: 0,
    Complexity: 0,
  }

  answers.forEach((answer) => {
    const question = questions.find((q) => q.id === answer.questionId)
    if (!question) return

    const option = question.options.find((o) => o.id === answer.optionId)
    if (!option) return

    dimensionScores[option.dimension] += option.score
  })

  const normalizedDimensions: Record<PersonalityDimension, number> = {
    Melody: Math.round((dimensionScores.Melody / MAX_SCORE_PER_DIMENSION) * 100),
    Rhythm: Math.round((dimensionScores.Rhythm / MAX_SCORE_PER_DIMENSION) * 100),
    Lyric: Math.round((dimensionScores.Lyric / MAX_SCORE_PER_DIMENSION) * 100),
    Mood: Math.round((dimensionScores.Mood / MAX_SCORE_PER_DIMENSION) * 100),
    Complexity: Math.round((dimensionScores.Complexity / MAX_SCORE_PER_DIMENSION) * 100),
  }

  const sorted = DIMENSIONS.sort(
    (a, b) => normalizedDimensions[b] - normalizedDimensions[a]
  )

  return {
    dimensions: normalizedDimensions,
    primaryType: sorted[0],
    secondaryType: sorted[1],
  }
}

export function calculateSimilarity(
  profileA: Profile,
  profileB: Profile
): number {
  const dims = DIMENSIONS
  let dotProduct = 0
  let normA = 0
  let normB = 0

  dims.forEach((dim) => {
    const a = profileA.dimensions[dim]
    const b = profileB.dimensions[dim]
    dotProduct += a * b
    normA += a * a
    normB += b * b
  })

  if (normA === 0 || normB === 0) return 0

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  return Math.round(similarity * 100)
}

export function getTopMatches(
  profile: Profile,
  count: number = 3
): MatchResult[] {
  const results: MatchResult[] = virtualFriends.map((friend) => ({
    profile: friend,
    similarity: calculateSimilarity(profile, friend),
  }))

  results.sort((a, b) => b.similarity - a.similarity)

  return results.slice(0, count)
}

export function generateProfileHash(profile: Profile): string {
  const data = JSON.stringify(profile.dimensions) + Date.now()
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36).substring(0, 8)
}

export function saveProfileToStorage(profile: Profile): void {
  try {
    const saved = getSavedProfiles()
    if (profile.id && saved.some((p) => p.id === profile.id)) {
      const index = saved.findIndex((p) => p.id === profile.id)
      saved[index] = profile
    } else {
      saved.push(profile)
    }
    localStorage.setItem('music_profiles', JSON.stringify(saved))
  } catch (e) {
    console.error('Failed to save profile:', e)
  }
}

export function getSavedProfiles(): Profile[] {
  try {
    const data = localStorage.getItem('music_profiles')
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getProfileByHash(hash: string): Profile | null {
  const profiles = getSavedProfiles()
  return profiles.find((p) => p.id === hash) || null
}
