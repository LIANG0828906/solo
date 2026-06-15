import { ref, computed, reactive } from 'vue'

export type DataDimension = 'population' | 'traffic' | 'airQuality'

export interface BlockData {
  id: number
  name: string
  row: number
  col: number
  population: number
  traffic: number
  airQuality: number
  hourlyData: {
    population: number[]
    traffic: number[]
    airQuality: number[]
  }
}

export interface ThemeColors {
  name: string
  low: string
  mid: string
  high: string
}

export const themes: ThemeColors[] = [
  { name: '经典', low: '#00ff88', mid: '#ffdd00', high: '#ff3366' },
  { name: '海洋', low: '#00d4ff', mid: '#0088ff', high: '#0044cc' },
  { name: '火焰', low: '#ffd700', mid: '#ff6600', high: '#cc0000' },
  { name: '极光', low: '#00ffaa', mid: '#aa00ff', high: '#ff0088' },
]

const areaNames = [
  '中央商务区', '科技园区', '住宅区A', '住宅区B', '工业区', '商贸区', '文化中心', '交通枢纽',
  '高新区', '金融街', '大学城', '生态公园', '物流中心', '旅游景区', '医疗中心', '体育场馆',
  '政务中心', '会展中心', '创意园区', '港口区', '航空城', '保税区', '软件园', '数据中心',
  '研发基地', '培训中心', '养老社区', '少年活动', '图书馆', '博物馆', '美术馆', '剧院',
  '体育馆', '游泳馆', '网球场', '高尔夫', '滑雪场', '健身房', '游乐园', '动物园',
  '植物园', '湿地公园', '森林公园', '地质公园', '历史街区', '民俗村', '农家乐', '度假村',
  '温泉酒店', '购物中心', '步行街', '美食街', '酒吧街', '夜市', '批发市场', '超市',
  '便利店', '药店', '医院', '诊所', '社区中心', '派出所', '消防局', '供电局', '水厂',
  '燃气站', '通信基站', '变电站', '污水处理', '垃圾处理', '公交站', '地铁站', '火车站',
  '机场', '港口', '码头', '停车场', '加油站', '充电站', '维修站', '洗车行',
  '学校', '幼儿园', '小学', '中学', '高中', '职业学院', '研究院', '实验室',
  '检测中心', '认证机构', '律师事务所', '会计师事务所', '咨询公司', '广告公司', '设计公司', '建筑公司',
  '房地产', '物业公司', '保险公司', '银行', '证券公司', '基金公司', '投资公司', '信托公司',
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function generateHourlyPattern(baseValue: number, random: () => number): number[] {
  const pattern = new Array(24).fill(0)
  const peak1 = 7 + Math.floor(random() * 2)
  const peak2 = 17 + Math.floor(random() * 3)
  const amplitude = 20 + random() * 30

  for (let h = 0; h < 24; h++) {
    const dist1 = Math.abs(h - peak1)
    const dist2 = Math.abs(h - peak2)
    const wave1 = Math.exp(-dist1 * dist1 / 8) * amplitude
    const wave2 = Math.exp(-dist2 * dist2 / 12) * amplitude * 0.8
    const noise = (random() - 0.5) * 10
    pattern[h] = Math.max(0, Math.min(100, baseValue + wave1 + wave2 + noise))
  }
  return pattern
}

export function useHeatmapData(rows: number = 8, cols: number = 8) {
  const currentDimension = ref<DataDimension>('population')
  const currentHour = ref(0)
  const currentTheme = ref(0)
  const blocks = ref<BlockData[]>([])
  const isAnimating = ref(false)

  const animationState = reactive({
    targetHeights: new Float32Array(rows * cols),
    currentHeights: new Float32Array(rows * cols),
    targetColors: new Float32Array(rows * cols * 3),
    currentColors: new Float32Array(rows * cols * 3),
  })

  function generateData(): BlockData[] {
    const total = rows * cols
    const random = seededRandom(rows * 1000 + cols)
    const result: BlockData[] = []

    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      const centerDist = Math.sqrt(
        Math.pow(row - rows / 2, 2) + Math.pow(col - cols / 2, 2)
      ) / Math.sqrt(rows * rows + cols * cols)

      const popBase = (1 - centerDist * 0.7) * 50 + random() * 30
      const trafficBase = (1 - centerDist * 0.5) * 40 + random() * 35
      const airBase = centerDist * 40 + random() * 35

      result.push({
        id: i,
        name: areaNames[i % areaNames.length],
        row,
        col,
        population: popBase,
        traffic: trafficBase,
        airQuality: airBase,
        hourlyData: {
          population: generateHourlyPattern(popBase, random),
          traffic: generateHourlyPattern(trafficBase, random),
          airQuality: generateHourlyPattern(airBase, random),
        },
      })

      animationState.targetHeights[i] = popBase
      animationState.currentHeights[i] = popBase
      animationState.targetColors[i * 3] = 0
      animationState.targetColors[i * 3 + 1] = 1
      animationState.targetColors[i * 3 + 2] = 0.5
      animationState.currentColors[i * 3] = 0
      animationState.currentColors[i * 3 + 1] = 1
      animationState.currentColors[i * 3 + 2] = 0.5
    }

    return result
  }

  function initData() {
    blocks.value = generateData()
    updateTargets()
  }

  function getBlockValue(block: BlockData, hour?: number, dimension?: DataDimension): number {
    const dim = dimension || currentDimension.value
    const h = hour !== undefined ? hour : currentHour.value
    return block.hourlyData[dim][h]
  }

  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1, 1, 1]
  }

  function interpolateColor(t: number, colors: ThemeColors): [number, number, number] {
    const low = hexToRgb(colors.low)
    const mid = hexToRgb(colors.mid)
    const high = hexToRgb(colors.high)

    if (t < 0.5) {
      const tt = t * 2
      return [
        low[0] + (mid[0] - low[0]) * tt,
        low[1] + (mid[1] - low[1]) * tt,
        low[2] + (mid[2] - low[2]) * tt,
      ]
    } else {
      const tt = (t - 0.5) * 2
      return [
        mid[0] + (high[0] - mid[0]) * tt,
        mid[1] + (high[1] - mid[1]) * tt,
        mid[2] + (high[2] - mid[2]) * tt,
      ]
    }
  }

  function updateTargets() {
    const theme = themes[currentTheme.value]
    blocks.value.forEach((block, i) => {
      const heightValue = getBlockValue(block)
      const colorValue = block.hourlyData.traffic[currentHour.value]

      animationState.targetHeights[i] = heightValue

      const [r, g, b] = interpolateColor(colorValue / 100, theme)
      animationState.targetColors[i * 3] = r
      animationState.targetColors[i * 3 + 1] = g
      animationState.targetColors[i * 3 + 2] = b
    })
  }

  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  function updateAnimation(progress: number) {
    const eased = easeInOut(progress)
    blocks.value.forEach((_, i) => {
      animationState.currentHeights[i] =
        animationState.currentHeights[i] +
        (animationState.targetHeights[i] - animationState.currentHeights[i]) * eased
      animationState.currentColors[i * 3] =
        animationState.currentColors[i * 3] +
        (animationState.targetColors[i * 3] - animationState.currentColors[i * 3]) * eased
      animationState.currentColors[i * 3 + 1] =
        animationState.currentColors[i * 3 + 1] +
        (animationState.targetColors[i * 3 + 1] - animationState.currentColors[i * 3 + 1]) * eased
      animationState.currentColors[i * 3 + 2] =
        animationState.currentColors[i * 3 + 2] +
        (animationState.targetColors[i * 3 + 2] - animationState.currentColors[i * 3 + 2]) * eased
    })
  }

  function setDimension(dim: DataDimension) {
    currentDimension.value = dim
    updateTargets()
  }

  function setHour(hour: number) {
    currentHour.value = Math.max(0, Math.min(23, Math.floor(hour)))
    updateTargets()
  }

  function setTheme(index: number) {
    currentTheme.value = Math.max(0, Math.min(themes.length - 1, index))
    updateTargets()
  }

  function getRating(value: number): string {
    if (value < 33) return '低'
    if (value < 66) return '中'
    return '高'
  }

  function getDimensionLabel(dim: DataDimension): string {
    const labels: Record<DataDimension, string> = {
      population: '人口密度',
      traffic: '交通流量',
      airQuality: '空气质量指数',
    }
    return labels[dim]
  }

  function getDimensionUnit(dim: DataDimension): string {
    const units: Record<DataDimension, string> = {
      population: '人/km²',
      traffic: '车辆/小时',
      airQuality: 'AQI',
    }
    return units[dim]
  }

  const currentThemeColors = computed(() => themes[currentTheme.value])

  return {
    currentDimension,
    currentHour,
    currentTheme,
    blocks,
    isAnimating,
    animationState,
    currentThemeColors,
    initData,
    getBlockValue,
    updateAnimation,
    setDimension,
    setHour,
    setTheme,
    getRating,
    getDimensionLabel,
    getDimensionUnit,
    hexToRgb,
    interpolateColor,
    updateTargets,
  }
}
