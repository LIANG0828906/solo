// 数据流向 store user → UserCard 渲染，头像上传后更新 store
import { useRef, useEffect, useCallback, type ChangeEvent } from 'react'
import { User } from '@/types'
import { cn } from '@/lib/utils'

interface UserCardProps {
  user: User
  onAvatarChange?: (avatarDataUrl: string) => void
  className?: string
}

function drawDefaultAvatar(ctx: CanvasRenderingContext2D, size: number, name: string) {
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#2E7D32')
  gradient.addColorStop(1, '#A5D6A7')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'white'
  ctx.font = `bold ${size * 0.4}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.charAt(0), size / 2, size / 2)
}

export default function UserCard({ user, onAvatarChange, className = '' }: UserCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const drawAvatarImage = useCallback((ctx: CanvasRenderingContext2D, size: number, avatarSrc: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      const scale = Math.max(size / img.width, size / img.height)
      const x = (size - img.width * scale) / 2
      const y = (size - img.height * scale) / 2
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      ctx.restore()
    }
    img.onerror = () => {
      drawDefaultAvatar(ctx, size, user.name)
    }
    img.src = avatarSrc
  }, [user.name])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    ctx.clearRect(0, 0, size, size)

    if (user.avatar) {
      drawAvatarImage(ctx, size, user.avatar)
    } else {
      drawDefaultAvatar(ctx, size, user.name)
    }
  }, [user.avatar, user.name, drawAvatarImage])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 200
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()

        const scale = Math.max(size / img.width, size / img.height)
        const x = (size - img.width * scale) / 2
        const y = (size - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

        const dataUrl = canvas.toDataURL('image/png')
        onAvatarChange?.(dataUrl)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)

    e.target.value = ''
  }

  return (
    <div
      className={cn(
        'glass-card p-6 flex items-center gap-4',
        className
      )}
    >
      <div
        className="relative cursor-pointer group"
        onClick={handleAvatarClick}
      >
        <canvas
          ref={canvasRef}
          width={80}
          height={80}
          className="rounded-full shadow-md"
        />
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white text-xs">更换头像</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-500">总积分</span>
          <span className="text-lg font-bold text-primary">{user.totalPoints}</span>
        </div>
      </div>
    </div>
  )
}
