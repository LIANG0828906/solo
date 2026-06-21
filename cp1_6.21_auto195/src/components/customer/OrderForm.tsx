import React, { useState } from 'react';

interface Props {
  totalPrice: number;
  totalItems: number;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (data: {
    customerName: string;
    phone: string;
    estimatedArrival: string;
    notes: string;
  }) => void;
}

const OrderForm: React.FC<Props> = ({ totalPrice, totalItems, onClose, onBack, onSubmit }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState(() => {
    const now = new Date(Date.now() + 30 * 60000);
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!customerName.trim()) newErrors.customerName = '请输入您的姓名';
    if (!phone.trim()) newErrors.phone = '请输入联系方式';
    else if (!/^1[3-9]\d{9}$/.test(phone.trim()) && !/^\d{7,15}$/.test(phone.trim())) {
      newErrors.phone = '请输入有效的电话号码';
    }
    if (!estimatedArrival) newErrors.estimatedArrival = '请选择预计到店时间';
    if (notes.length > 200) newErrors.notes = '备注最多200字';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const now = new Date();
      const [h, m] = estimatedArrival.split(':').map(Number);
      const arrival = new Date(now);
      arrival.setHours(h, m, 0, 0);
      if (arrival < now) {
        arrival.setDate(arrival.getDate() + 1);
      }
      onSubmit({
        customerName: customerName.trim(),
        phone: phone.trim(),
        estimatedArrival: arrival.toISOString(),
        notes: notes.trim(),
      });
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const modalStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'popIn 0.3s ease-out',
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '28px',
    borderBottom: '0.5px solid #E5E7EB',
    background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF2F2 100%)',
    borderRadius: '24px 24px 0 0',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '4px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
  };

  const formStyle: React.CSSProperties = {
    padding: '28px',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  };

  const getInputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: `1.5px solid ${hasError ? '#EF4444' : '#E5E7EB'}`,
    fontSize: '15px',
    transition: 'all 0.15s ease',
    outline: 'none',
    background: '#FFFFFF',
  });

  const errorTextStyle: React.CSSProperties = {
    color: '#EF4444',
    fontSize: '12px',
    marginTop: '6px',
  };

  const summaryStyle: React.CSSProperties = {
    background: '#FDF2F8',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    border: '0.5px solid #E5E7EB',
  };

  const summaryRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px',
  };

  const summaryTotalStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px dashed #E5E7EB',
    marginTop: '10px',
    fontSize: '18px',
    fontWeight: 700,
  };

  const buttonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
  };

  const backBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '14px',
    borderRadius: '12px',
    border: '1.5px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#6B7280',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const submitBtnStyle: React.CSSProperties = {
    flex: 2,
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: '#F59E0B',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const charCountStyle: React.CSSProperties = {
    textAlign: 'right',
    fontSize: '12px',
    color: notes.length > 200 ? '#EF4444' : '#9CA3AF',
    marginTop: '6px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>📋 提交预订订单</h2>
          <p style={subtitleStyle}>填写信息，我们将为您准备好一切</p>
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          <div style={summaryStyle}>
            <div style={summaryRowStyle}>
              <span style={{ color: '#6B7280' }}>菜品数量</span>
              <span style={{ fontWeight: 600, color: '#1F2937' }}>{totalItems} 份</span>
            </div>
            <div style={summaryTotalStyle}>
              <span style={{ color: '#1F2937' }}>订单总额</span>
              <span style={{ color: '#EF4444' }}>¥{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              👤 姓名 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="请输入您的姓名"
              style={getInputStyle(!!errors.customerName)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#F59E0B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.customerName ? '#EF4444' : '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {errors.customerName && <div style={errorTextStyle}>⚠️ {errors.customerName}</div>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              📱 联系方式 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号码"
              style={getInputStyle(!!errors.phone)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#F59E0B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.phone ? '#EF4444' : '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {errors.phone && <div style={errorTextStyle}>⚠️ {errors.phone}</div>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              ⏰ 预计到店时间 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="time"
              value={estimatedArrival}
              onChange={(e) => setEstimatedArrival(e.target.value)}
              style={getInputStyle(!!errors.estimatedArrival)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#F59E0B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.estimatedArrival ? '#EF4444' : '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {errors.estimatedArrival && <div style={errorTextStyle}>⚠️ {errors.estimatedArrival}</div>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>📝 备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="如有特殊要求请在此说明（如过敏、口味偏好等）"
              rows={3}
              style={{
                ...getInputStyle(!!errors.notes),
                resize: 'vertical',
                minHeight: '90px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#F59E0B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.notes ? '#EF4444' : '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={charCountStyle}>{notes.length}/200</div>
            {errors.notes && <div style={errorTextStyle}>⚠️ {errors.notes}</div>}
          </div>

          <div style={buttonsStyle}>
            <button
              type="button"
              style={backBtnStyle}
              onClick={onBack}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
              }}
            >
              ← 返回
            </button>
            <button
              type="submit"
              style={submitBtnStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#D97706';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F59E0B';
              }}
            >
              <span>✅</span>
              <span>确认提交订单</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
