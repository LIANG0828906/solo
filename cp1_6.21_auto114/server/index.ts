import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import type { WeatherData, WeatherCondition, CharacterConfig } from '../src/types'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const conditions: WeatherCondition[] = ['sunny', 'rainy', 'snowy', 'cloudy']

function generateWeather(city: string): WeatherData {
  const condition = conditions[Math.floor(Math.random() * conditions.length)]
  let tempRange: [number, number]
  switch (condition) {
    case 'sunny':
      tempRange = [20, 35]
      break
    case 'rainy':
      tempRange = [10, 20]
      break
    case 'snowy':
      tempRange = [-10, 0]
      break
    case 'cloudy':
      tempRange = [15, 25]
      break
  }
  const temperature = Math.round(tempRange[0] + Math.random() * (tempRange[1] - tempRange[0]))
  const humidity = Math.round(40 + Math.random() * 50)
  const windSpeed = Math.round(5 + Math.random() * 25)

  return {
    city,
    temperature,
    condition,
    humidity,
    windSpeed,
  }
}

app.get('/api/weather', (req, res) => {
  const city = (req.query.city as string) || '北京'
  const weather = generateWeather(city)
  res.json(weather)
})

const defaultConfig: CharacterConfig = {
  hatColor: '#EF4444',
  clothesColor: '#6366F1',
  eyeSize: 20,
  showGlasses: false,
  skinColor: '#FCD34D',
}

app.get('/api/config', (req, res) => {
  res.json(defaultConfig)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
