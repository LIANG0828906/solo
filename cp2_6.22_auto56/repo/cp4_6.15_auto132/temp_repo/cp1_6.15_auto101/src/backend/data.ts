import { v4 as uuidv4 } from 'uuid'

export interface Game {
  id: string
  title: string
  developer: string
  description: string
  screenshots: string[]
  thumbnail: string
  htmlPrototype: string
  tags: string[]
  createdAt: number
}

export interface Review {
  id: string
  gameId: string
  userId: string
  userName: string
  content: string
  rating: number
  tags: string[]
  createdAt: number
}

export interface User {
  id: string
  name: string
  avatar: string
}

export const AVAILABLE_TAGS = [
  '游戏玩法',
  '美术风格',
  '音效设计',
  '剧情故事',
  '技术实现',
]

export const mockUsers: User[] = [
  { id: 'user-1', name: '玩家小明', avatar: '👤' },
  { id: 'user-2', name: '独立开发者阿杰', avatar: '🎮' },
  { id: 'user-3', name: '游戏评测师', avatar: '🎯' },
]

const placeholderScreenshots = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pixel%20art%20game%20screenshot%20fantasy%20adventure&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indie%20game%20platformer%20level%20design&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20game%20cityscape%20screenshot&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20farming%20game%20screenshot%20peaceful&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=space%20shooter%20game%20retro%20style&image_size=square_hd',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=puzzle%20game%20minimalist%20design&image_size=square_hd',
]

const mockHtmlPrototype = `<!DOCTYPE html>
<html>
<head><style>
  body { margin:0; display:flex; align-items:center; justify-content:center; height:100vh; background:#1a1a2e; color:#fff; font-family:sans-serif; flex-direction:column; }
  .demo-box { text-align:center; padding:30px; }
  button { padding:12px 24px; background:#e94560; color:white; border:none; border-radius:8px; cursor:pointer; font-size:16px; }
  button:hover { background:#0f3460; }
</style></head>
<body>
  <div class="demo-box">
    <h2>🎮 游戏可玩原型</h2>
    <p>这里是HTML5可交互游戏演示</p>
    <button onclick="startGame()">开始游戏</button>
    <script>
      function startGame() { alert('游戏启动中... 这是一个可交互原型'); }
    </script>
  </div>
</body>
</html>`

const htmlPrototypeBase64 = Buffer.from(mockHtmlPrototype).toString('base64')
const htmlPrototypeDataUrl = `data:text/html;base64,${htmlPrototypeBase64}`

export const games: Game[] = [
  {
    id: uuidv4(),
    title: '星尘迷途',
    developer: '星河工作室',
    description: '一款太空探索类独立游戏，玩家驾驶飞船在浩瀚星海中寻找失落的文明遗迹。',
    screenshots: [placeholderScreenshots[0], placeholderScreenshots[2], placeholderScreenshots[4]],
    thumbnail: placeholderScreenshots[0],
    htmlPrototype: htmlPrototypeDataUrl,
    tags: ['游戏玩法', '美术风格', '技术实现'],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: uuidv4(),
    title: '森林低语',
    developer: '自然之音',
    description: '治愈系解谜冒险游戏，在神秘森林中探索，与精灵交流，解开古老的谜题。',
    screenshots: [placeholderScreenshots[1], placeholderScreenshots[3], placeholderScreenshots[5]],
    thumbnail: placeholderScreenshots[3],
    htmlPrototype: htmlPrototypeDataUrl,
    tags: ['美术风格', '音效设计', '剧情故事'],
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: uuidv4(),
    title: '像素骑士团',
    developer: '复古游戏迷',
    description: '经典像素风格的回合制策略游戏，组建你的骑士团，征服黑暗大陆。',
    screenshots: [placeholderScreenshots[0], placeholderScreenshots[1], placeholderScreenshots[5]],
    thumbnail: placeholderScreenshots[1],
    htmlPrototype: htmlPrototypeDataUrl,
    tags: ['游戏玩法', '剧情故事'],
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: uuidv4(),
    title: '霓虹都市',
    developer: '赛博朋克社',
    description: '赛博朋克风格的动作冒险游戏，在霓虹闪烁的未来都市中追逐真相。',
    screenshots: [placeholderScreenshots[2], placeholderScreenshots[4], placeholderScreenshots[0]],
    thumbnail: placeholderScreenshots[2],
    htmlPrototype: htmlPrototypeDataUrl,
    tags: ['美术风格', '音效设计', '技术实现'],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: uuidv4(),
    title: '田园生活',
    developer: '悠闲时光',
    description: '模拟经营类休闲游戏，经营自己的小农场，种植作物，饲养动物，享受宁静生活。',
    screenshots: [placeholderScreenshots[3], placeholderScreenshots[5], placeholderScreenshots[1]],
    thumbnail: placeholderScreenshots[3],
    htmlPrototype: htmlPrototypeDataUrl,
    tags: ['游戏玩法', '美术风格'],
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: uuidv4(),
    title: '时空裂隙',
    developer: '悖论实验室',
    description: '时间操控类解谜游戏，利用时间倒流和暂停机制，解开各种精巧的机关谜题。',
    screenshots: [placeholderScreenshots[4], placeholderScreenshots[2], placeholderScreenshots[5]],
    thumbnail: placeholderScreenshots[4],
    htmlPrototype: htmlPrototypeDataUrl,
    tags: ['游戏玩法', '技术实现', '剧情故事'],
    createdAt: Date.now() - 86400000 * 2,
  },
]

