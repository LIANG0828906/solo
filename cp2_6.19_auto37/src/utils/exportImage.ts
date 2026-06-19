import { Layer, TextLayer, StickerLayer, BrushLayer, BackgroundLayer } from '../store/editorStore'

export const exportCanvasAsPNG = async (
  layers: Layer[],
  size: number = 300
): Promise<string> => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取画布上下文')

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, size, size)

  for (const layer of layers) {
    if (!layer.visible) continue

    ctx.save()

    switch (layer.type) {
      case 'background':
        await drawBackground(ctx, layer as BackgroundLayer, size)
        break
      case 'text':
        drawText(ctx, layer as TextLayer, size)
        break
      case 'brush':
        drawBrush(ctx, layer as BrushLayer, size)
        break
      case 'sticker':
        drawSticker(ctx, layer as StickerLayer, size)
        break
    }

    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

const drawBackground = async (
  ctx: CanvasRenderingContext2D,
  layer: BackgroundLayer,
  canvasSize: number
): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = Math.min(canvasSize / layer.width, canvasSize / layer.height)
      const w = layer.width * scale
      const h = layer.height * scale
      const x = (canvasSize - w) / 2
      const y = (canvasSize - h) / 2
      ctx.drawImage(img, x, y, w, h)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = layer.imageUrl
  })
}

const drawText = (ctx: CanvasRenderingContext2D, layer: TextLayer, canvasSize: number) => {
  ctx.save()
  ctx.translate(layer.x, layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)

  ctx.font = `bold ${layer.fontSize}px ${layer.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.strokeStyle = layer.strokeColor
  ctx.lineWidth = layer.strokeWidth * 2
  ctx.lineJoin = 'round'
  ctx.strokeText(layer.text, 0, 0)

  ctx.fillStyle = layer.color
  ctx.fillText(layer.text, 0, 0)

  ctx.restore()
}

const drawBrush = (ctx: CanvasRenderingContext2D, layer: BrushLayer, canvasSize: number) => {
  ctx.save()
  ctx.translate(layer.x, layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)

  ctx.strokeStyle = layer.color
  ctx.lineWidth = layer.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = layer.color
  ctx.shadowBlur = 2

  layer.paths.forEach((path) => {
    if (path.length < 2) return
    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y)
    }
    ctx.stroke()
  })

  ctx.restore()
}

const drawSticker = (ctx: CanvasRenderingContext2D, layer: StickerLayer, canvasSize: number) => {
  ctx.save()
  ctx.translate(layer.x, layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)

  ctx.font = `${layer.size}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(layer.emoji, 0, 0)

  ctx.restore()
}

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const saveToCommunity = async (
  layers: Layer[],
  creatorName: string
): Promise<void> => {
  const imageUrl = await exportCanvasAsPNG(layers, 300)
  const thumbnailUrl = await exportCanvasAsPNG(layers, 150)

  const memeData = {
    id: Date.now().toString(),
    imageUrl,
    thumbnailUrl,
    creatorName,
    createdAt: new Date().toISOString(),
    likes: 0,
    isFavorite: false,
  }

  console.log('========== 表情包导出成功 ==========')
  console.log('创作者昵称:', memeData.creatorName)
  console.log('创作时间:', new Date(memeData.createdAt).toLocaleString('zh-CN'))
  console.log('表情包ID:', memeData.id)
  console.log('缩略卡片数据:', {
    id: memeData.id,
    creatorName: memeData.creatorName,
    createdAt: memeData.createdAt,
    thumbnailSize: memeData.thumbnailUrl.length,
  })
  console.log('图层数量:', layers.length)
  console.log('图层详情:', layers.map(l => ({ type: l.type, name: l.name, visible: l.visible })))
  console.log('====================================')

  const existing = localStorage.getItem('community_memes')
  const memes = existing ? JSON.parse(existing) : []
  memes.unshift(memeData)
  localStorage.setItem('community_memes', JSON.stringify(memes.slice(0, 100)))
}

