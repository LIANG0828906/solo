import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { User, BookList, Comment, Rating, Like, BookListWithStats } from '@/types'
import { sortByHotScore } from '@/utils/ranking'

interface BookStore {
  bookLists: BookList[]
  comments: Comment[]
  ratings: Rating[]
  likes: Like[]
  currentUser: User
  rankedBookLists: BookListWithStats[]

  createBookList: (data: Omit<BookList, 'id' | 'userId' | 'createdAt' | 'likedBy'>) => void
  addComment: (bookListId: string, content: string) => void
  addRating: (bookListId: string, value: 1 | 2 | 3 | 4 | 5) => void
  toggleLike: (bookListId: string) => void
  refreshRanking: () => void
  persist: () => void
  hydrate: () => void
}

let persistTimer: number | null = null

const STORAGE_KEY = 'litboard_data'

const defaultCurrentUser: User = {
  id: 'user-1',
  name: '读书爱好者',
  avatar: '📚',
}

const getMockData = () => {
  const now = Date.now()
  const mockUsers: User[] = [
    { id: 'user-2', name: '星际旅人', avatar: '🚀' },
    { id: 'user-3', name: '诗词墨客', avatar: '✍️' },
    { id: 'user-4', name: '历史探索者', avatar: '🏛️' },
  ]

  const mockBookLists: BookList[] = [
    {
      id: 'list-1',
      title: '银河纪元：经典科幻三部曲',
      description: '探索人类文明在宇宙中的终极命运，从基地到三体，领略科幻大师们构筑的未来世界。包含阿西莫夫、刘慈欣等大师的巅峰之作。',
      tags: ['科幻', '科技'],
      userId: 'user-2',
      createdAt: now - 86400000 * 7,
      likedBy: ['user-1', 'user-3', 'user-4'],
    },
    {
      id: 'list-2',
      title: '百年孤独与拉美文学盛宴',
      description: '走进马尔克斯的魔幻现实主义世界，感受拉丁美洲百年沧桑。从《百年孤独》到《霍乱时期的爱情》，体验文学的无限可能。',
      tags: ['文学', '艺术'],
      userId: 'user-3',
      createdAt: now - 86400000 * 5,
      likedBy: ['user-1', 'user-2'],
    },
    {
      id: 'list-3',
      title: '人类简史：从动物到上帝',
      description: '赫拉利三部曲带你重新审视人类历史。从认知革命到科学革命，探寻我们是谁、从哪里来、要到哪里去的终极命题。',
      tags: ['历史', '哲学'],
      userId: 'user-4',
      createdAt: now - 86400000 * 3,
      likedBy: ['user-1'],
    },
  ]

  const mockComments: Comment[] = [
    {
      id: 'comment-1',
      content: '这个书单太棒了！《三体》的黑暗森林理论让人深思，强烈推荐给所有科幻爱好者。',
      userId: 'user-3',
      bookListId: 'list-1',
      createdAt: now - 86400000 * 6,
    },
    {
      id: 'comment-2',
      content: '阿西莫夫的基地系列真的是永恒的经典，心理史学的构想太超前了。',
      userId: 'user-4',
      bookListId: 'list-1',
      createdAt: now - 86400000 * 4,
    },
    {
      id: 'comment-3',
      content: '多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的下午。',
      userId: 'user-2',
      bookListId: 'list-2',
      createdAt: now - 86400000 * 4,
    },
    {
      id: 'comment-4',
      content: '魔幻现实主义的巅峰之作，每次阅读都有新的感悟。',
      userId: 'user-4',
      bookListId: 'list-2',
      createdAt: now - 86400000 * 2,
    },
    {
      id: 'comment-5',
      content: '赫拉利的视角独特，让我重新认识了人类文明的发展历程。',
      userId: 'user-2',
      bookListId: 'list-3',
      createdAt: now - 86400000 * 2,
    },
    {
      id: 'comment-6',
      content: '《未来简史》和《今日简史》也值得一读，三部曲完整阅读体验更佳。',
      userId: 'user-3',
      bookListId: 'list-3',
      createdAt: now - 86400000,
    },
  ]

  const mockRatings: Rating[] = [
    { id: 'rating-1', value: 5, userId: 'user-3', bookListId: 'list-1', createdAt: now - 86400000 * 6 },
    { id: 'rating-2', value: 4, userId: 'user-4', bookListId: 'list-1', createdAt: now - 86400000 * 4 },
    { id: 'rating-3', value: 5, userId: 'user-1', bookListId: 'list-1', createdAt: now - 86400000 * 3 },
    { id: 'rating-4', value: 5, userId: 'user-2', bookListId: 'list-2', createdAt: now - 86400000 * 4 },
    { id: 'rating-5', value: 4, userId: 'user-4', bookListId: 'list-2', createdAt: now - 86400000 * 2 },
    { id: 'rating-6', value: 5, userId: 'user-1', bookListId: 'list-2', createdAt: now - 86400000 * 2 },
    { id: 'rating-7', value: 4, userId: 'user-2', bookListId: 'list-3', createdAt: now - 86400000 * 2 },
    { id: 'rating-8', value: 5, userId: 'user-3', bookListId: 'list-3', createdAt: now - 86400000 },
  ]

  const mockLikes: Like[] = [
    { id: 'like-1', userId: 'user-1', bookListId: 'list-1', createdAt: now - 86400000 * 5 },
    { id: 'like-2', userId: 'user-3', bookListId: 'list-1', createdAt: now - 86400000 * 3 },
    { id: 'like-3', userId: 'user-4', bookListId: 'list-1', createdAt: now - 86400000 * 2 },
    { id: 'like-4', userId: 'user-1', bookListId: 'list-2', createdAt: now - 86400000 * 3 },
    { id: 'like-5', userId: 'user-2', bookListId: 'list-2', createdAt: now - 86400000 },
    { id: 'like-6', userId: 'user-1', bookListId: 'list-3', createdAt: now - 86400000 },
  ]

  return {
    bookLists: mockBookLists,
    comments: mockComments,
    ratings: mockRatings,
    likes: mockLikes,
    currentUser: defaultCurrentUser,
    mockUsers,
  }
}

