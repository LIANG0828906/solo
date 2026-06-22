import type { BookList, Rating, Comment, Like, BookListWithStats } from '@/types'

export function calculateHotScore(
  bookList: BookList,
  ratings: Rating[],
  comments: Comment[],
  likes: Like[]
): number {
  const bookListRatings = ratings.filter(r => r.bookListId === bookList.id)
  const averageRating = bookListRatings.length > 0
    ? bookListRatings.reduce((sum, r) => sum + r.value, 0) / bookListRatings.length
    : 0

  const commentCount = comments.filter(c => c.bookListId === bookList.id).length
  const likeCount = likes.filter(l => l.bookListId === bookList.id).length

  return averageRating * 10 + commentCount * 2 + likeCount * 1
}

export function calculateBookListStats(
  bookList: BookList,
  ratings: Rating[],
  comments: Comment[],
  likes: Like[],
  currentUserId: string
): BookListWithStats {
  const bookListRatings = ratings.filter(r => r.bookListId === bookList.id)
  const averageRating = bookListRatings.length > 0
    ? bookListRatings.reduce((sum, r) => sum + r.value, 0) / bookListRatings.length
    : 0

  const commentCount = comments.filter(c => c.bookListId === bookList.id).length
  const likeCount = likes.filter(l => l.bookListId === bookList.id).length
  const hotScore = calculateHotScore(bookList, ratings, comments, likes)

  const userHasLiked = likes.some(l => l.bookListId === bookList.id && l.userId === currentUserId)
  const userRating = bookListRatings.find(r => r.userId === currentUserId)?.value ?? null

  return {
    ...bookList,
    averageRating,
    commentCount,
    likeCount,
    hotScore,
    userHasLiked,
    userRating,
  }
}

export function sortByHotScore(
  bookLists: BookList[],
  ratings: Rating[],
  comments: Comment[],
  likes: Like[],
  currentUserId: string
): BookListWithStats[] {
  return bookLists
    .map(bookList => calculateBookListStats(bookList, ratings, comments, likes, currentUserId))
    .sort((a, b) => b.hotScore - a.hotScore)
}
