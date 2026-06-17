import type { Artwork, Comment, PaperType } from './types'
import { v4 as uuidv4 } from 'uuid'
import { eventBus } from './EventBus'

const STORAGE_KEY = 'watercolor_artworks'
const UNDO_KEY = 'watercolor_undo_stack'
const MAX_UNDO = 20

class GalleryManager {
  private static instance: GalleryManager
  private artworks: Artwork[] = []
  private undoStack: string[] = []

  private constructor() {
    this.artworks = this.loadArtworks()
    this.undoStack = this.loadUndo()
    eventBus.on('save', (e) => {
      const p = e.payload as { fullImage: string; thumbnail: string; width: number; height: number; paperType: PaperType }
      if (p && p.fullImage) {
        this.create({
          title: `水彩作品 #${this.artworks.length + 1}`,
          author: '匿名画师',
          fullImage: p.fullImage,
          thumbnail: p.thumbnail,
          width: p.width,
          height: p.height,
          paperType: p.paperType,
        })
      }
    })
  }

  static getInstance(): GalleryManager {
    if (!GalleryManager.instance) GalleryManager.instance = new GalleryManager()
    return GalleryManager.instance
  }

  private loadArtworks(): Artwork[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return this.seedSamples()
      const arr = JSON.parse(raw) as Artwork[]
      if (!Array.isArray(arr)) return this.seedSamples()
      return arr
    } catch {
      return this.seedSamples()
    }
  }

  private saveArtworks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.artworks))
    } catch (e) {
      console.warn('GalleryManager persist failed:', e)
    }
  }

  private loadUndo(): string[] {
    try {
      const raw = localStorage.getItem(UNDO_KEY)
      if (!raw) return []
      return JSON.parse(raw) as string[]
    } catch { return [] }
  }

  private saveUndo() {
    try {
      localStorage.setItem(UNDO_KEY, JSON.stringify(this.undoStack.slice(-MAX_UNDO)))
    } catch {}
  }

  private seedSamples(): Artwork[] {
    const samples: Artwork[] = []
    const palette: [number, number, number][] = [
      [230, 57, 70], [38, 136, 201], [106, 176, 76], [240, 98, 190], [249, 132, 62],
    ]
    const papers: PaperType[] = ['fine', 'medium', 'rough', 'cold', 'hot']
    const authors = ['水彩诗人', '山间旅人', '云端漫笔', '墨色无声', '淡蓝的海']
    for (let i = 0; i < 5; i++) {
      samples.push(this.makeSampleArtwork(palette[i], papers[i], authors[i], i))
    }
    this.artworks = samples
    this.saveArtworks()
    return samples
  }

  private makeSampleArtwork(color: [number, number, number], paper: PaperType, author: string, seed: number): Artwork {
    const W = 600, H = 400 + (seed * 70) % 180
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(0, 0, W, H)
    const [cr, cg, cb] = color
    const grad = ctx.createRadialGradient(W * 0.35 + seed * 20, H * 0.35 + seed * 12, 20,
                                         W * 0.55 + seed * 15, H * 0.55, Math.max(W, H) * 0.6)
    grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.75)`)
    grad.addColorStop(0.5, `rgba(${cr + 20},${cg + 10},${cb + 30},0.35)`)
    grad.addColorStop(1, `rgba(${cr + 40},${cg + 30},${cb + 20},0)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = `rgba(${Math.min(255, cr + 60)},${Math.min(255, cg + 40)},${Math.min(255, cb + 20)},0.6)`
    ctx.beginPath()
    ctx.ellipse(W * (0.25 + seed * 0.08), H * (0.65 + seed * 0.03), 90 + seed * 15, 50 + seed * 8,
                seed * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(255,255,255,0.25)`
    ctx.fillRect(0, 0, W, H)

    const fullImage = c.toDataURL('image/png', 0.9)
    const TW = 220, TH = Math.round(H / W * TW)
    const t = document.createElement('canvas')
    t.width = TW; t.height = TH
    t.getContext('2d')!.drawImage(c, 0, 0, TW, TH)
    const thumbnail = t.toDataURL('image/png', 0.85)

    return {
      id: uuidv4(),
      title: ['黎明初晓', '山间清泉', '午后庭院', '暮色归途', '雨夜微光'][seed] ?? `作品 ${seed + 1}`,
      author,
      fullImage,
      thumbnail,
      width: W,
      height: H,
      paperType: paper,
      likes: 10 + seed * 7,
      isLiked: false,
      comments: [
        { id: uuidv4(), author: '路人甲', avatar: '🎨', content: '晕染效果好真实，仿佛能感受到颜料在纸上流动。', timestamp: Date.now() - 3600_000 * (seed + 1) },
        { id: uuidv4(), author: '小画笔', avatar: '✨', content: '颜色搭配很漂亮，收藏学习！', timestamp: Date.now() - 86_400_000 * (seed + 1) },
      ],
      createdAt: Date.now() - 86_400_000 * seed,
    }
  }

  getAll(): Artwork[] {
    return [...this.artworks].sort((a, b) => b.createdAt - a.createdAt)
  }

  getById(id: string): Artwork | undefined {
    return this.artworks.find(a => a.id === id)
  }

  create(data: Partial<Artwork> & { fullImage: string; thumbnail: string; width: number; height: number; paperType: PaperType }): Artwork {
    const art: Artwork = {
      id: uuidv4(),
      title: data.title ?? `水彩作品 #${this.artworks.length + 1}`,
      author: data.author ?? '匿名画师',
      fullImage: data.fullImage,
      thumbnail: data.thumbnail,
      width: data.width,
      height: data.height,
      paperType: data.paperType,
      likes: 0,
      isLiked: false,
      comments: [],
      createdAt: Date.now(),
    }
    this.artworks.unshift(art)
    this.saveArtworks()
    return art
  }

  delete(id: string): boolean {
    const before = this.artworks.length
    this.artworks = this.artworks.filter(a => a.id !== id)
    if (this.artworks.length !== before) {
      this.saveArtworks()
      eventBus.emit({ type: 'delete', payload: { id } })
      return true
    }
    return false
  }

  like(id: string): Artwork | undefined {
    const art = this.artworks.find(a => a.id === id)
    if (!art) return undefined
    art.isLiked = !art.isLiked
    art.likes += art.isLiked ? 1 : -1
    if (art.likes < 0) art.likes = 0
    this.saveArtworks()
    eventBus.emit({ type: 'like', payload: { id, likes: art.likes, isLiked: art.isLiked } })
    return art
  }

  addComment(id: string, content: string, author = '访客', avatar = '🙂'): Comment | null {
    const art = this.artworks.find(a => a.id === id)
    if (!art || !content.trim()) return null
    const c: Comment = {
      id: uuidv4(),
      author: author.trim() || '访客',
      avatar,
      content: content.trim(),
      timestamp: Date.now(),
    }
    art.comments.push(c)
    this.saveArtworks()
    return c
  }

  pushUndo(snapshot: string) {
    this.undoStack.push(snapshot)
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift()
    this.saveUndo()
  }

  popUndo(): string | null {
    const snap = this.undoStack.pop()
    this.saveUndo()
    return snap ?? null
  }

  get undoCount() { return this.undoStack.length }
}

export const galleryManager = GalleryManager.getInstance()

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}天前`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}个月前`
  return `${Math.floor(mo / 12)}年前`
}
