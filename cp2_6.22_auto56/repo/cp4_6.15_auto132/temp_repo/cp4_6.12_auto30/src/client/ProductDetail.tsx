import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Product, LeatherType, HardwareType, OrderItem } from '../types';
import { useCartStore, useOrderConfirmStore } from './store';

const LEATHER_TYPES: LeatherType[] = ['植鞣革', '铬鞣革', '马臀革', '疯马皮'];
const HARDWARE_TYPES: HardwareType[] = ['黄铜', '银', '古铜', '不锈钢'];

const calculateEstimatedArea = (
  areaRange: [number, number],
  thickness: number
): [number, number] => {
  const thicknessFactor = 1 + (thickness - 2) * 0.1;
  return [
    Math.round(areaRange[0] * thicknessFactor * 10) / 10,
    Math.round(areaRange[1] * thicknessFactor * 10) / 10,
  ];
};

const calculatePrice = (
  basePrice: number,
  leatherType: LeatherType,
  thickness: number,
  hardware: HardwareType
): number => {
  const leatherMultiplier: Record<LeatherType, number> = {
    '植鞣革': 1,
    '铬鞣革': 0.85,
    '马臀革': 1.8,
    '疯马皮': 1.2,
  };
  const hardwareMultiplier: Record<HardwareType, number> = {
    '黄铜': 1,
    '银': 1.5,
    '古铜': 1.1,
    '不锈钢': 1.2,
  };
  const thicknessFactor = 1 + (thickness - 2) * 0.15;
  return Math.round(basePrice * leatherMultiplier[leatherType] * hardwareMultiplier[hardware] * thicknessFactor);
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [leatherType, setLeatherType] = useState<LeatherType>('植鞣革');
  const [thickness, setThickness] = useState(2.0);
  const [hardware, setHardware] = useState<HardwareType>('黄铜');
  const [sketches, setSketches] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const setOrder = useOrderConfirmStore((state) => state.setOrder);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get<Product>(`/api/products/${id}`);
        setProduct(data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const estimatedArea = product ? calculateEstimatedArea(product.areaRange, thickness) : [0, 0];
  const price = product ? calculatePrice(product.basePrice, leatherType, thickness, hardware) : 0;

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      if (sketches.length + files.length > 3) {
        setError('最多只能上传3张参考草图');
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setError(`图片 ${file.name} 超过5MB限制`);
          return;
        }
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
          setError('仅支持JPG和PNG格式');
          return;
        }
      }

      setError('');

      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('sketches', file));

      try {
        const { data } = await axios.post<{ urls: string[] }>('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSketches((prev) => [...prev, ...data.urls]);
      } catch (err) {
        setError('图片上传失败');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [sketches.length]
  );

  const removeSketch = (index: number) => {
    setSketches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!product) return;
    if (!customerName.trim()) {
      setError('请输入您的姓名');
      return;
    }
    if (!customerPhone.trim()) {
      setError('请输入您的联系电话');
      return;
    }

    setSubmitting(true);
    setError('');

    const orderItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      leatherType,
      thickness,
      hardware,
      estimatedArea,
      price,
      sketchImages: sketches,
    };

    try {
      const { data } = await axios.post<{ orderNo: string }>('/api/orders', {
        customerName,
        customerPhone,
        items: [orderItem],
      });

      addItem(orderItem);
      setOrder(data.orderNo, [orderItem]);
      navigate('/order-confirm');
    } catch (err: any) {
      setError(err.response?.data?.message || '提交订单失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px' }}>加载中...</div>;
  }

  if (!product) {
    return <div style={{ textAlign: 'center', padding: '48px' }}>产品不存在</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#8B5E3C',
            borderRadius: '6px',
            border: '1px solid #D4A574',
            fontSize: '14px',
          }}
        >
          ← 返回列表
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#FFF8E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  style={{
                    width: '80px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: selectedImage === i ? '2px solid #D4A574' : '2px solid transparent',
                    padding: 0,
                    transition: 'all 0.2s ease-out',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto', paddingRight: '8px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                {product.name}
              </h1>
              <p style={{ color: '#666', lineHeight: 1.8 }}>{product.description}</p>
            </div>

            <div
              style={{
                backgroundColor: '#FFF8E1',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                皮革种类
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {LEATHER_TYPES.filter((t) => product.leatherTypes.includes(t)).map((type) => (
                  <button
                    key={type}
                    onClick={() => setLeatherType(type)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      ...(leatherType === type
                        ? {
                            backgroundColor: '#FFF3E0',
                            border: '2px solid #D4A574',
                            color: '#8B5E3C',
                          }
                        : {
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: '2px solid #E0E0E0',
                            color: '#666',
                          }),
                      transition: 'all 0.2s ease-out',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFF8E1',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                皮革厚度
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.5"
                  value={thickness}
                  onChange={(e) => setThickness(parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #8B5E3C ${((thickness - 1) / 3) * 100}%, #E0E0E0 ${((thickness - 1) / 3) * 100}%)`,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                  }}
                />
                <span
                  style={{
                    minWidth: '60px',
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#8B5E3C',
                  }}
                >
                  {thickness.toFixed(1)}mm
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFF8E1',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                五金配件
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {HARDWARE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setHardware(type)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      ...(hardware === type
                        ? {
                            backgroundColor: '#FFF3E0',
                            border: '2px solid #D4A574',
                            color: '#8B5E3C',
                          }
                        : {
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: '2px solid #E0E0E0',
                            color: '#666',
                          }),
                      transition: 'all 0.2s ease-out',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFF8E1',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                参考草图 ({sketches.length}/3)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                {sketches.map((sketch, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={sketch}
                      alt={`草图${i + 1}`}
                      style={{ width: '80px', height: '80px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => removeSketch(i)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#E57373',
                        color: 'white',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {sketches.length < 3 && (
                  <label
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '6px',
                      border: '2px dashed #D4A574',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#8B5E3C',
                      fontSize: '24px',
                      transition: 'all 0.2s ease-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFF3E0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    +
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      hidden
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#888' }}>支持JPG/PNG格式，单张不超过5MB，最多3张</p>
            </div>

            <div
              style={{
                backgroundColor: '#FFF8E1',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ color: '#666' }}>预估皮料面积</span>
                <span style={{ fontWeight: 600, color: '#8B5E3C' }}>
                  {estimatedArea[0]} - {estimatedArea[1]} 平方分米
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#666' }}>预估价格</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#D4A574' }}>¥{price}</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFF8E1',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                联系信息
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="请输入您的姓名"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease-out',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D4A574';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E0E0E0';
                  }}
                />
                <input
                  type="tel"
                  placeholder="请输入您的联系电话"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease-out',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D4A574';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E0E0E0';
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '16px',
                backgroundColor: '#8B5E3C',
                color: 'white',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                transition: 'all 0.1s ease',
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = '#A06A42';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8B5E3C';
              }}
              onMouseDown={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {submitting ? '提交中...' : '提交定制订单'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
