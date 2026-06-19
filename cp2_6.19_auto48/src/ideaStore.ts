import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type Category = '技术' | '设计' | '运营' | '市场'

export interface Idea {
  id: string
  title: string
  description: string
  category: Category
  votes: number
  voted: boolean
  favorited: boolean
  favoriteCount: number
  createdAt: number
}

export type SortType = 'votes' | 'time' | 'trending'

interface IdeaStore {
  ideas: Idea[]
  sortBy: SortType
  addIdea: (title: string, description: string, category: Category) => void
  toggleVote: (id: string) => void
  toggleFavorite: (id: string) => void
  setSortBy: (sort: SortType) => void
}

export const getHeatRate = (idea: Idea): number => {
  const now = Date.now()
  const ageMs = Math.max(now - idea.createdAt, 3600000)
  const ageDays = ageMs / 86400000
  return idea.votes / Math.sqrt(ageDays)
}

export const getHeatLevel = (rate: number, maxRate: number): 'hot' | 'warm' | 'cold' => {
  if (maxRate === 0) return 'cold'
  const ratio = rate / maxRate
  if (ratio >= 0.6) return 'hot'
  if (ratio >= 0.25) return 'warm'
  return 'cold'
}

export const getMaxHeatRate = (ideas: Idea[]): number => {
  if (ideas.length === 0) return 0
  return Math.max(...ideas.map((i) => getHeatRate(i)))
}

const sampleIdeas: Idea[] = [
  {
    id: uuidv4(),
    title: '智能客服机器人',
    description: '基于大语言模型构建智能客服系统，自动回答常见问题，提升客户满意度和响应效率。',
    category: '技术',
    votes: 42,
    voted: false,
    favorited: false,
    favoriteCount: 12,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: uuidv4(),
    title: '全新品牌视觉系统',
    description: '设计一套现代化的品牌视觉识别系统，包括LOGO、色彩规范、字体规范和应用场景模板。',
    category: '设计',
    votes: 38,
    voted: true,
    favorited: true,
    favoriteCount: 25,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: uuidv4(),
    title: '用户增长裂变计划',
    description: '通过邀请返利机制和社交分享功能，实现用户数量的指数级增长，降低获客成本。',
    category: '运营',
    votes: 31,
    voted: false,
    favorited: false,
    favoriteCount: 8,
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: uuidv4(),
    title: '短视频内容营销策略',
    description: '在抖音、小红书等平台打造品牌IP，通过优质短视频内容吸引年轻用户群体。',
    category: '市场',
    votes: 27,
    voted: false,
    favorited: true,
    favoriteCount: 15,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: uuidv4(),
    title: '微前端架构改造',
    description: '将单体应用拆分为多个独立的微前端模块，提升团队协作效率和部署灵活性。',
    category: '技术',
    votes: 45,
    voted: true,
    favorited: false,
    favoriteCount: 20,
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: uuidv4(),
    title: '移动端暗色模式设计',
    description: '为APP设计完整的暗色模式主题，降低眼睛疲劳，提升夜间使用体验。',
    category: '设计',
    votes: 22,
    voted: false,
    favorited: false,
    favoriteCount: 6,
    createdAt: Date.now() - 86400000 * 0.5,
  },
  {
    id: uuidv4(),
    title: '会员积分体系优化',
    description: '重构会员积分获取和消耗体系，增加用户粘性和活跃度，提升复购率。',
    category: '运营',
    votes: 19,
    voted: false,
    favorited: false,
    favoriteCount: 4,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: uuidv4(),
    title: 'KOL合作推广计划',
    description: '与行业内知名KOL建立合作关系，通过内容种草提升品牌知名度和产品销量。',
    category: '市场',
    votes: 33,
    voted: false,
    favorited: true,
    favoriteCount: 18,
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: uuidv4(),
    title: '数据可视化大屏',
    description: '构建实时数据监控大屏，展示关键业务指标，帮助管理层快速做出决策。',
    category: '技术',
    votes: 28,
    voted: false,
    favorited: false,
    favoriteCount: 10,
    createdAt: Date.now() - 86400000 * 2.5,
  },
  {
    id: uuidv4(),
    title: '无障碍设计优化',
    description: '按照WCAG标准优化产品的无障碍设计，让更多用户能够顺畅使用我们的产品。',
    category: '设计',
    votes: 15,
    voted: false,
    favorited: false,
    favoriteCount: 3,
    createdAt: Date.now() - 86400000 * 1.5,
  },
  {
    id: uuidv4(),
    title: '社群运营体系搭建',
    description: '建立用户社群运营体系，通过日常互动和专属福利培养核心用户群体。',
    category: '运营',
    votes: 24,
    voted: false,
    favorited: false,
    favoriteCount: 7,
    createdAt: Date.now() - 86400000 * 3.5,
  },
  {
    id: uuidv4(),
    title: '线下体验快闪店',
    description: '在一线城市商圈开设快闪体验店，让用户亲身感受产品魅力，增强品牌认知。',
    category: '市场',
    votes: 36,
    voted: true,
    favorited: false,
    favoriteCount: 14,
    createdAt: Date.now() - 86400000 * 4.5,
  },
]

export const useIdeaStore = create<IdeaStore>((set) => ({
  ideas: sampleIdeas,
  sortBy: 'votes',

  addIdea: (title, description, category) =>
    set((state) => ({
      ideas: [
        {
          id: uuidv4(),
          title,
          description,
          category,
          votes: 0,
          voted: false,
          favorited: false,
          favoriteCount: 0,
          createdAt: Date.now(),
        },
        ...state.ideas,
      ],
    })),

  toggleVote: (id) =>
    set((state) => ({
      ideas: state.ideas.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              voted: !idea.voted,
              votes: idea.voted ? idea.votes - 1 : idea.votes + 1,
            }
          : idea
      ),
    })),

  toggleFavorite: (id) =>
    set((state) => ({
      ideas: state.ideas.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              favorited: !idea.favorited,
              favoriteCount: idea.favorited
                ? idea.favoriteCount - 1
                : idea.favoriteCount + 1,
            }
          : idea
      ),
    })),

  setSortBy: (sort) => set({ sortBy: sort }),
}))

export const getSortedIdeas = (ideas: Idea[], sortBy: SortType): Idea[] => {
  return [...ideas].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes
    }
    if (sortBy === 'trending') {
      return getHeatRate(b) - getHeatRate(a)
    }
    return b.createdAt - a.createdAt
  })
}
