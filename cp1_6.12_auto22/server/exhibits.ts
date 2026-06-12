import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import type { Exhibit, QuizQuestion } from '../shared/types'

const router = Router()

const exhibits: Exhibit[] = [
  {
    id: uuidv4(),
    title: '大卫雕像',
    modelType: 'sculpture',
    description: '米开朗基罗创作的大理石雕像，被认为是文艺复兴时期最杰出的雕塑作品之一。',
    fullDescription: '米开朗基罗创作的大理石雕像，被认为是文艺复兴时期最杰出的雕塑作品之一。展现了完美的人体比例和内在力量。雕像高5.17米，创作于1501年至1504年间，现收藏于意大利佛罗伦萨美术学院。',
    era: '1501-1504',
    artist: '米开朗基罗·博那罗蒂',
    images: [],
    position: [-4, 0, 0]
  },
  {
    id: uuidv4(),
    title: '维纳斯雕像',
    modelType: 'sculpture',
    description: '古希腊雕塑的代表作，又称美第奇的维纳斯。',
    fullDescription: '古希腊雕塑的代表作，又称美第奇的维纳斯。以其优雅的姿态和残缺的美感闻名于世。这座大理石雕像高约2.03米，创作于约公元前100年，现收藏于法国卢浮宫。',
    era: '约公元前100年',
    artist: '亚历山德罗斯',
    images: [],
    position: [-4, 0, -3]
  },
  {
    id: uuidv4(),
    title: '蒙娜丽莎',
    modelType: 'painting',
    description: '列奥纳多·达·芬奇最著名的肖像画作品，以主人公神秘的微笑闻名。',
    fullDescription: '列奥纳多·达·芬奇最著名的肖像画作品，以主人公神秘的微笑和精湛的绘画技巧闻名于世。这幅油画创作于1503年至1519年间，现收藏于法国卢浮宫。',
    era: '1503-1519',
    artist: '列奥纳多·达·芬奇',
    images: [],
    position: [0, 0, -3]
  },
  {
    id: uuidv4(),
    title: '星夜',
    modelType: 'painting',
    description: '文森特·梵高在法国圣雷米精神病院期间创作的油画。',
    fullDescription: '文森特·梵高在法国圣雷米精神病院期间创作的油画，描绘了夜空中旋转的星云和明亮的月亮。这幅作品创作于1889年，现收藏于纽约现代艺术博物馆。',
    era: '1889',
    artist: '文森特·梵高',
    images: [],
    position: [4, 0, -3]
  },
  {
    id: uuidv4(),
    title: '青铜鼎',
    modelType: 'artifact',
    description: '中国商周时期的青铜礼器，用于祭祀和宴飨。',
    fullDescription: '中国商周时期的青铜礼器，用于祭祀和宴飨。代表了中国古代青铜铸造工艺的最高水平。鼎身饰有精美的饕餮纹，是研究商代历史和文化的重要实物资料。',
    era: '约公元前1200年',
    artist: '商代工匠',
    images: [],
    position: [4, 0, 0]
  },
  {
    id: uuidv4(),
    title: '青花瓷瓶',
    modelType: 'artifact',
    description: '明代永乐年间的青花瓷精品，以其独特的釉色和精美的纹饰著称。',
    fullDescription: '明代永乐年间的青花瓷精品，以其独特的釉色和精美的纹饰著称，是中国瓷器艺术的巅峰之作。瓶身绘有缠枝莲纹，青花发色浓艳，层次分明。',
    era: '明代永乐年间',
    artist: '景德镇官窑',
    images: [],
    position: [0, 0, 3]
  }
]

const quizQuestions: QuizQuestion[] = [
  {
    id: uuidv4(),
    exhibitId: exhibits[0].id,
    question: '《大卫雕像》的创作者是谁？',
    options: ['达芬奇', '米开朗基罗', '拉斐尔', '罗丹'],
    correctIndex: 1,
    position: [-2, 0, -1.5]
  },
  {
    id: uuidv4(),
    exhibitId: exhibits[3].id,
    question: '《星夜》是哪位画家的作品？',
    options: ['莫奈', '毕加索', '梵高', '高更'],
    correctIndex: 2,
    position: [2, 0, -1.5]
  },
  {
    id: uuidv4(),
    exhibitId: exhibits[5].id,
    question: '青花瓷最早出现在哪个朝代？',
    options: ['汉代', '唐代', '宋代', '明代'],
    correctIndex: 1,
    position: [0, 0, 0]
  }
]

router.get('/exhibits', (req: Request, res: Response): void => {
  res.json(exhibits)
})

router.get('/exhibits/:id', (req: Request, res: Response): void => {
  const exhibit = exhibits.find(e => e.id === req.params.id)
  if (!exhibit) {
    res.status(404).json({ error: 'Exhibit not found' })
    return
  }
  res.json(exhibit)
})

router.get('/quiz/questions', (req: Request, res: Response): void => {
  res.json(quizQuestions)
})

export default router
export { exhibits, quizQuestions }
