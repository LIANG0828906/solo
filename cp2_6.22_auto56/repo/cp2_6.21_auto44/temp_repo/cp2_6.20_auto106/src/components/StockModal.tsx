import { useState, useEffect } from 'react'
import type { Consumable } from '@/types'

interface StockModalProps {
  visible: boolean
  consumable: Consumable | null
  type: 'in' | 'out' | null
  onClose: () => void
  onSubmit: (quantity: number, remark: string) => Promise<void>
}

export default function StockModal({ visible, consumable, type, onClose, onSubmit }: StockModalProps) {
  const [quantity, setQuantity] = useState('')
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visible) {
      setQuantity('')
      setRemark('')
      setError('')
    }
  }, [visible])

  if (!visible || !consumable || !type) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numQuantity = parseInt(quantity, 10)

    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('请输入有效的正整数数量')
      return
    }

    if (type === 'out' && numQuantity > consumable.currentStock) {
      setError(`出库数量不能大于当前库存 (${consumable.currentStock})`)
      return
    }

    setLoading(true)
    try {
      await onSubmit(numQuantity, remark)
      onClose()
    } catch {
      setError('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
          {type === 'in' ? '入库操作' : '出库操作'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>耗材名称</label>
            <input type="text" value={consumable.name} disabled />
          </div>

          <div className="form-group">
            <label>操作类型</label>
            <input
              type="text"
              value={type === 'in' ? '入库' : '出库'}
              disabled
              style={{
                color: type === 'in' ? '#389e0d' : '#cf1322',
                fontWeight: 500,
              }}
            />
          </div>

          {type === 'out' && (
            <div className="form-group">
              <label>当前库存</label>
              <input type="text" value={consumable.currentStock} disabled />
            </div>
          )}

          <div className="form-group">
            <label>
              数量 <span style={{ color: '#f5222d' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setError('')
              }}
              placeholder={`请输入${type === 'in' ? '入库' : '出库'}数量`}
              style={{ borderColor: error ? '#f5222d' : undefined }}
            />
          </div>

          <div className="form-group">
            <label>备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入备注信息（选填）"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#fff1f0',
                border: '1px solid #ffa39e',
                borderRadius: 8,
                color: '#cf1322',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-default"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className={`btn ${type === 'in' ? 'btn-success' : 'btn-danger'}`}
              disabled={loading}
            >
              {loading ? '处理中...' : '确认提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
