export interface SM2Input {
  quality: number
  easinessFactor: number
  interval: number
  repetitions: number
}

export interface SM2Output {
  easinessFactor: number
  interval: number
  repetitions: number
  nextReviewDate: string
}

export function sm2(input: SM2Input): SM2Output {
  const { quality, easinessFactor, interval, repetitions } = input

  let newEasinessFactor =
    easinessFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  if (newEasinessFactor < 1.3) {
    newEasinessFactor = 1.3
  }

  let newRepetitions: number
  let newInterval: number

  if (quality < 3) {
    newRepetitions = 0
    newInterval = 1
  } else {
    newRepetitions = repetitions + 1
    if (repetitions === 0) {
      newInterval = 1
    } else if (repetitions === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEasinessFactor)
    }
  }

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  return {
    easinessFactor: newEasinessFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: nextReviewDate.toISOString().split('T')[0]
  }
}

export function isCardDueForReview(nextReviewDate: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return nextReviewDate <= today
}
