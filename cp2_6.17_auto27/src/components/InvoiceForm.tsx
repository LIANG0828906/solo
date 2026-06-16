import React, { useState, useEffect } from 'react'
import type { Invoice, InvoiceFormData, FormErrors, InvoiceStatus } from '@/utils/helpers'
import { useInvoiceStore } from '@/store/invoiceStore'
import { generateInvoiceNo, isFutureDate, formatDate } from '@/utils/helpers'

interface InvoiceFormProps {
  initialData?: Invoice | null
  onSubmit: (data: InvoiceFormData) => Promise<void>
  submitText?: string
  loading?: boolean
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  onSubmit,
  submitText = '提交',
  loading = false,
}) => {
  const invoices = useInvoiceStore((state) => state.invoices)

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNo: '',
    customerName: '',
    amount: '',
    date: '',
    status: 'pending' as InvoiceStatus,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        invoiceNo: initialData.invoiceNo,
        customerName: initialData.customerName,
        amount: initialData.amount,
        date: initialData.date,
        status: initialData.status,
      })
    } else {
      setFormData({
        invoiceNo: generateInvoiceNo(),
        customerName: '',
        amount: '',
        date: formatDate(new Date()),
        status: 'pending' as InvoiceStatus,
      })
    }
    setErrors({})
  }, [initialData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    if (name in errors) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof FormErrors]
        return newErrors
      })
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.invoiceNo.trim()) {
      newErrors.invoiceNo = '发票号不能为空'
    } else if (invoices.some((inv) => inv.invoiceNo === formData.invoiceNo && inv.id !== initialData?.id)) {
      newErrors.invoiceNo = '发票号已存在'
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = '客户名称不能为空'
    }

    if (formData.amount === '' || formData.amount === undefined) {
      newErrors.amount = '金额不能为空'
    } else if (!Number.isInteger(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = '金额必须为正整数'
    }

    if (!formData.date) {
      newErrors.date = '日期不能为空'
    } else if (isFutureDate(formData.date)) {
      newErrors.date = '日期不能为未来日期'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const submitData: InvoiceFormData = {
      ...formData,
      amount: Number(formData.amount),
    }

    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">发票号</label>
          <input
            type="text"
            name="invoiceNo"
            value={formData.invoiceNo}
            onChange={handleChange}
            className={`form-input ${errors.invoiceNo ? 'form-input-error' : ''}`}
            placeholder="请输入发票号"
          />
          {errors.invoiceNo && (
            <div className="form-error">{errors.invoiceNo}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">状态</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-select"
          >
            <option value="pending">待审批</option>
            <option value="approved">已通过</option>
            <option value="archived">已归档</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">客户名称</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            className={`form-input ${errors.customerName ? 'form-input-error' : ''}`}
            placeholder="请输入客户名称"
          />
          {errors.customerName && (
            <div className="form-error">{errors.customerName}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">日期</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`form-input ${errors.date ? 'form-input-error' : ''}`}
          />
          {errors.date && (
            <div className="form-error">{errors.date}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">金额</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className={`form-input ${errors.amount ? 'form-input-error' : ''}`}
            placeholder="请输入金额"
            min="1"
            step="1"
          />
          {errors.amount && (
            <div className="form-error">{errors.amount}</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {submitText}
        </button>
      </div>
    </form>
  )
}

export default InvoiceForm
