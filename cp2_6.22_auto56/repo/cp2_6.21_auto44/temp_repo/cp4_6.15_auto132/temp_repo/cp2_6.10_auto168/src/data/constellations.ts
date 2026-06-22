export interface StarData {
  position: [number, number, number]
  size: number
  brightness: number
}

export interface ConstellationData {
  id: string
  name: string
  chineseName: string
  mansion: string
  stars: StarData[]
}

const generateStarPosition = (baseTheta: number, basePhi: number, radius: number, variance: number = 0.05): [number, number, number] => {
  const theta = baseTheta + (Math.random() - 0.5) * variance
  const phi = basePhi + (Math.random() - 0.5) * variance
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

const mansions = [
  { name: '角', symbol: '角木蛟', stars: 2 },
  { name: '亢', symbol: '亢金龙', stars: 4 },
  { name: '氐', symbol: '氐土貉', stars: 4 },
  { name: '房', symbol: '房日兔', stars: 4 },
  { name: '心', symbol: '心月狐', stars: 3 },
  { name: '尾', symbol: '尾火虎', stars: 9 },
  { name: '箕', symbol: '箕水豹', stars: 4 },
  { name: '斗', symbol: '斗木獬', stars: 6 },
  { name: '牛', symbol: '牛金牛', stars: 6 },
  { name: '女', symbol: '女土蝠', stars: 4 },
  { name: '虚', symbol: '虚日鼠', stars: 2 },
  { name: '危', symbol: '危月燕', stars: 3 },
  { name: '室', symbol: '室火猪', stars: 2 },
  { name: '壁', symbol: '壁水貐', stars: 2 },
  { name: '奎', symbol: '奎木狼', stars: 16 },
  { name: '娄', symbol: '娄金狗', stars: 3 },
  { name: '胃', symbol: '胃土雉', stars: 3 },
  { name: '昴', symbol: '昴日鸡', stars: 7 },
  { name: '毕', symbol: '毕月乌', stars: 8 },
  { name: '觜', symbol: '觜火猴', stars: 3 },
  { name: '参', symbol: '参水猿', stars: 7 },
  { name: '井', symbol: '井水犴', stars: 8 },
  { name: '鬼', symbol: '鬼金羊', stars: 4 },
  { name: '柳', symbol: '柳土獐', stars: 8 },
  { name: '星', symbol: '星日马', stars: 7 },
  { name: '张', symbol: '张月鹿', stars: 6 },
  { name: '翼', symbol: '翼火蛇', stars: 22 },
  { name: '轸', symbol: '轸水蚓', stars: 4 },
]

export const CONSTELLATIONS: ConstellationData[] = mansions.map((mansion, index) => {
  const baseTheta = (index / 28) * Math.PI * 2
  const basePhi = Math.PI / 2 + (Math.random() - 0.5) * 0.5
  const stars: StarData[] = []
  
  for (let i = 0; i < mansion.stars; i++) {
    stars.push({
      position: generateStarPosition(baseTheta, basePhi, 15, 0.1),
      size: 0.05 + Math.random() * 0.08,
      brightness: 0.5 + Math.random() * 0.5,
    })
  }
  
  return {
    id: `mansion-${index}`,
    name: mansion.symbol,
    chineseName: mansion.name,
    mansion: mansion.name,
    stars,
  }
})

export const POLARIS: StarData = {
  position: [0, 14.5, 0],
  size: 0.15,
  brightness: 1.0,
}

export const BACKGROUND_STARS = Array.from({ length: 500 }, () => ({
  position: generateStarPosition(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI,
    12 + Math.random() * 8,
    0
  ) as [number, number, number],
  size: 0.02 + Math.random() * 0.04,
  brightness: 0.3 + Math.random() * 0.5,
}))
