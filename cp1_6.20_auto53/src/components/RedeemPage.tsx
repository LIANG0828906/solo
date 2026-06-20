import { useState, type FormEvent } from 'react'
import { Check, Loader2, ScanLine, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RedeemResponse {
  success: boolean
  message: string
}

export default function RedeemPage() {
  const [code, setCode] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [productIds, setProductIds] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      triggerShake('请输入核销码')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          purchaseAmount: purchaseAmount ? Number(purchaseAmount) : undefined,
          productIds: productIds ? productIds.split(',').map((id) => id.trim()).filter(Boolean) : undefined,
        }),
      })

      const data: RedeemResponse = await response.json()

      if (data.success) {
        setSuccess(true)
        setMessage(data.message || '核销成功')
        setShowResult(true)
        setCode('')
        setPurchaseAmount('')
        setProductIds('')

        setTimeout(() => {
          setShowResult(false)
          setSuccess(false)
          setMessage('')
        }, 1000)
      } else {
        triggerShake(data.message || '核销失败')
      }
    } catch (error) {
      console.error('Redeem error:', error)
      triggerShake('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const triggerShake = (msg: string) => {
    setSuccess(false)
    setMessage(msg)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="relative w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">优惠券核销</h1>
            <p className="mt-2 text-sm text-gray-500">输入或扫描优惠券核销码</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              核销码
            </label>
            <div
              className={cn(
                'flex items-center rounded-xl border bg-white transition-all',
                shaking
                  ? 'animate-[shake_0.5s_ease-in-out] border-red-400 ring-2 ring-red-100'
                  : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100'
              )}
            >
              <ScanLine className="ml-4 h-6 w-6 text-gray-400" />
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入或扫描核销码"
                className="w-full border-0 bg-transparent px-3 py-4 text-lg outline-none placeholder:text-gray-400"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                消费金额（可选）
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="products" className="block text-sm font-medium text-gray-700">
                商品ID（可选）
              </label>
              <input
                id="products"
                type="text"
                value={productIds}
                onChange={(e) => setProductIds(e.target.value)}
                placeholder="逗号分隔"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex items-center justify-center rounded-xl bg-blue-600 py-4 text-base font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                处理中...
              </>
            ) : (
              '确认核销'
            )}
          </button>

          {!success && message && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              <X className="h-5 w-5 shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </form>

        {showResult && success && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'flex h-32 w-32 items-center justify-center rounded-full bg-green-500 shadow-2xl',
                'animate-[success-pop_0.5s_ease-out_forwards]'
              )}
            >
              <Check className="h-16 w-16 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        @keyframes success-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
