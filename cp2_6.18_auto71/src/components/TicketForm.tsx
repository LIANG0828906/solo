import { useState, type FormEvent } from 'react'
import { useTicketStore } from '../store/ticketStore'

interface FormErrors {
  orderId?: string
  itemName?: string
  amount?: string
  reason?: string
}

export default function TicketForm() {
  const createTicket = useTicketStore((s) => s.createTicket)
  const [orderId, setOrderId] = useState('')
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!orderId.trim()) {
      e.orderId = '订单号必填'
    } else if (!/^\d{16}$/.test(orderId.trim())) {
      e.orderId = '订单号必须为16位数字'
    }
    if (itemName.trim().length > 60) {
      e.itemName = '商品名称最多60字'
    }
    if (!amount.trim()) {
      e.amount = '退款金额必填'
    } else if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      e.amount = '金额格式错误，最多两位小数'
    }
    if (reason.length > 500) {
      e.reason = '退款原因最多500字'
    }
    return e
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    createTicket({
      orderId: orderId.trim(),
      itemName: itemName.trim(),
      amount: parseFloat(amount),
      reason,
    })
    setOrderId('')
    setItemName('')
    setAmount('')
    setReason('')
    setErrors({})
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#1F2937' }}>
        创建退款工单
      </h2>

      <div>
        <label style={labelStyle}>订单号 *</label>
        <input
          style={inputStyle}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="请输入16位数字订单号"
          maxLength={16}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
        />
        {errors.orderId && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.orderId}</span>}
      </div>

      <div>
        <label style={labelStyle}>商品名称</label>
        <input
          style={inputStyle}
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="请输入商品名称（最多60字）"
          maxLength={60}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
        />
        {errors.itemName && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.itemName}</span>}
      </div>

      <div>
        <label style={labelStyle}>退款金额（元）*</label>
        <input
          style={inputStyle}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
        />
        {errors.amount && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.amount}</span>}
      </div>

      <div>
        <label style={labelStyle}>退款原因</label>
        <textarea
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="请描述退款原因（最多500字）"
          maxLength={500}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
        />
        {errors.reason && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.reason}</span>}
      </div>

      <button
        type="submit"
        style={{
          padding: '12px',
          background: '#4F46E5',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#4338CA')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#4F46E5')}
      >
        提交工单
      </button>
    </form>
  )
}
