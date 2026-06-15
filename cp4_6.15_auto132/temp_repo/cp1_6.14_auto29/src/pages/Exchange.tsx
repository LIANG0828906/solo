// 积分兑换页面
// 数据流向：
// useEffect → fetchProducts() + fetchPointsData() → store 更新
// 用户点击 ProductCard → selectedProduct state 更新 → 表单重新渲染
// 用户点击增减/输入数量 → quantity state 更新 → 重新计算 totalPoints → useAnimatedNumber 动画更新显示
// 点击兑换按钮 → submitExchange(productId, quantity) → POST /api/exchange → store 更新 user.totalPoints / products.stock / history → Toast 显示成功消息
// 依赖：@/store/useStore, @/components/Navbar, @/components/ProductCard, @/components/RippleButton, react-virtuoso, react-router-dom, lucide-react

import { useState, useEffect, useRef, useMemo } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import { Minus, Plus, AlertTriangle, CheckCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import RippleButton from '@/components/RippleButton'
import type { Product } from '@/types'
import { cn } from '@/lib/utils'

type IconType = 'bottle' | 'bag' | 'box' | 'plant' | 'umbrella' | 'cup'

function easeOutQuad(t: number): number {
  return t * (2 - t)
}

function useAnimatedNumber(targetValue: number, duration: number = 800): number {
  const [displayValue, setDisplayValue] = useState(targetValue)
  const startValueRef = useRef(targetValue)
  const displayValueRef = useRef(targetValue)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    displayValueRef.current = displayValue
  }, [displayValue])

  useEffect(() => {
    startValueRef.current = displayValueRef.current
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutQuad(progress)

      const currentValue =
        startValueRef.current + (targetValue - startValueRef.current) * easedProgress

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [targetValue, duration])

  return displayValue
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

function drawIcon(ctx: CanvasRenderingContext2D, size: number, iconType: string) {
  const centerX = size / 2
  const centerY = size / 2
  const scale = size / 100

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.scale(scale, scale)

  switch (iconType as IconType) {
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

function SelectedProductThumbnail({ product }: { product: Product }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    ctx.clearRect(0, 0, size, size)

    drawIcon(ctx, size, product.iconType || 'box')
  }, [product.iconType])

  return (
    <canvas
      ref={canvasRef}
      width={56}
      height={56}
      className="drop-shadow rounded-lg bg-white/50"
    />
  )
}

export default function Exchange() {
  const { user, products, fetchPointsData, fetchProducts, submitExchange } = useStore()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [inputFocused, setInputFocused] = useState<boolean>(false)
  const [showSuccess, setShowSuccess] = useState<boolean>(false)
  const [prevTotalPoints, setPrevTotalPoints] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPointsData()
    fetchProducts()
  }, [fetchPointsData, fetchProducts])

  const totalPoints = useMemo(() => {
    if (!selectedProduct) return 0
    return selectedProduct.points * quantity
  }, [selectedProduct, quantity])

  const animatedTotal = useAnimatedNumber(totalPoints, 1000)

  useEffect(() => {
    setPrevTotalPoints(totalPoints)
  }, [totalPoints])

  const totalPointsChanged = totalPoints !== prevTotalPoints
  const totalPointsIncreased = totalPoints > prevTotalPoints

  const hasEnoughPoints = user ? user.totalPoints >= totalPoints : false
  const pointsDeficit = totalPoints - (user?.totalPoints || 0)

  const handleSelectProduct = (product: Product) => {
    if (product.stock === 0) return
    setSelectedProduct(product)
    setQuantity(1)
    setShowSuccess(false)
  }

  const handleDecrease = () => {
    setQuantity(prev => Math.max(1, prev - 1))
    setShowSuccess(false)
  }

  const handleIncrease = () => {
    if (!selectedProduct) return
    setQuantity(prev => Math.min(selectedProduct.stock, prev + 1))
    setShowSuccess(false)
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (isNaN(value)) {
      setQuantity(1)
      return
    }
    if (!selectedProduct) return
    const clamped = Math.max(1, Math.min(selectedProduct.stock, value))
    setQuantity(clamped)
    setShowSuccess(false)
  }

  const handleExchange = async () => {
    if (!selectedProduct || !hasEnoughPoints) return
    const success = await submitExchange(selectedProduct.id, quantity)
    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        setSelectedProduct(null)
        setQuantity(1)
        setShowSuccess(false)
      }, 2000)
    }
  }

  const listClassName = cn(
    'grid gap-4',
    'grid-cols-1',
    'sm:grid-cols-2',
    'lg:grid-cols-4'
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">积分兑换</h1>
          <p className="mt-2 text-gray-600">
            选择心仪的商品，用您的环保积分兑换奖励
            {user && (
              <span className="ml-2 font-semibold text-primary">
                （当前积分：{user.totalPoints.toLocaleString()}）
              </span>
            )}
          </p>
        </div>

        <div
          style={{ height: 'calc(100vh - 340px)' }}
          className="mb-6"
        >
          {products.length > 0 ? (
            <VirtuosoGrid
              data={products}
              listClassName={listClassName}
              itemContent={(index, product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleSelectProduct(product)}
                  className={cn(
                    selectedProduct?.id === product.id &&
                      'ring-2 ring-primary ring-offset-2 border-primary/50'
                  )}
                />
              )}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium">加载商品列表中...</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-4 sm:p-6">
          {selectedProduct ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <SelectedProductThumbnail product={selectedProduct} />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{selectedProduct.name}</h3>
                  <p className="text-primary font-semibold">
                    单价：{selectedProduct.points.toLocaleString()} 积分
                  </p>
                </div>

                <div className="flex items-center gap-0">
                  <button
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    className={cn(
                      'w-11 h-11 rounded-l-lg border border-r-0 flex items-center justify-center transition-all duration-200',
                      'bg-white/70 hover:bg-white',
                      quantity <= 1
                        ? 'text-gray-300 cursor-not-allowed hover:bg-white/70'
                        : 'text-gray-700 hover:text-primary'
                    )}
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="number"
                      min={1}
                      max={selectedProduct.stock}
                      value={quantity}
                      onChange={handleQuantityChange}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      className={cn(
                        'w-20 h-11 text-center text-lg font-semibold',
                        'bg-white/70 border-y border-gray-300',
                        'focus:outline-none',
                        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                      )}
                    />
                    <span
                      className={cn(
                        'absolute bottom-0 left-0 right-0 h-0.5 origin-left transition-transform duration-300 ease-out',
                        'bg-gradient-to-r from-primary via-secondary to-primary',
                        inputFocused ? 'scale-x-100' : 'scale-x-0'
                      )}
                    />
                  </div>

                  <button
                    onClick={handleIncrease}
                    disabled={quantity >= selectedProduct.stock}
                    className={cn(
                      'w-11 h-11 rounded-r-lg border border-l-0 flex items-center justify-center transition-all duration-200',
                      'bg-white/70 hover:bg-white',
                      quantity >= selectedProduct.stock
                        ? 'text-gray-300 cursor-not-allowed hover:bg-white/70'
                        : 'text-gray-700 hover:text-primary'
                    )}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mb-6 text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-end gap-2 mb-2">
                  <span className="text-gray-600 text-lg">共需积分：</span>
                  <span
                    className={cn(
                      'text-3xl sm:text-4xl font-black transition-colors duration-300',
                      hasEnoughPoints ? 'text-primary' : 'text-red-500'
                    )}
                  >
                    {Math.round(animatedTotal).toLocaleString()}
                  </span>
                  {totalPointsChanged && (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold animate-pulse',
                        totalPointsIncreased
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-600'
                      )}
                    >
                      {totalPointsIncreased ? '↑' : '↓'}
                    </span>
                  )}
                </div>

                {hasEnoughPoints ? (
                  <p className="text-green-600 font-medium flex items-center justify-center sm:justify-end gap-1">
                    <CheckCircle className="w-4 h-4" />
                    当前积分充足
                  </p>
                ) : (
                  <p className="text-red-500 font-semibold flex items-center justify-center sm:justify-end gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    积分不足，还差 {pointsDeficit.toLocaleString()} 积分！
                  </p>
                )}
              </div>

              <RippleButton
                variant="primary"
                disabled={!hasEnoughPoints}
                onClick={handleExchange}
                className="w-full text-lg py-4"
              >
                立即兑换
              </RippleButton>

              {showSuccess && (
                <div className="mt-4 text-center text-green-600 font-semibold flex items-center justify-center gap-2 animate-pulse">
                  <CheckCircle className="w-5 h-5" />
                  兑换成功
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg mb-1">请选择要兑换的商品</p>
              <p className="text-gray-400 text-sm">点击上方商品卡片即可选择</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
