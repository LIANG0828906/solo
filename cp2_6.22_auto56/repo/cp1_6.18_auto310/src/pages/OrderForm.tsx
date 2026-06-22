import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store';
import { fileToBase64 } from '../utils/api';
import { ProductType } from '../types';

const OrderForm = () => {
  const navigate = useNavigate();
  const createOrder = useOrderStore(state => state.createOrder);
  const isLoading = useOrderStore(state => state.isLoading);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    productType: '' as ProductType | '',
    description: ''
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newOrderNo, setNewOrderNo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerName.trim()) newErrors.customerName = '请输入客户姓名';
    if (!formData.phone.trim()) newErrors.phone = '请输入联系电话';
    else if (!/^1[3-9]\d{9}$/.test(formData.phone)) newErrors.phone = '请输入有效的手机号码';
    if (!formData.productType) newErrors.productType = '请选择产品类型';
    if (!formData.description.trim()) newErrors.description = '请输入需求描述';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (previewImages.length + files.length > 3) {
      alert('最多只能上传3张图片');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 2 * 1024 * 1024) {
        alert(`图片 ${file.name} 超过2MB限制`);
        continue;
      }
      const base64 = await fileToBase64(file);
      setPreviewImages(prev => [...prev, base64]);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const order = await createOrder({
        ...formData,
        productType: formData.productType as ProductType,
        referenceImages: previewImages
      });
      setNewOrderNo(order.orderNo);
      setShowSuccess(true);
    } catch (error) {
      alert('提交失败，请重试');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const productTypes: { value: ProductType; label: string; icon: string }[] = [
    { value: '饰品', label: '饰品', icon: 'fa-gem' },
    { value: '陶瓷', label: '陶瓷', icon: 'fa-mug-hot' },
    { value: '木工', label: '木工', icon: 'fa-tree' },
    { value: '织物', label: '织物', icon: 'fa-shirt' }
  ];

  if (showSuccess) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>提交成功！</h2>
          <p>您的定制需求已提交，我们会尽快与您联系</p>
          <div className="order-no-display">
            <span className="order-no-label">订单号：</span>
            <span className="order-no-value">{newOrderNo}</span>
          </div>
          <p className="order-no-hint">请妥善保管此订单号以便后续查询</p>
          <div className="success-actions">
            <button className="btn-primary" onClick={handleBackToDashboard}>
              返回订单看板
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowSuccess(false);
                setFormData({ customerName: '', phone: '', productType: '', description: '' });
                setPreviewImages([]);
              }}
            >
              继续创建订单
            </button>
          </div>
        </div>
        <style>{`
          .success-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
          }

          .success-card {
            background: #fff;
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: slideIn 0.5s ease-out;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .success-icon {
            font-size: 64px;
            color: #4CAF50;
            margin-bottom: 24px;
          }

          .success-card h2 {
            font-size: 28px;
            color: #424242;
            margin-bottom: 12px;
          }

          .success-card > p {
            color: #757575;
            margin-bottom: 32px;
            font-size: 16px;
          }

          .order-no-display {
            background: #FFF3E0;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 12px;
          }

          .order-no-label {
            color: #757575;
            font-size: 14px;
          }

          .order-no-value {
            font-size: 24px;
            font-weight: 700;
            color: #FF7043;
            margin-left: 8px;
            letter-spacing: 2px;
          }

          .order-no-hint {
            color: #9E9E9E;
            font-size: 13px;
            margin-bottom: 32px;
          }

          .success-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
          }

          .btn-primary {
            padding: 12px 32px;
            background-color: #FF7043;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 15px;
            font-weight: 500;
            transition: background-color 0.2s ease;
          }

          .btn-primary:hover {
            background-color: #F4511E;
          }

          .btn-secondary {
            padding: 12px 32px;
            background-color: transparent;
            color: #FF7043;
            border: 1px solid #FF7043;
            border-radius: 6px;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.2s ease;
          }

          .btn-secondary:hover {
            background-color: rgba(255, 112, 67, 0.1);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>提交定制需求</h1>
        <p>请填写以下信息，我们将尽快为您定制专属手工艺品</p>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3><i className="fas fa-user"></i> 客户信息</h3>
          <div className="form-row">
            <div className="form-group">
              <label>客户姓名 <span className="required">*</span></label>
              <input
                type="text"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="请输入客户姓名"
                className={errors.customerName ? 'error' : ''}
              />
              {errors.customerName && <span className="error-text">{errors.customerName}</span>}
            </div>
            <div className="form-group">
              <label>联系电话 <span className="required">*</span></label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><i className="fas fa-box"></i> 产品类型</h3>
          <div className="product-type-grid">
            {productTypes.map(type => (
              <label
                key={type.value}
                className={`product-type-item ${formData.productType === type.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="productType"
                  value={type.value}
                  checked={formData.productType === type.value}
                  onChange={e => setFormData({ ...formData, productType: e.target.value as ProductType })}
                  style={{ display: 'none' }}
                />
                <div className="product-type-content">
                  <i className={`fas ${type.icon}`}></i>
                  <span>{type.label}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.productType && <span className="error-text">{errors.productType}</span>}
        </div>

        <div className="form-section">
          <h3><i className="fas fa-images"></i> 参考图片（可选，最多3张，每张不超过2MB）</h3>
          <div className="image-upload-area">
            {previewImages.map((img, index) => (
              <div key={index} className="preview-image">
                <img src={img} alt={`参考图${index + 1}`} />
                <button type="button" className="remove-image" onClick={() => removeImage(index)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
            {previewImages.length < 3 && (
              <label className="upload-placeholder">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <i className="fas fa-plus"></i>
                <span>上传图片</span>
              </label>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3><i className="fas fa-align-left"></i> 需求描述 <span className="required">*</span></h3>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="请详细描述您的定制需求，包括尺寸、颜色、风格、用途等信息..."
            rows={5}
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            取消
          </button>
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? '提交中...' : '提交订单'}
          </button>
        </div>
      </form>

      <style>{`
        .form-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-header h1 {
          font-size: 32px;
          color: #5D4037;
          margin-bottom: 8px;
        }

        .form-header p {
          color: #8D6E63;
          font-size: 16px;
        }

        .order-form {
          background: #fff;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h3 {
          font-size: 18px;
          color: #5D4037;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #E0E0E0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #424242;
        }

        .required {
          color: #F44336;
        }

        .form-group input {
          padding: 12px 16px;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          font-size: 15px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #FF7043;
          box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.1);
        }

        .form-group input.error {
          border-color: #F44336;
        }

        .error-text {
          color: #F44336;
          font-size: 13px;
        }

        .product-type-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .product-type-item {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .product-type-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 24px;
          border: 2px solid #E0E0E0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .product-type-content i {
          font-size: 32px;
          color: #8D6E63;
          transition: color 0.2s ease;
        }

        .product-type-content span {
          font-size: 15px;
          font-weight: 500;
          color: #616161;
          transition: color 0.2s ease;
        }

        .product-type-item:hover .product-type-content {
          border-color: #FFAB91;
        }

        .product-type-item.selected .product-type-content {
          border-color: #FF7043;
          background-color: #FFF3E0;
        }

        .product-type-item.selected .product-type-content i {
          color: #FF7043;
        }

        .product-type-item.selected .product-type-content span {
          color: #FF7043;
        }

        .image-upload-area {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .preview-image {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
        }

        .preview-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-image {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 28px;
          height: 28px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .remove-image:hover {
          background: rgba(244, 67, 54, 0.9);
        }

        .upload-placeholder {
          width: 120px;
          height: 120px;
          border: 2px dashed #BDBDBD;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #9E9E9E;
        }

        .upload-placeholder:hover {
          border-color: #FF7043;
          color: #FF7043;
        }

        .upload-placeholder i {
          font-size: 24px;
        }

        .upload-placeholder span {
          font-size: 12px;
        }

        textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          font-size: 15px;
          resize: vertical;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        textarea:focus {
          outline: none;
          border-color: #FF7043;
          box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.1);
        }

        textarea.error {
          border-color: #F44336;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #E0E0E0;
        }

        .btn-cancel {
          padding: 12px 32px;
          background-color: transparent;
          color: #757575;
          border: 1px solid #BDBDBD;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover:not(:disabled) {
          background-color: #F5F5F5;
        }

        .btn-submit {
          padding: 12px 40px;
          background-color: #FF7043;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }

        .btn-submit:hover:not(:disabled) {
          background-color: #F4511E;
        }

        .btn-submit:disabled,
        .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .product-type-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderForm;
