import React, { useState, useEffect } from 'react';
import { MenuItem } from '../../context/MenuContext';

interface Props {
  editingItem: MenuItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<MenuItem, 'id' | 'createdAt'>) => Promise<void>;
}

const MenuFormModal: React.FC<Props> = ({ editingItem, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('22:00');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setPrice(editingItem.price.toFixed(2));
      setDescription(editingItem.description);
      setImage(editingItem.image);
      setStartTime(editingItem.startTime);
      setEndTime(editingItem.endTime);
    }
  }, [editingItem]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = '请输入菜品名称';
    else if (name.length > 40) newErrors.name = '菜品名称最多40字';
    if (!price || price.trim() === '') newErrors.price = '请输入价格';
    else if (isNaN(Number(price)) || Number(price) < 0) newErrors.price = '请输入有效的价格';
    if (description.length > 200) newErrors.description = '描述最多200字';
    if (!startTime) newErrors.startTime = '请选择开始时间';
    if (!endTime) newErrors.endTime = '请选择结束时间';
    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      await onSubmit({
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        image:
          image.trim() ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop',
        startTime,
        endTime,
      });
    } catch (err: any) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  };

  const modalStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'popIn 0.3s ease-out',
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px 28px',
    borderBottom: '0.5px solid #E5E7EB',
    background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF2F2 100%)',
    borderRadius: '24px 24px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1F2937',
  };

  const closeBtnStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '0.5px solid #E5E7EB',
    transition: 'all 0.15s ease',
  };

  const formStyle: React.CSSProperties = {
    padding: '24px 28px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  };

  const requiredStyle: React.CSSProperties = {
    color: '#EF4444',
  };

  const getInputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: `1.5px solid ${hasError ? '#EF4444' : '#E5E7EB'}`,
    fontSize: '14px',
    transition: 'all 0.15s ease',
    outline: 'none',
    background: '#FFFFFF',
  });

  const timeInputStyle = (hasError: boolean, isActive: boolean): React.CSSProperties => ({
    ...getInputStyle(hasError),
    background: isActive ? 'rgba(245, 158, 11, 0.08)' : '#FFFFFF',
    borderColor: isActive ? '#F59E0B' : hasError ? '#EF4444' : '#E5E7EB',
    fontWeight: isActive ? 600 : 400,
  });

  const textareaStyle = (hasError: boolean): React.CSSProperties => ({
    ...getInputStyle(hasError),
    resize: 'vertical',
    minHeight: '100px',
    lineHeight: 1.6,
  });

  const errorTextStyle: React.CSSProperties = {
    color: '#EF4444',
    fontSize: '12px',
    marginTop: '6px',
  };

  const charCountStyle = (len: number, max: number): React.CSSProperties => ({
    textAlign: 'right',
    fontSize: '12px',
    color: len > max ? '#EF4444' : '#9CA3AF',
    marginTop: '6px',
  });

  const previewStyle: React.CSSProperties = {
    marginTop: '10px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '12px',
    background: '#F9FAFB',
    borderRadius: '12px',
    border: '0.5px solid #E5E7EB',
  };

  const previewImgStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '2px solid #FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const previewInfoStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7280',
    lineHeight: 1.6,
  };

  const footerStyle: React.CSSProperties = {
    padding: '20px 28px',
    borderTop: '0.5px solid #E5E7EB',
    display: 'flex',
    gap: '12px',
    background: '#F9FAFB',
    borderRadius: '0 0 24px 24px',
  };

  const cancelBtnStyle: React.CSSProperties = {
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
    cursor: submitting ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: submitting ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const submitErrorStyle: React.CSSProperties = {
    background: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '13px',
    border: '0.5px solid #FECACA',
  };

  const getFocusHandler = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    hasError: boolean
  ) => {
    e.currentTarget.style.borderColor = '#F59E0B';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
  };

  const getBlurHandler = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    hasError: boolean
  ) => {
    e.currentTarget.style.borderColor = hasError ? '#EF4444' : '#E5E7EB';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            {editingItem ? '✏️ 编辑菜品' : '➕ 添加新菜品'}
          </h2>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
            }}
          >
            ✕
          </button>
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          {errors.submit && <div style={submitErrorStyle}>⚠️ {errors.submit}</div>}

          <div style={fieldStyle}>
            <label style={labelStyle}>
              菜品名称 <span style={requiredStyle}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入菜品名称（最多40字）"
              maxLength={40}
              style={getInputStyle(!!errors.name)}
              onFocus={(e) => getFocusHandler(e, !!errors.name)}
              onBlur={(e) => getBlurHandler(e, !!errors.name)}
            />
            <div style={{ ...charCountStyle(name.length, 40), marginTop: errors.name ? '4px' : '6px' }}>
              {name.length}/40
            </div>
            {errors.name && <div style={errorTextStyle}>⚠️ {errors.name}</div>}
          </div>

          <div style={rowStyle}>
            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>
                价格（元）<span style={requiredStyle}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                style={getInputStyle(!!errors.price)}
                onFocus={(e) => getFocusHandler(e, !!errors.price)}
                onBlur={(e) => getBlurHandler(e, !!errors.price)}
              />
              {price && !errors.price && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                  自动格式化：¥{Number(price || 0).toFixed(2)}
                </div>
              )}
              {errors.price && <div style={errorTextStyle}>⚠️ {errors.price}</div>}
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>
                特价时段 <span style={requiredStyle}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={timeInputStyle(!!errors.startTime, true)}
                />
                <span style={{ color: '#9CA3AF', fontWeight: 600 }}>至</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={timeInputStyle(!!errors.endTime, true)}
                />
              </div>
              {(errors.startTime || errors.endTime) && (
                <div style={errorTextStyle}>⚠️ {errors.startTime || errors.endTime}</div>
              )}
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>菜品描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入菜品描述（最多200字）"
              maxLength={200}
              style={textareaStyle(!!errors.description)}
              onFocus={(e) => getFocusHandler(e, !!errors.description)}
              onBlur={(e) => getBlurHandler(e, !!errors.description)}
            />
            <div
              style={{
                ...charCountStyle(description.length, 200),
                marginTop: errors.description ? '4px' : '6px',
              }}
            >
              {description.length}/200
            </div>
            {errors.description && <div style={errorTextStyle}>⚠️ {errors.description}</div>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>图片链接</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="请输入图片URL（可选，将使用默认图片）"
              style={getInputStyle(false)}
              onFocus={(e) => getFocusHandler(e, false)}
              onBlur={(e) => getBlurHandler(e, false)}
            />
            {image && (
              <div style={previewStyle}>
                <img
                  src={image}
                  alt="预览"
                  style={previewImgStyle}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop';
                  }}
                />
                <div style={previewInfoStyle}>
                  <div style={{ fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                    📷 图片预览
                  </div>
                  <div>图片将以 120×120px 圆角缩略图显示</div>
                  <div>建议尺寸：300×300px 以上的正方形图片</div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div style={footerStyle}>
          <button
            type="button"
            style={cancelBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
            }}
          >
            取消
          </button>
          <button
            type="button"
            style={submitBtnStyle}
            onClick={handleSubmit as any}
            disabled={submitting}
            onMouseEnter={(e) => {
              if (!submitting) {
                (e.currentTarget as HTMLButtonElement).style.background = '#D97706';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F59E0B';
            }}
          >
            <span>{submitting ? '⏳' : editingItem ? '💾' : '✨'}</span>
            <span>{submitting ? '保存中...' : editingItem ? '保存修改' : '添加菜品'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuFormModal;
