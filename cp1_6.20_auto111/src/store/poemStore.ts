import { createSlice, configureStore, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Poem, Comment, ThemeType, PoemLine, PoemParagraph, LineStyle } from '@/types'
import { fetchPoems, fetchPoemById, postComment, fetchComments, likePoem } from '@/utils/api'
import { v4 as uuidv4 } from 'uuid'

interface PoemState {
  poems: Poem[]
  currentPoem: Poem | null
  selectedLineId: string | null
  comments: Comment[]
  theme: ThemeType
  loading: boolean
  error: string | null
}

const createDefaultLine = (text: string = ''): PoemLine => ({
  id: uuidv4(),
  text,
  style: {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: 18,
    color: '#2C2C2C',
    lineHeight: 1.8,
    textAlign: 'center' as const
  }
})

const createDefaultParagraph = (): PoemParagraph => ({
  id: uuidv4(),
  lines: [createDefaultLine()]
})

const createDefaultPoem = (): Poem => ({
  id: uuidv4(),
  title: '无题',
  author: '匿名',
  theme: 'default',
  paragraphs: [createDefaultParagraph()],
  likes: 0,
  createdAt: new Date().toISOString(),
  firstLine: ''
})

const initialState: PoemState = {
  poems: [],
  currentPoem: createDefaultPoem(),
  selectedLineId: null,
  comments: [],
  theme: 'default',
  loading: false,
  error: null
}

export const loadPoems = createAsyncThunk('poem/loadPoems', async () => {
  return await fetchPoems()
})

export const loadPoemById = createAsyncThunk('poem/loadPoemById', async (id: string) => {
  return await fetchPoemById(id)
})

export const loadComments = createAsyncThunk('poem/loadComments', async (poemId: string) => {
  return await fetchComments(poemId)
})

export const addComment = createAsyncThunk(
  'poem/addComment',
  async (params: { poemId: string; author: string; content: string; mentions?: string[] }) => {
    return await postComment(params)
  }
)

export const addLike = createAsyncThunk('poem/addLike', async (poemId: string) => {
  return await likePoem(poemId)
})

const poemSlice = createSlice({
  name: 'poem',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.theme = action.payload
      if (state.currentPoem) {
        state.currentPoem.theme = action.payload
      }
    },
    setTitle: (state, action: PayloadAction<string>) => {
      if (state.currentPoem) {
        state.currentPoem.title = action.payload
      }
    },
    setAuthor: (state, action: PayloadAction<string>) => {
      if (state.currentPoem) {
        state.currentPoem.author = action.payload
      }
    },
    selectLine: (state, action: PayloadAction<string | null>) => {
      state.selectedLineId = action.payload
    },
    updateLineText: (state, action: PayloadAction<{ lineId: string; text: string }>) => {
      if (!state.currentPoem) return
      const { lineId, text } = action.payload
      for (const paragraph of state.currentPoem.paragraphs) {
        const line = paragraph.lines.find(l => l.id === lineId)
        if (line) {
          line.text = text
          if (paragraph.lines.indexOf(line) === 0 && state.currentPoem.paragraphs.indexOf(paragraph) === 0) {
            state.currentPoem.firstLine = text.slice(0, 50)
          }
          break
        }
      }
    },
    updateLineStyle: (state, action: PayloadAction<{ lineId: string; style: Partial<LineStyle> }>) => {
      if (!state.currentPoem) return
      const { lineId, style } = action.payload
      for (const paragraph of state.currentPoem.paragraphs) {
        const line = paragraph.lines.find(l => l.id === lineId)
        if (line) {
          line.style = { ...line.style, ...style }
          break
        }
      }
    },
    addLine: (state, action: PayloadAction<{ afterLineId: string }>) => {
      if (!state.currentPoem) return
      const { afterLineId } = action.payload
      for (const paragraph of state.currentPoem.paragraphs) {
        const index = paragraph.lines.findIndex(l => l.id === afterLineId)
        if (index !== -1) {
          paragraph.lines.splice(index + 1, 0, createDefaultLine())
          break
        }
      }
    },
    deleteLine: (state, action: PayloadAction<string>) => {
      if (!state.currentPoem) return
      const lineId = action.payload
      for (const paragraph of state.currentPoem.paragraphs) {
        const index = paragraph.lines.findIndex(l => l.id === lineId)
        if (index !== -1 && paragraph.lines.length > 1) {
          paragraph.lines.splice(index, 1)
          break
        }
      }
    },
    addParagraph: (state) => {
      if (!state.currentPoem) return
      state.currentPoem.paragraphs.push(createDefaultParagraph())
    },
    setLineBackground: (state, action: PayloadAction<{ lineId: string; background: string }>) => {
      if (!state.currentPoem) return
      const { lineId, background } = action.payload
      for (const paragraph of state.currentPoem.paragraphs) {
        const line = paragraph.lines.find(l => l.id === lineId)
        if (line) {
          line.style.background = background
          break
        }
      }
    },
    clearLineBackground: (state, action: PayloadAction<string>) => {
      if (!state.currentPoem) return
      const lineId = action.payload
      for (const paragraph of state.currentPoem.paragraphs) {
        const line = paragraph.lines.find(l => l.id === lineId)
        if (line) {
          delete line.style.background
          break
        }
      }
    },
    resetCurrentPoem: (state) => {
      state.currentPoem = createDefaultPoem()
      state.selectedLineId = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPoems.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadPoems.fulfilled, (state, action) => {
        state.loading = false
        state.poems = action.payload
      })
      .addCase(loadPoems.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load poems'
      })
      .addCase(loadPoemById.fulfilled, (state, action) => {
        state.currentPoem = action.payload
        state.theme = action.payload.theme
      })
      .addCase(loadComments.fulfilled, (state, action) => {
        state.comments = action.payload
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload)
      })
      .addCase(addLike.fulfilled, (state, action) => {
        if (state.currentPoem) {
          state.currentPoem.likes = action.payload.likes
        }
        const poem = state.poems.find(p => p.id === state.currentPoem?.id)
        if (poem) {
          poem.likes = action.payload.likes
        }
      })
  }
})

export const {
  setTheme,
  setTitle,
  setAuthor,
  selectLine,
  updateLineText,
  updateLineStyle,
  addLine,
  deleteLine,
  addParagraph,
  setLineBackground,
  clearLineBackground,
  resetCurrentPoem
} = poemSlice.actions

export const store = configureStore({
  reducer: {
    poem: poemSlice.reducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