export const getCommunityMemes = () => {
  const existing = localStorage.getItem('community_memes')
  return existing ? JSON.parse(existing) : []
}

export const toggleFavorite = (memeId: string) => {
  const existing = localStorage.getItem('community_memes')
  const memes = existing ? JSON.parse(existing) : []
  const updated = memes.map((m: any) =>
    m.id === memeId ? { ...m, isFavorite: !m.isFavorite } : m
  )
  localStorage.setItem('community_memes', JSON.stringify(updated))
  return updated
}

export const getFavoriteMemes = () => {
  const existing = localStorage.getItem('community_memes')
  const memes = existing ? JSON.parse(existing) : []
  return memes.filter((m: any) => m.isFavorite)
}

const generateSampleMeme = (
  id: string,
  bgColor: string,
  text: string,
  emoji: string,
  creator: string,
  hoursAgo: number
) => {
  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 300
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createLinearGradient(0, 0, 300, 300)
  gradient.addColorStop(0, bgColor)
  gradient.addColorStop(1, '#1a1a2e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 300, 300)

  ctx.font = '80px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, 150, 120)

  ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 4
  ctx.lineJoin = 'round'
  ctx.strokeText(text, 150, 230)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, 150, 230)

  const imageUrl = canvas.toDataURL('image/png')

  const thumbCanvas = document.createElement('canvas')
  thumbCanvas.width = 150
  thumbCanvas.height = 150
  const thumbCtx = thumbCanvas.getContext('2d')
  if (thumbCtx) {
    thumbCtx.drawImage(canvas, 0, 0, 150, 150)
  }
  const thumbnailUrl = thumbCanvas.toDataURL('image/png')

  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

  return {
    id,
    imageUrl,
    thumbnailUrl,
    creatorName: creator,
    createdAt,
    likes: Math.floor(Math.random() * 100),
    isFavorite: false,
  }
}

export const initSampleData = () => {
  const existing = localStorage.getItem('community_memes')
  const existingData = existing ? JSON.parse(existing) : []
  const hasAllSamples = [
    'sample-1', 'sample-2', 'sample-3', 'sample-4',
    'sample-5', 'sample-6', 'sample-7', 'sample-8'
  ].every(id => existingData.some((m: any) => m.id === id))
  if (hasAllSamples) return

  const samples = [
    { id: 'sample-1', bgColor: '#9d4edd', text: '太强了！', emoji: '💪', creator: '创意达人', hoursAgo: 1 },
    { id: 'sample-2', bgColor: '#00d4ff', text: '哈哈哈哈', emoji: '🤣', creator: '快乐星球', hoursAgo: 3 },
    { id: 'sample-3', bgColor: '#ff006e', text: '冲鸭！', emoji: '🔥', creator: '热血少年', hoursAgo: 6 },
    { id: 'sample-4', bgColor: '#ffbe0b', text: '好耶！', emoji: '🎉', creator: '开心果', hoursAgo: 12 },
    { id: 'sample-5', bgColor: '#3a86ff', text: '我不信', emoji: '🤔', creator: '怀疑人生', hoursAgo: 24 },
    { id: 'sample-6', bgColor: '#06d6a0', text: '爱了爱了', emoji: '😍', creator: '小甜心', hoursAgo: 48 },
    { id: 'sample-7', bgColor: '#ff4d6d', text: '救命啊', emoji: '😱', creator: '惊吓小王子', hoursAgo: 72 },
    { id: 'sample-8', bgColor: '#7209b7', text: '真香警告', emoji: '😋', creator: '吃货本货', hoursAgo: 96 },
  ]

  const sampleMemes = samples
    .map((s) =>
      generateSampleMeme(s.id, s.bgColor, s.text, s.emoji, s.creator, s.hoursAgo)
    )
    .filter(Boolean)

  const existingIds = new Set(existingData.map((m: any) => m.id))
  const newSamples = sampleMemes.filter((m: any) => !existingIds.has(m.id))
  const merged = [...newSamples, ...existingData]

  localStorage.setItem('community_memes', JSON.stringify(merged.slice(0, 100)))
}
