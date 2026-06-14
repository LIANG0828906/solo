// 被 Exchange 页面商品列表使用，支持虚拟滚动
import { useEffect, useRef } from 'react'
import { Product, IconType } from '@/types'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onClick?: () => void
  className?: string
}

function drawBottle(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#4CAF50'
  ctx.beginPath()
  ctx.roundRect(-12, -35, 24, 60, 6)
  ctx.fill()

  ctx.fillStyle = '#2E7D32'
  ctx.beginPath()
  ctx.roundRect(-8, -45, 16, 12, 3)
  ctx.fill()

  ctx.fillStyle = '#81C784'
  ctx.fillRect(-8, -20, 16, 25)

  ctx.fillStyle = '#A5D6A7'
  ctx.fillRect(-6, -15, 12, 3)
  ctx.fillRect(-6, -8, 12, 3)
}

function drawBag(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.moveTo(-25, -20)
  ctx.lineTo(-20, 30)
  ctx.lineTo(20, 30)
  ctx.lineTo(25, -20)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = '#5D4037'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, -20, 12, Math.PI, 0, false)
  ctx.stroke()

  ctx.fillStyle = '#A1887F'
  ctx.fillRect(-15, -5, 30, 20)
}

function drawBox(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFB74D'
  ctx.beginPath()
  ctx.moveTo(-30, -15)
  ctx.lineTo(0, -30)
  ctx.lineTo(30, -15)
  ctx.lineTo(0, 0)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#FFA726'
  ctx.beginPath()
  ctx.moveTo(-30, -15)
  ctx.lineTo(-30, 25)
  ctx.lineTo(0, 40)
  ctx.lineTo(0, 0)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#FF9800'
  ctx.beginPath()
  ctx.moveTo(30, -15)
  ctx.lineTo(30, 25)
  ctx.lineTo(0, 40)
  ctx.lineTo(0, 0)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = '#E65100'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-30, -15)
  ctx.lineTo(30, -15)
  ctx.moveTo(0, -30)
  ctx.lineTo(0, 40)
  ctx.stroke()
}

function drawPlant(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#8D6E63'
  ctx.beginPath()
  ctx.moveTo(-20, 10)
  ctx.lineTo(-15, 35)
  ctx.lineTo(15, 35)
  ctx.lineTo(20, 10)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#4CAF50'
  ctx.beginPath()
  ctx.ellipse(0, -5, 10, 25, -0.3, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#66BB6A'
  ctx.beginPath()
  ctx.ellipse(-15, 0, 8, 20, 0.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#81C784'
  ctx.beginPath()
  ctx.ellipse(15, 0, 8, 20, -0.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#388E3C'
  ctx.beginPath()
  ctx.arc(0, -30, 8, 0, Math.PI * 2)
  ctx.fill()
}

function drawUmbrella(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#E53935'
  ctx.beginPath()
  ctx.arc(0, -10, 35, Math.PI, 0, false)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#C62828'
  ctx.beginPath()
  ctx.moveTo(-25, -10)
  ctx.lineTo(-15, -30)
  ctx.lineTo(-5, -10)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(5, -10)
  ctx.lineTo(15, -30)
  ctx.lineTo(25, -10)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = '#5D4037'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(0, -10)
  ctx.lineTo(0, 30)
  ctx.stroke()

  ctx.strokeStyle = '#5D4037'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(6, 30, 6, Math.PI, 0, false)
  ctx.stroke()
}

function drawCup(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#42A5F5'
  ctx.beginPath()
  ctx.moveTo(-25, -25)
  ctx.lineTo(-20, 30)
  ctx.lineTo(20, 30)
  ctx.lineTo(25, -25)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = '#1E88E5'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(30, 0, 12, -Math.PI / 2, Math.PI / 2, false)
  ctx.stroke()

  ctx.fillStyle = '#90CAF9'
  ctx.beginPath()
  ctx.ellipse(0, -25, 25, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#BBDEFB'
  ctx.beginPath()
  ctx.ellipse(-10, -15, 4, 8, 0.2, 0, Math.PI * 2)
  ctx.fill()
}

function drawIcon(ctx: CanvasRenderingContext2D, size: number, iconType: IconType) {
  const centerX = size / 2
  const centerY = size / 2
  const scale = size / 100

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.scale(scale, scale)

  switch (iconType) {
    case 'bottle':
      drawBottle(ctx)
      break
    case 'bag':
      drawBag(ctx)
      break
    case 'box':
      drawBox(ctx)
      break
    case 'plant':
      drawPlant(ctx)
      break
    case 'umbrella':
      drawUmbrella(ctx)
      break
    case 'cup':
      drawCup(ctx)
      break
    default:
      drawBox(ctx)
  }

  ctx.restore()
}

export default function ProductCard({ product, onClick, className = '' }: ProductCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    ctx.clearRect(0, 0, size, size)

    drawIcon(ctx, size, product.iconType)
  }, [product.iconType])

  return (
    <div
      className={cn(
        'glass-card p-4 cursor-pointer transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-center mb-3">
        <canvas
          ref={canvasRef}
          width={80}
          height={80}
          className="drop-shadow"
        />
      </div>
      <h3 className="text-base font-semibold text-gray-800 truncate">{product.name}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-lg font-bold text-primary">{product.points} 积分</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">库存 {product.stock}</span>
      </div>
    </div>
  )
}
