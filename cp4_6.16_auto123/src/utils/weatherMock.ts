export type WeatherType = 'tropical' | 'cold' | 'temperate' | 'desert' | 'rainy'

export interface WeatherData {
  city: string
  temperature: number
  condition: string
  type: WeatherType
  humidity: number
  forecast: Array<{
    day: string
    high: number
    low: number
    condition: string
  }>
}

const weatherDatabase: Record<string, WeatherData> = {
  '三亚': {
    city: '三亚',
    temperature: 28,
    condition: '晴朗',
    type: 'tropical',
    humidity: 85,
    forecast: [
      { day: '周一', high: 30, low: 25, condition: '晴' },
      { day: '周二', high: 31, low: 26, condition: '多云' },
      { day: '周三', high: 29, low: 25, condition: '阵雨' },
      { day: '周四', high: 30, low: 25, condition: '晴' },
      { day: '周五', high: 32, low: 27, condition: '晴' },
    ]
  },
  '哈尔滨': {
    city: '哈尔滨',
    temperature: -15,
    condition: '小雪',
    type: 'cold',
    humidity: 65,
    forecast: [
      { day: '周一', high: -10, low: -20, condition: '小雪' },
      { day: '周二', high: -8, low: -18, condition: '多云' },
      { day: '周三', high: -12, low: -22, condition: '晴' },
      { day: '周四', high: -10, low: -19, condition: '晴' },
      { day: '周五', high: -7, low: -16, condition: '多云' },
    ]
  },
  '北京': {
    city: '北京',
    temperature: 22,
    condition: '多云',
    type: 'temperate',
    humidity: 45,
    forecast: [
      { day: '周一', high: 25, low: 15, condition: '多云' },
      { day: '周二', high: 27, low: 16, condition: '晴' },
      { day: '周三', high: 24, low: 14, condition: '阴' },
      { day: '周四', high: 26, low: 15, condition: '晴' },
      { day: '周五', high: 28, low: 17, condition: '晴' },
    ]
  },
  '上海': {
    city: '上海',
    temperature: 24,
    condition: '小雨',
    type: 'rainy',
    humidity: 78,
    forecast: [
      { day: '周一', high: 26, low: 20, condition: '小雨' },
      { day: '周二', high: 25, low: 19, condition: '中雨' },
      { day: '周三', high: 27, low: 21, condition: '多云' },
      { day: '周四', high: 28, low: 22, condition: '晴' },
      { day: '周五', high: 29, low: 23, condition: '晴' },
    ]
  },
  '迪拜': {
    city: '迪拜',
    temperature: 38,
    condition: '酷热',
    type: 'desert',
    humidity: 30,
    forecast: [
      { day: '周一', high: 42, low: 30, condition: '晴' },
      { day: '周二', high: 43, low: 31, condition: '晴' },
      { day: '周三', high: 41, low: 29, condition: '晴' },
      { day: '周四', high: 42, low: 30, condition: '晴' },
      { day: '周五', high: 44, low: 32, condition: '晴' },
    ]
  },
  '东京': {
    city: '东京',
    temperature: 18,
    condition: '樱花盛开',
    type: 'temperate',
    humidity: 60,
    forecast: [
      { day: '周一', high: 20, low: 12, condition: '晴' },
      { day: '周二', high: 22, low: 14, condition: '晴' },
      { day: '周三', high: 19, low: 11, condition: '多云' },
      { day: '周四', high: 21, low: 13, condition: '晴' },
      { day: '周五', high: 23, low: 15, condition: '晴' },
    ]
  }
}

const defaultWeather: Record<WeatherType, Omit<WeatherData, 'city'>> = {
  tropical: {
    temperature: 30,
    condition: '热带气候',
    type: 'tropical',
    humidity: 80,
    forecast: [
      { day: '周一', high: 32, low: 26, condition: '晴' },
      { day: '周二', high: 33, low: 27, condition: '多云' },
      { day: '周三', high: 31, low: 25, condition: '阵雨' },
      { day: '周四', high: 32, low: 26, condition: '晴' },
      { day: '周五', high: 33, low: 27, condition: '晴' },
    ]
  },
  cold: {
    temperature: -5,
    condition: '寒冷',
    type: 'cold',
    humidity: 60,
    forecast: [
      { day: '周一', high: 0, low: -10, condition: '晴' },
      { day: '周二', high: 2, low: -8, condition: '多云' },
      { day: '周三', high: -2, low: -12, condition: '小雪' },
      { day: '周四', high: 0, low: -10, condition: '晴' },
      { day: '周五', high: 3, low: -7, condition: '晴' },
    ]
  },
  temperate: {
    temperature: 20,
    condition: '温和',
    type: 'temperate',
    humidity: 55,
    forecast: [
      { day: '周一', high: 23, low: 14, condition: '晴' },
      { day: '周二', high: 25, low: 15, condition: '晴' },
      { day: '周三', high: 22, low: 13, condition: '多云' },
      { day: '周四', high: 24, low: 14, condition: '晴' },
      { day: '周五', high: 26, low: 16, condition: '晴' },
    ]
  },
  desert: {
    temperature: 35,
    condition: '干燥酷热',
    type: 'desert',
    humidity: 25,
    forecast: [
      { day: '周一', high: 40, low: 25, condition: '晴' },
      { day: '周二', high: 41, low: 26, condition: '晴' },
      { day: '周三', high: 39, low: 24, condition: '晴' },
      { day: '周四', high: 40, low: 25, condition: '晴' },
      { day: '周五', high: 42, low: 27, condition: '晴' },
    ]
  },
  rainy: {
    temperature: 18,
    condition: '多雨',
    type: 'rainy',
    humidity: 80,
    forecast: [
      { day: '周一', high: 20, low: 15, condition: '小雨' },
      { day: '周二', high: 19, low: 14, condition: '中雨' },
      { day: '周三', high: 21, low: 16, condition: '阵雨' },
      { day: '周四', high: 22, low: 17, condition: '多云' },
      { day: '周五', high: 23, low: 18, condition: '晴' },
    ]
  }
}

export function getWeatherByCity(city: string): WeatherData {
  if (weatherDatabase[city]) {
    return weatherDatabase[city]
  }
  
  const hash = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const types: WeatherType[] = ['tropical', 'cold', 'temperate', 'desert', 'rainy']
  const type = types[hash % types.length]
  
  return {
    city,
    ...defaultWeather[type]
  }
}

export function getWeatherTypeAdvice(type: WeatherType): string[] {
  const advice: Record<WeatherType, string[]> = {
    tropical: [
      '建议携带防晒霜SPF50+',
      '准备透气轻薄的衣物',
      '别忘了泳衣和沙滩装备',
      '建议携带驱蚊液',
      '带一副太阳镜保护眼睛'
    ],
    cold: [
      '务必携带厚羽绒服',
      '准备保暖内衣套装',
      '带好帽子、围巾、手套',
      '建议携带暖宝宝',
      '穿防滑防水的雪地靴'
    ],
    temperate: [
      '携带薄外套应对早晚温差',
      '准备舒适的步行鞋',
      '建议带一把折叠伞',
      '衣物以长袖长裤为主',
      '可备一件薄毛衣'
    ],
    desert: [
      '高倍数防晒霜必备',
      '准备遮阳帽和太阳镜',
      '衣物选择长袖防晒款',
      '随身携带充足饮用水',
      '建议带润唇膏和保湿霜'
    ],
    rainy: [
      '一定要带雨伞或雨衣',
      '准备防水鞋套',
      '建议携带速干衣物',
      '电子产品注意防水',
      '多备几双袜子'
    ]
  }
  return advice[type]
}