const calculateRankedBookLists = (
  bookLists: BookList[],
  ratings: Rating[],
  comments: Comment[],
  likes: Like[],
  currentUserId: string
): BookListWithStats[] => {
  return sortByHotScore(bookLists, ratings, comments, likes, currentUserId)
}

export const useBookStore = create<BookStore>((set, get) => ({
  bookLists: [],
  comments: [],
  ratings: [],
  likes: [],
  currentUser: defaultCurrentUser,
  rankedBookLists: [],

  createBookList: (data) => {
    const { currentUser } = get()
    const newBookList: BookList = {
      ...data,
      id: uuidv4(),
      userId: currentUser.id,
      createdAt: Date.now(),
      likedBy: [],
    }

    set((state) => {
      const newBookLists = [...state.bookLists, newBookList]
      const newRankedBookLists = calculateRankedBookLists(
        newBookLists,
        state.ratings,
        state.comments,
        state.likes,
        state.currentUser.id
      )
      return {
        bookLists: newBookLists,
        rankedBookLists: newRankedBookLists,
      }
    })

    get().persist()
  },

  addComment: (bookListId, content) => {
    if (content.length > 200) {
      console.warn('评论内容不能超过200字')
      return
    }

    const { currentUser } = get()
    const newComment: Comment = {
      id: uuidv4(),
      content,
      userId: currentUser.id,
      bookListId,
      createdAt: Date.now(),
    }

    set((state) => {
      const newComments = [...state.comments, newComment]
      const newRankedBookLists = calculateRankedBookLists(
        state.bookLists,
        state.ratings,
        newComments,
        state.likes,
        state.currentUser.id
      )
      return {
        comments: newComments,
        rankedBookLists: newRankedBookLists,
      }
    })

    get().persist()
  },

  addRating: (bookListId, value) => {
    const { currentUser, ratings } = get()
    const existingRatingIndex = ratings.findIndex(
      (r) => r.bookListId === bookListId && r.userId === currentUser.id
    )

    set((state) => {
      let newRatings: Rating[]

      if (existingRatingIndex >= 0) {
        newRatings = state.ratings.map((r, index) =>
          index === existingRatingIndex ? { ...r, value, createdAt: Date.now() } : r
        )
      } else {
        const newRating: Rating = {
          id: uuidv4(),
          value,
          userId: state.currentUser.id,
          bookListId,
          createdAt: Date.now(),
        }
        newRatings = [...state.ratings, newRating]
      }

      const newRankedBookLists = calculateRankedBookLists(
        state.bookLists,
        newRatings,
        state.comments,
        state.likes,
        state.currentUser.id
      )
      return {
        ratings: newRatings,
        rankedBookLists: newRankedBookLists,
      }
    })

    get().persist()
  },

  toggleLike: (bookListId) => {
    const { currentUser, likes } = get()
    const existingLikeIndex = likes.findIndex(
      (l) => l.bookListId === bookListId && l.userId === currentUser.id
    )

    set((state) => {
      let newLikes: Like[]

      if (existingLikeIndex >= 0) {
        newLikes = state.likes.filter((_, index) => index !== existingLikeIndex)
      } else {
        const newLike: Like = {
          id: uuidv4(),
          userId: state.currentUser.id,
          bookListId,
          createdAt: Date.now(),
        }
        newLikes = [...state.likes, newLike]
      }

      const newRankedBookLists = calculateRankedBookLists(
        state.bookLists,
        state.ratings,
        state.comments,
        newLikes,
        state.currentUser.id
      )
      return {
        likes: newLikes,
        rankedBookLists: newRankedBookLists,
      }
    })

    get().persist()
  },

  refreshRanking: () => {
    set((state) => ({
      rankedBookLists: calculateRankedBookLists(
        state.bookLists,
        state.ratings,
        state.comments,
        state.likes,
        state.currentUser.id
      ),
    }))
  },

  persist: () => {
    if (persistTimer) {
      clearTimeout(persistTimer)
    }

    persistTimer = window.setTimeout(() => {
      const { bookLists, comments, ratings, likes, currentUser } = get()
      const data = {
        bookLists,
        comments,
        ratings,
        likes,
        currentUser,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }, 300)
  },

  hydrate: () => {
    const storedData = localStorage.getItem(STORAGE_KEY)

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        set((state) => {
          const newState = {
            ...state,
            bookLists: parsed.bookLists || [],
            comments: parsed.comments || [],
            ratings: parsed.ratings || [],
            likes: parsed.likes || [],
            currentUser: parsed.currentUser || defaultCurrentUser,
          }
          newState.rankedBookLists = calculateRankedBookLists(
            newState.bookLists,
            newState.ratings,
            newState.comments,
            newState.likes,
            newState.currentUser.id
          )
          return newState
        })
        return
      } catch (e) {
        console.error('Failed to parse stored data:', e)
      }
    }

    const mockData = getMockData()
    set((state) => {
      const newState = {
        ...state,
        bookLists: mockData.bookLists,
        comments: mockData.comments,
        ratings: mockData.ratings,
        likes: mockData.likes,
        currentUser: defaultCurrentUser,
      }
      newState.rankedBookLists = calculateRankedBookLists(
        newState.bookLists,
        newState.ratings,
        newState.comments,
        newState.likes,
        newState.currentUser.id
      )
      return newState
    })

    get().persist()
  },
}))
