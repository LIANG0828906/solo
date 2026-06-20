import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { AppState, Book, Doodle, Comment } from '../types'
import { generateBooks } from '../utils/bookCover'

const initialBooks = generateBooks(50)

const generateSampleDoodles = (books: Book[]): Doodle[] => {
  const doodles: Doodle[] = []
  const sampleComments: Comment[][] = [
    [
      { id: 'c1', content: '画得太棒了！', createdAt: '2024-03-15 10:30' },
      { id: 'c2', content: '很有创意的涂鸦~', createdAt: '2024-03-16 14:20' }
    ],
    [
      { id: 'c3', content: '颜色搭配很好看', createdAt: '2024-04-10 09:15' }
    ],
    []
  ]
  
  for (let i = 0; i < Math.min(8, books.length); i++) {
    const book = books[i]
    const doodleCount = 1 + Math.floor(Math.random() * 3)
    
    for (let j = 0; j < doodleCount; j++) {
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 150
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#F5F5F5'
        ctx.fillRect(0, 0, 200, 150)
        
        const hue = (i * 50 + j * 30) % 360
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
        ctx.beginPath()
        ctx.arc(100, 75, 40 + j * 10, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.strokeStyle = `hsl(${(hue + 180) % 360}, 70%, 50%)`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(50, 50)
        ctx.quadraticCurveTo(100, 100 + j * 20, 150, 50)
        ctx.stroke()
      }
      
      doodles.push({
        id: `doodle-${i}-${j}`,
        bookId: book.id,
        imageData: canvas.toDataURL('image/png'),
        likes: Math.floor(Math.random() * 50),
        comments: sampleComments[(i + j) % sampleComments.length],
        createdAt: `2024-${String(1 + Math.floor(Math.random() * 5)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`
      })
    }
  }
  
  return doodles
}

export const useAppStore = create<AppState>((set, get) => {
  let doodles: Doodle[] = []
  
  try {
    doodles = generateSampleDoodles(initialBooks)
  } catch (e) {
    doodles = []
  }
  
  return {
    books: initialBooks,
    currentBook: null,
    doodles,
    
    setCurrentBook: (bookId: string) => {
      const book = get().books.find(b => b.id === bookId) || null
      set({ currentBook: book })
    },
    
    borrowBook: (bookId: string) => {
      set(state => ({
        books: state.books.map(book => {
          if (book.id === bookId) {
            const today = new Date()
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            return {
              ...book,
              status: 'drifting' as const,
              driftHistory: [...book.driftHistory, { city: '当前位置', date: dateStr }]
            }
          }
          return book
        }),
        currentBook: state.currentBook?.id === bookId
          ? (() => {
              const b = state.books.find(book => book.id === bookId)
              if (b) {
                const today = new Date()
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                return {
                  ...b,
                  status: 'drifting' as const,
                  driftHistory: [...b.driftHistory, { city: '当前位置', date: dateStr }]
                }
              }
              return null
            })()
          : state.currentBook
      }))
    },
    
    returnBook: (bookId: string) => {
      set(state => ({
        books: state.books.map(book => {
          if (book.id === bookId) {
            return { ...book, status: 'returning' as const }
          }
          return book
        }),
        currentBook: state.currentBook?.id === bookId
          ? { ...state.currentBook, status: 'returning' as const }
          : state.currentBook
      }))
    },
    
    addDoodle: (bookId: string, imageData: string) => {
      const newDoodle: Doodle = {
        id: uuidv4(),
        bookId,
        imageData,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString().split('T')[0]
      }
      
      set(state => ({
        doodles: [newDoodle, ...state.doodles]
      }))
    },
    
    likeDoodle: (doodleId: string) => {
      set(state => ({
        doodles: state.doodles.map(doodle => {
          if (doodle.id === doodleId) {
            return { ...doodle, likes: doodle.likes + 1 }
          }
          return doodle
        })
      }))
    },
    
    addComment: (doodleId: string, content: string) => {
      const newComment: Comment = {
        id: uuidv4(),
        content,
        createdAt: new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      
      set(state => ({
        doodles: state.doodles.map(doodle => {
          if (doodle.id === doodleId) {
            return {
              ...doodle,
              comments: [newComment, ...doodle.comments]
            }
          }
          return doodle
        })
      }))
    }
  }
})