export const reviews: Review[] = [
  {
    id: uuidv4(),
    gameId: games[0].id,
    userId: 'user-1',
    userName: '玩家小明',
    content: '太空探索的玩法很有新意，美术风格也很梦幻，希望能加入更多可探索的星球！',
    rating: 4,
    tags: ['游戏玩法', '美术风格'],
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: uuidv4(),
    gameId: games[0].id,
    userId: 'user-2',
    userName: '独立开发者阿杰',
    content: '技术实现很厉害，飞船的物理手感很棒，期待后续更新。',
    rating: 5,
    tags: ['技术实现', '游戏玩法'],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: uuidv4(),
    gameId: games[1].id,
    userId: 'user-3',
    userName: '游戏评测师',
    content: '音效设计太棒了，完全沉浸在森林的氛围里。美术风格也很治愈。',
    rating: 5,
    tags: ['音效设计', '美术风格'],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: uuidv4(),
    gameId: games[2].id,
    userId: 'user-1',
    userName: '玩家小明',
    content: '像素风很经典，战斗系统有深度，剧情也很吸引人。',
    rating: 4,
    tags: ['美术风格', '剧情故事'],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: uuidv4(),
    gameId: games[3].id,
    userId: 'user-2',
    userName: '独立开发者阿杰',
    content: '赛博朋克的氛围营造得很好，霓虹效果技术实现难度很高。',
    rating: 4,
    tags: ['美术风格', '技术实现'],
    createdAt: Date.now() - 86400000 * 3,
  },
]

export function getGames(): Game[] {
  return games
}

export function getGameById(id: string): Game | undefined {
  return games.find((g) => g.id === id)
}

export function getReviewsByGameId(gameId: string): Review[] {
  return reviews
    .filter((r) => r.gameId === gameId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getAverageRating(gameId: string): number {
  const gameReviews = reviews.filter((r) => r.gameId === gameId)
  if (gameReviews.length === 0) return 0
  const sum = gameReviews.reduce((acc, r) => acc + r.rating, 0)
  return sum / gameReviews.length
}

export function addGame(game: Omit<Game, 'id' | 'createdAt'>): Game {
  const newGame: Game = {
    ...game,
    id: uuidv4(),
    createdAt: Date.now(),
  }
  games.unshift(newGame)
  return newGame
}

export function addReview(
  review: Omit<Review, 'id' | 'createdAt'>
): Review {
  const newReview: Review = {
    ...review,
    id: uuidv4(),
    createdAt: Date.now(),
  }
  reviews.unshift(newReview)
  return newReview
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>()
  games.forEach((g) => g.tags.forEach((t) => tagSet.add(t)))
  return Array.from(tagSet)
}

export function searchGames(query: string): Game[] {
  const lowerQuery = query.toLowerCase()
  return games.filter(
    (g) =>
      g.title.toLowerCase().includes(lowerQuery) ||
      g.developer.toLowerCase().includes(lowerQuery)
  )
}

export function filterGamesByTag(tag: string): Game[] {
  return games.filter((g) => g.tags.includes(tag))
}
