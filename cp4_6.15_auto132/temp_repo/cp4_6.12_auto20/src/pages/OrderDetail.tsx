import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Clock, X } from 'lucide-react'
import {
  Order,
  OrderStatus,
  ordersApi,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  SCENE_STYLE_LABELS,
  DETAIL_LEVEL_LABELS,
} from '@/api'

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="card p-6 space-y-4">
        <div className="h-6 w-1/3 bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-600 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6 space-y-6">
        <div className="h-6 w-24 bg-gray-700 rounded animate-pulse" />
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-4 h-4 rounded-full bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-600 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    ordersApi
      .get(id)
      .then((data) => setOrder(data))
      .catch((err) => setError(err?.message || '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Skeleton />

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">{error || '订单不存在'}</p>
      </div>
    )
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="card p-6 space-y-5">
        <h2 className="text-xl font-display text-white font-semibold tracking-wide">
          订单信息
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">订单号</p>
            <p className="text-white font-mono">{order.id}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">客户姓名</p>
            <p className="text-white">{order.customerName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">场景风格</p>
            <p className="text-white">{SCENE_STYLE_LABELS[order.sceneStyle]}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">尺寸（宽×高×深 cm）</p>
            <p className="text-white">
              {order.width} × {order.height} × {order.depth}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">精细度</p>
            <p className="text-white">{DETAIL_LEVEL_LABELS[order.detailLevel]}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">是否含灯光</p>
            <p className="text-white">{order.hasLighting ? '是' : '否'}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-display text-white font-semibold tracking-wide mb-6">
          制作进度
        </h2>
        <div className="relative pl-4">
          <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-700" />

          {ORDER_STATUS_FLOW.map((status: OrderStatus, idx: number) => {
            const isCompleted = idx < currentIndex
            const isCurrent = idx === currentIndex
            const historyItem = order.statusHistory.find((h) => h.status === status)
            const showTime = isCompleted || isCurrent

            let dotClass = 'bg-gray-600'
            if (isCompleted) dotClass = 'bg-accent-primary'
            if (isCurrent) dotClass = 'bg-accent-primary animate-pulse-breath'

            return (
              <div key={status} className="relative flex items-start pb-8 last:pb-0">
                <div
                  className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 -ml-[1px] ${dotClass}`}
                >
                  {isCompleted && <Check className="w-[10px] h-[10px] text-white" strokeWidth={3} />}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </p>
                  {showTime && historyItem && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(historyItem.timestamp)}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {order.referenceImages && order.referenceImages.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-display text-white font-semibold tracking-wide mb-4">
            参考图
          </h2>
          <div className="flex flex-wrap gap-3">
            {order.referenceImages.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`参考图 ${idx + 1}`}
                onClick={() => setPreviewImage(url)}
                className="w-24 h-24 object-cover rounded-lg border border-gray-700 cursor-pointer hover:border-accent-primary hover:scale-105 transition-all"
              />
            ))}
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={previewImage}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
