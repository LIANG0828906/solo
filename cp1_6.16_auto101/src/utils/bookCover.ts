import type { Book } from '../types'

const CITIES = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '南京', '武汉',
  '西安', '重庆', '苏州', '天津', '长沙', '青岛', '大连', '厦门'
]

const BOOK_TITLES = [
  '小王子的奇幻冒险', '森林里的秘密', '月亮上的小兔子', '海底两万里',
  '绿野仙踪', '爱丽丝梦游仙境', '木偶奇遇记', '格列佛游记',
  '鲁滨逊漂流记', '汤姆索亚历险记', '爱的教育', '假如给我三天光明',
  '老人与海', '童年', '在人间', '我的大学',
  '钢铁是怎样炼成的', '骆驼祥子', '朝花夕拾', '城南旧事',
  '神笔马良', '葫芦兄弟', '黑猫警长', '大头儿子小头爸爸',
  '舒克和贝塔', '邋遢大王奇遇记', '大闹天宫', '哪吒闹海',
  '天书奇谭', '宝莲灯', '西游记绘本', '三国演义绘本',
  '红楼梦绘本', '水浒传绘本', '封神演义', '山海经故事',
  '成语故事', '寓言故事', '神话故事', '历史故事',
  '科学家的故事', '发明家的故事', '探险家的故事', '艺术家的故事',
  '音乐家的故事', '文学家的故事', '数学家的故事', '天文学家的故事',
  '地球的秘密', '宇宙的奥秘'
]

const AUTHORS = [
  '林小明', '王欢欢', '张乐乐', '刘甜甜', '陈萌萌', '杨朵朵',
  '赵笑笑', '黄美美', '周星星', '吴天天', '徐亮亮', '孙晶晶',
  '胡圆圆', '朱灿灿', '郭萌萌', '何豆豆'
]

function randomHslColor(saturation: number = 75, lightness: number = 65): string {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(startYear: number = 2023, endYear: number = 2025): string {
  const start = new Date(startYear, 0, 1)
  const end = new Date(endYear, 11, 31)
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  const date = new Date(randomTime)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function generateDriftHistory(count: number): { city: string; date: string }[] {
  const history: { city: string; date: string }[] = []
  const usedCities = new Set<string>()
  
  for (let i = 0; i < count; i++) {
    let city = randomFromArray(CITIES)
    while (usedCities.has(city) && usedCities.size < CITIES.length) {
      city = randomFromArray(CITIES)
    }
    usedCities.add(city)
    history.push({ city, date: randomDate() })
  }
  
  return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function randomDescription(): string {
  const descriptions = [
    '这是一本充满想象力的童书，讲述了主人公在奇幻世界中的冒险故事。书中精美的插图和生动的文字，将带领小读者进入一个全新的世界。',
    '跟随主角一起探索未知的领域，学会勇敢、善良和智慧。每一页都充满了惊喜，让孩子们在阅读中收获快乐与成长。',
    '一个关于友谊与勇气的温馨故事，告诉我们只要心中有爱，就能克服一切困难。适合亲子共读，共度美好时光。',
    '在这个神奇的世界里，一切皆有可能。让我们一起展开想象的翅膀，飞向那片属于孩子的梦幻天空。',
    '经典的童话故事，用全新的方式演绎。让孩子们在欢笑中学习人生的道理，在感动中培养美好的品格。'
  ]
  return randomFromArray(descriptions)
}

export function generateBooks(count: number = 50): Book[] {
  const books: Book[] = []
  const shapes: Book['coverShape'][] = ['circle', 'triangle', 'star', 'diamond', 'hexagon']
  const statuses: Book['status'][] = ['available', 'drifting', 'returning']
  
  for (let i = 0; i < count; i++) {
    const id = `book-${i + 1}`
    const statusIndex = i % 3
    const driftCount = 3 + Math.floor(Math.random() * 3)
    
    books.push({
      id,
      title: BOOK_TITLES[i % BOOK_TITLES.length] + (i >= BOOK_TITLES.length ? ` ${Math.floor(i / BOOK_TITLES.length) + 1}` : ''),
      author: randomFromArray(AUTHORS),
      description: randomDescription(),
      status: statuses[statusIndex],
      coverColor: randomHslColor(72 + Math.floor(Math.random() * 20), 60 + Math.floor(Math.random() * 15)),
      coverShape: shapes[i % shapes.length],
      driftHistory: generateDriftHistory(driftCount)
    })
  }
  
  return books
}

export function drawBookCover(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  book: Book
): void {
  const radius = 16
  
  ctx.clearRect(0, 0, width, height)
  
  ctx.fillStyle = book.coverColor
  ctx.beginPath()
  ctx.roundRect(0, 0, width, height, radius)
  ctx.fill()
  
  const centerX = width / 2
  const centerY = height / 2 - 20
  const shapeSize = Math.min(width, height) * 0.35
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.lineWidth = 3
  
  switch (book.coverShape) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(centerX, centerY, shapeSize, 0, Math.PI * 2)
      ctx.fill()
      break
      
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(centerX, centerY - shapeSize)
      ctx.lineTo(centerX - shapeSize * 0.866, centerY + shapeSize * 0.5)
      ctx.lineTo(centerX + shapeSize * 0.866, centerY + shapeSize * 0.5)
      ctx.closePath()
      ctx.fill()
      break
      
    case 'star':
      drawStar(ctx, centerX, centerY, 5, shapeSize, shapeSize * 0.5)
      ctx.fill()
      break
      
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(centerX, centerY - shapeSize)
      ctx.lineTo(centerX + shapeSize * 0.7, centerY)
      ctx.lineTo(centerX, centerY + shapeSize)
      ctx.lineTo(centerX - shapeSize * 0.7, centerY)
      ctx.closePath()
      ctx.fill()
      break
      
    case 'hexagon':
      drawPolygon(ctx, centerX, centerY, shapeSize, 6)
      ctx.fill()
      break
  }
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.font = `bold ${Math.floor(width * 0.09)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const title = book.title.length > 8 ? book.title.slice(0, 8) + '...' : book.title
  ctx.fillText(title, centerX, height - 35)
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
): void {
  let rot = (Math.PI / 2) * 3
  const step = Math.PI / spikes
  
  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  
  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerRadius
    let y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step
    
    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number
): void {
  const angle = (Math.PI * 2) / sides
  
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const x = cx + radius * Math.cos(i * angle - Math.PI / 2)
    const y = cy + radius * Math.sin(i * angle - Math.PI / 2)
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
}

export function getStatusInfo(status: Book['status']): { label: string; color: string; bgColor: string } {
  switch (status) {
    case 'available':
      return { label: '可借', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' }
    case 'drifting':
      return { label: '漂流中', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' }
    case 'returning':
      return { label: '待归还', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' }
  }
}
