import React, { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';

interface FormData {
  orderId: string;
  itemName: string;
  amount: string;
  reason: string;
}

interface FormErrors {
  orderId?: string;
  itemName?: string;
  amount?: string;
  reason?: string;
}

const TicketForm: React.FC = () => {
  const createTicket = useTicketStore((state) => state.createTicket);
  const [formData, setFormData] = useState<FormData>({
    orderId: '',
    itemName: '',
    amount: '',
    reason: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateOrderId = (value: string): string | undefined => {
    if (!value) return '订单号不能为空';
    if (!/^\d{16}$/.test(value)) return '订单号必须为16位数字';
    return undefined;
  };

  const validateItemName = (value: string): string | undefined => {
    if (value.length > 60) return '商品名称最多60字';
    return undefined;
  };

  const validateAmount = (value: string): string | undefined => {
    if (!value) return '退款金额不能为空';
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return '请输入有效的金额';
    if (!/^\d+(\.\d{1,2})?$/.test(value)) return '金额最多保留两位小数';
    return undefined;
  };

  const validateReason = (value: string): string | undefined => {
    if (value.length > 500) return '退款原因最多500字';
    return undefined;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let error: string | undefined;
    switch (name) {
      case 'orderId':
        error = validateOrderId(value);
        break;
      case 'itemName':
        error = validateItemName(value);
        break;
      case 'amount':
        error = validateAmount(value);
        break;
      case 'reason':
        error = validateReason(value);
        break;
    }
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {
      orderId: validateOrderId(formData.orderId),
      itemName: validateItemName(formData.itemName),
      amount: validateAmount(formData.amount),
      reason: validateReason(formData.reason),
    };

    const hasErrors = Object.values(newErrors).some(
      (error) => error !== undefined
    );
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    createTicket({
      orderId: formData.orderId,
      itemName: formData.itemName,
      amount: parseFloat(formData.amount),
      reason: formData.reason,
    });

    setFormData({
      orderId: '',
      itemName: '',
      amount: '',
      reason: '',
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const inputFocusStyle = {
    borderColor: '#4F46E5',
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        height: 'fit-content',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '20px',
          color: '#111827',
        }}
      >
        创建退款工单
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: '#374151',
            }}
          >
            订单号 <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            name="orderId"
            value={formData.orderId}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请输入16位数字订单号"
            style={
              errors.orderId
                ? { ...inputStyle, borderColor: '#EF4444' }
                : inputStyle
            }
            onFocus={(e) => {
              e.target.style.borderColor = inputFocusStyle.borderColor;
            }}
            maxLength={16}
          />
          {errors.orderId && (
            <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
              {errors.orderId}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: '#374151',
            }}
          >
            商品名称
          </label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请输入商品名称（最多60字）"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = inputFocusStyle.borderColor;
            }}
            maxLength={60}
          />
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
            {formData.itemName.length}/60
          </div>
          {errors.itemName && (
            <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
              {errors.itemName}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: '#374151',
            }}
          >
            退款金额（元） <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请输入退款金额"
            style={
              errors.amount
                ? { ...inputStyle, borderColor: '#EF4444' }
                : inputStyle
            }
            onFocus={(e) => {
              e.target.style.borderColor = inputFocusStyle.borderColor;
            }}
          />
          {errors.amount && (
            <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
              {errors.amount}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: '#374151',
            }}
          >
            退款原因
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请输入退款原因（最多500字）"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={(e) => {
              e.target.style.borderColor = inputFocusStyle.borderColor;
            }}
            maxLength={500}
          />
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
            {formData.reason.length}/500
          </div>
          {errors.reason && (
            <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
              {errors.reason}
            </p>
          )}
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            marginTop: '8px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#4338CA';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4F46E5';
          }}
        >
          提交工单
        </button>
      </form>
    </div>
  );
};

export default TicketForm;
