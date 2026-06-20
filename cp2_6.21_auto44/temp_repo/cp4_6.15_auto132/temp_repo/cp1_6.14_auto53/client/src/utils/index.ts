export const formatTimeAgo = (dateString: string): string => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }
}

export const getDaysSince = (dateString: string): number => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export const getCategoryLabel = (category: string): string => {
  const map: Record<string, string> = {
    book: '书籍',
    electronics: '电子产品',
    home: '家居',
    other: '其他',
  }
  return map[category] || category
}

export const getConditionLabel = (condition: string): string => {
  const map: Record<string, string> = {
    new: '全新',
    like_new: '九成新',
    used: '有使用痕迹',
  }
  return map[condition] || condition
}

export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    available: '可交换',
    exchanging: '交换中',
    exchanged: '已交换',
    pending: '待处理',
    accepted: '已同意',
    rejected: '已拒绝',
    completed: '已完成',
  }
  return map[status] || status
}

export const CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'book', label: '书籍' },
  { value: 'electronics', label: '电子产品' },
  { value: 'home', label: '家居' },
  { value: 'other', label: '其他' },
]

export const CONDITIONS = [
  { value: 'new', label: '全新' },
  { value: 'like_new', label: '九成新' },
  { value: 'used', label: '有使用痕迹' },
]

export const validatePassword = (password: string): boolean => {
  if (password.length < 6) return false
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  return hasLetter && hasDigit
}

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
