export interface PlanetData {
  id: string
  name: string
  radius: number
  color: string
  orbitRadius: number
  orbitSpeed: number
  orbitAngle: number
  distance: number
  temperature: number
}

export interface StarData {
  id: string
  name: string
  spectralType: string
  position: [number, number, number]
  radius: number
  brightness: number
  planets: PlanetData[]
}

const SPECTRAL_TYPES = ['O5V', 'B0V', 'B5V', 'A0V', 'A3V', 'A5V', 'F0V', 'F5V', 'G0V', 'G2V', 'G5V', 'K0V', 'K5V', 'M0V', 'M5V']
const STAR_NAMES = [
  '天狼星', '北河三', '五车二', '南河三', '角宿一', '心宿二', '参宿四', '参宿七',
  '织女星', '牛郎星', '天津四', '北落师门', '毕宿五', '大角星', '轩辕十四',
  '老人星', '水委一', '马腹一', '河鼓二', '织女二', '紫微左垣', '天枢',
  '天璇', '天玑', '天权', '玉衡', '开阳', '摇光', '贯索四', '天市左垣',
  '河鼓一', '河鼓三', '渐台二', '辇道增七', '天津一', '天津二', '天津九',
  '螣蛇一', '王良四', '阁道三', '天船三', '天大将军一', '娄宿三', '胃宿三',
  '昴宿六', '毕宿一', '参宿五', '参宿二', '参宿一', '井宿三', '鬼宿三',
  '柳宿增三', '星宿一', '张宿一', '翼宿二', '轸宿一', '角宿二', '亢宿四',
  '氐宿一', '房宿三', '心宿一', '尾宿一', '尾宿九', '箕宿三', '斗宿四',
  '牛宿一', '女宿一', '虚宿一', '危宿一', '室宿二', '壁宿二', '奎宿九',
  '娄宿一', '胃宿一', '昴宿一', '觜宿一', '参宿三', '弧矢一', '弧矢二'
]

const PLANET_COLORS = ['#4FC3F7', '#81C784', '#FFB74D', '#E57373']
const PLANET_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta']

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateGalaxyPosition(): [number, number, number] {
  const arm = Math.floor(Math.random() * 4)
  const angleOffset = (arm * Math.PI * 2) / 4
  const radius = randomRange(1, 12)
  const spinAngle = radius * 0.5 + angleOffset
  const angle = spinAngle + randomRange(-0.3, 0.3)
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const y = randomRange(-0.75, 0.75) * (1 - radius / 15)
  return [x, y, z]
}

function generatePlanets(starName: string, starRadius: number): PlanetData[] {
  const planetCount = Math.floor(randomRange(1, 4))
  const planets: PlanetData[] = []
  for (let i = 0; i < planetCount; i++) {
    const orbitBase = starRadius * randomRange(4, 10)
    const orbitRadius = orbitBase + i * starRadius * randomRange(2, 4)
    const distance = Math.round(orbitRadius * 100) / 100
    const temperature = Math.round(randomRange(100, 800) / Math.sqrt(orbitRadius / 2))
    planets.push({
      id: generateId(),
      name: `${starName} ${PLANET_NAMES[i]}`,
      radius: randomRange(0.03, 0.08),
      color: PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)],
      orbitRadius,
      orbitSpeed: randomRange(0.15, 0.6) / Math.sqrt(orbitRadius),
      orbitAngle: randomRange(0, Math.PI * 2),
      distance,
      temperature,
    })
  }
  return planets
}

export function generateStarSystems(): { stars: StarData[]; planetarySystems: StarData[] } {
  const stars: StarData[] = []
  const planetarySystems: StarData[] = []
  const usedNames = new Set<string>()
  const planetarySystemCount = 20

  for (let i = 0; i < 80; i++) {
    let name: string
    let idx = 0
    do {
      if (i < STAR_NAMES.length) {
        name = STAR_NAMES[i]
        if (idx > 0) name = `${STAR_NAMES[i]}-${idx}`
      } else {
        name = `HD-${1000 + i * 13}-${idx}`
      }
      idx++
    } while (usedNames.has(name))
    usedNames.add(name)

    const spectralType = SPECTRAL_TYPES[Math.floor(Math.random() * SPECTRAL_TYPES.length)]
    const brightness = randomRange(0.2, 1)
    const hasPlanets = i < planetarySystemCount || Math.random() < 0.1

    const star: StarData = {
      id: generateId(),
      name,
      spectralType,
      position: generateGalaxyPosition(),
      radius: randomRange(0.1, 0.5) * (0.5 + brightness),
      brightness,
      planets: hasPlanets ? generatePlanets(name, randomRange(0.1, 0.5) * (0.5 + brightness)) : [],
    }

    if (hasPlanets) {
      star.planets = star.planets.length > 0 ? star.planets : generatePlanets(name, star.radius)
      planetarySystems.push(star)
    }

    stars.push(star)
  }

  return { stars, planetarySystems }
}
