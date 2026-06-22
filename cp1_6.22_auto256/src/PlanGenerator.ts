import { v4 as uuidv4 } from 'uuid'
import type { User, WeatherData, SportItem, RecommendedPlan, FitnessLevel, SportType } from '@/types'

const SPORTS_LIBRARY: SportItem[] = [
  {
    id: 'sport-cycling-1',
    name: '城郊休闲骑行',
    type: 'cycling',
    duration: 120,
    difficulty: 2,
    suitableFitness: ['beginner', 'intermediate', 'advanced'],
    weatherConstraints: { maxPrecipitation: 70, minTemperature: 15, maxTemperature: 32, maxWindLevel: 3 }
  },
  {
    id: 'sport-cycling-2',
    name: '山地越野骑行',
    type: 'cycling',
    duration: 180,
    difficulty: 4,
    suitableFitness: ['intermediate', 'advanced'],
    weatherConstraints: { maxPrecipitation: 50, minTemperature: 15, maxTemperature: 30, maxWindLevel: 3 }
  },
  {
    id: 'sport-hiking-1',
    name: '公园轻徒步',
    type: 'hiking',
    duration: 90,
    difficulty: 1,
    suitableFitness: ['beginner', 'intermediate', 'advanced'],
    weatherConstraints: { maxPrecipitation: 80, minTemperature: 15, maxTemperature: 33, maxWindLevel: 4 }
  },
  {
    id: 'sport-hiking-2',
    name: '郊野徒步穿越',
    type: 'hiking',
    duration: 240,
    difficulty: 3,
    suitableFitness: ['intermediate', 'advanced'],
    weatherConstraints: { maxPrecipitation: 60, minTemperature: 15, maxTemperature: 32, maxWindLevel: 4 }
  },
  {
    id: 'sport-running-1',
    name: '公园慢跑',
    type: 'running',
    duration: 45,
    difficulty: 2,
    suitableFitness: ['beginner', 'intermediate', 'advanced'],
    weatherConstraints: { maxPrecipitation: 50, minTemperature: 15, maxTemperature: 30, maxWindLevel: 3 }
  },
  {
    id: 'sport-running-2',
    name: '公路长距离跑',
    type: 'running',
    duration: 120,
    difficulty: 4,
    suitableFitness: ['intermediate', 'advanced'],
    weatherConstraints: { maxPrecipitation: 40, minTemperature: 15, maxTemperature: 28, maxWindLevel: 2 }
  },
  {
    id: 'sport-climbing-1',
    name: '低海拔登山',
    type: 'climbing',
    duration: 180,
    difficulty: 3,
    suitableFitness: ['intermediate', 'advanced'],
    weatherConstraints: { maxPrecipitation: 30, minTemperature: 15, maxTemperature: 28, maxWindLevel: 3 }
  },
  {
    id: 'sport-climbing-2',
    name: '高难度登山探险',
    type: 'climbing',
    duration: 300,
    difficulty: 5,
    suitableFitness: ['advanced'],
    weatherConstraints: { maxPrecipitation: 20, minTemperature: 15, maxTemperature: 25, maxWindLevel: 2 }
  }
]

export class PlanGenerator {
  private sports: SportItem[]

  constructor() {
    this.sports = SPORTS_LIBRARY
  }

  filterByWeather(sport: SportItem, weather: WeatherData): boolean {
    const c = sport.weatherConstraints
    return (
      weather.precipitation <= c.maxPrecipitation &&
      weather.temperature >= c.minTemperature &&
      weather.temperature <= c.maxTemperature &&
      weather.windLevel <= c.maxWindLevel
    )
  }

  filterByFitness(sport: SportItem, fitnessLevel: FitnessLevel): boolean {
    return sport.suitableFitness.includes(fitnessLevel)
  }

  filterByPreference(sport: SportItem, preferences: SportType[]): boolean {
    if (preferences.length === 0) return true
    return preferences.includes(sport.type)
  }

  calculateWeatherMatch(sport: SportItem, weather: WeatherData): number {
    const c = sport.weatherConstraints
    let score = 100

    const precipPenalty = (weather.precipitation / c.maxPrecipitation) * 40
    score -= precipPenalty

    const tempMid = (c.minTemperature + c.maxTemperature) / 2
    const tempDiff = Math.abs(weather.temperature - tempMid)
    const tempPenalty = (tempDiff / (c.maxTemperature - c.minTemperature)) * 30
    score -= tempPenalty

    const windPenalty = (weather.windLevel / c.maxWindLevel) * 30
    score -= windPenalty

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  calculateScore(sport: SportItem, weather: WeatherData, user: User): number {
    const weatherMatch = this.calculateWeatherMatch(sport, weather)
    const weatherWeight = 0.5

    const fitnessOrder: FitnessLevel[] = ['beginner', 'intermediate', 'advanced']
    const userFitnessIdx = fitnessOrder.indexOf(user.fitnessLevel)
    const suitableIdx = sport.suitableFitness.map(f => fitnessOrder.indexOf(f))
    const minSuitableIdx = Math.min(...suitableIdx)
    const maxSuitableIdx = Math.max(...suitableIdx)
    let fitnessScore = 100
    if (userFitnessIdx < minSuitableIdx) {
      fitnessScore = 100 - (minSuitableIdx - userFitnessIdx) * 25
    } else if (userFitnessIdx > maxSuitableIdx) {
      fitnessScore = 80
    }
    const fitnessWeight = 0.3

    const preferenceScore = user.preferences.includes(sport.type) ? 100 : 60
    const preferenceWeight = 0.2

    const totalScore =
      weatherMatch * weatherWeight +
      fitnessScore * fitnessWeight +
      preferenceScore * preferenceWeight

    return Math.round(totalScore)
  }

  generate(user: User, weatherList: WeatherData[]): RecommendedPlan[] {
    const recommendations: RecommendedPlan[] = []

    for (const sport of this.sports) {
      if (!this.filterByFitness(sport, user.fitnessLevel)) continue
      if (!this.filterByPreference(sport, user.preferences)) continue

      for (const weather of weatherList) {
        if (!this.filterByWeather(sport, weather)) continue

        const weatherMatch = this.calculateWeatherMatch(sport, weather)
        const score = this.calculateScore(sport, weather, user)

        recommendations.push({
          id: uuidv4(),
          sport,
          weather,
          score,
          weatherMatch
        })
      }
    }

    recommendations.sort((a, b) => b.score - a.score)

    return recommendations.slice(0, 5)
  }

  getAllSports(): SportItem[] {
    return [...this.sports]
  }
}

export const planGenerator = new PlanGenerator()
