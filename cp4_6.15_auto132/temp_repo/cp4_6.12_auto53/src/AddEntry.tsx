import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (p: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} draggable={true} eventHandlers={{
    dragend: (e) => {
      const marker = e.target;
      const pos = marker.getLatLng();
      setPosition([pos.lat, pos.lng]);
    },
  }} />;
}

const AddEntry = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [position, setPosition] = useState<[number, number]>([
    39.9042, 116.4074,
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [photoPreviews]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - photos.length);
    const validFiles = newFiles.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setPhotos((prev) => [...prev, ...validFiles]);
    setPhotoPreviews((prev) => [
      ...prev,
      ...validFiles.map((f) => URL.createObjectURL(f)),
    ]);
  }, [photos.length]);

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!date) newErrors.date = '请选择日期';
    if (!location.trim()) newErrors.location = '请输入地点名称';
    if (!content.trim()) newErrors.content = '请输入游记内容';
    if (content.length > 2000) newErrors.content = '内容不能超过2000字';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('date', date);
      formData.append('location', location.trim());
      formData.append('content', content.trim());
      formData.append('lat', String(position[0]));
      formData.append('lng', String(position[1]));
      photos.forEach((p) => formData.append('photos', p));

      const res = await axios.post('/api/entries', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/', {
        state: { newEntryId: res.data.id },
      });
    } catch (err) {
      console.error('提交失败:', err);
      alert('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    border: '1.5px solid rgba(180,140,100,0.25)',
    borderRadius: '10px',
    background: '#fef9ef',
    color: '#5a4a3a',
    fontSize: '15px',
    fontFamily: "'Noto Serif SC', serif",
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#8b6f47',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '8px',
    letterSpacing: '0.5px',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fef9ef 0%, #faf3e6 100%)',
        padding: '40px 20px 80px',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#8b6f47',
              textDecoration: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4a96e')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8b6f47')}
          >
            ← 返回时光轴
          </Link>
          <h1
            style={{
              fontFamily: "'Noto Serif SC', serif",
              color: '#8b6f47',
              fontSize: '32px',
              fontWeight: 700,
            }}
          >
            ✍️ 记录新旅程
          </h1>
          <div style={{ width: '120px' }} />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: '7fr 3fr',
            gap: '30px',
          }}
        >
          <div
            style={{
              background: '#fef9ef',
              borderRadius: '16px',
              padding: '36px',
              boxShadow: '0 4px 30px rgba(180,140,100,0.1)',
              border: '1px solid rgba(180,140,100,0.08)',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>📅 旅行日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.date
                    ? 'rgba(220,80,60,0.5)'
                    : undefined,
                }}
              />
              {errors.date && (
                <div
                  style={{
                    color: '#dc503c',
                    fontSize: '13px',
                    marginTop: '6px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {errors.date}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>📍 地点名称</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如：西湖、北京故宫、东京浅草寺..."
                style={{
                  ...inputStyle,
                  borderColor: errors.location
                    ? 'rgba(220,80,60,0.5)'
                    : undefined,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(212,169,110,0.6)';
                  e.target.style.boxShadow =
                    '0 0 0 3px rgba(212,169,110,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(180,140,100,0.25)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.location && (
                <div
                  style={{
                    color: '#dc503c',
                    fontSize: '13px',
                    marginTop: '6px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {errors.location}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>
                ✍️ 游记正文 ({content.length}/2000)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                placeholder="在这里记录你旅行中的感受、见闻和难忘的瞬间..."
                rows={12}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '240px',
                  lineHeight: 1.9,
                  borderColor: errors.content
                    ? 'rgba(220,80,60,0.5)'
                    : undefined,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(212,169,110,0.6)';
                  e.target.style.boxShadow =
                    '0 0 0 3px rgba(212,169,110,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(180,140,100,0.25)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.content && (
                <div
                  style={{
                    color: '#dc503c',
                    fontSize: '13px',
                    marginTop: '6px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {errors.content}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>
                📷 旅行照片 ({photos.length}/5)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging
                    ? '2.5px dashed #d4a96e'
                    : '2px dashed rgba(180,140,100,0.35)',
                  borderRadius: '12px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragging
                    ? 'rgba(212,169,110,0.08)'
                    : 'rgba(254,249,239,0.5)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                  {isDragging ? '📥' : '🖼️'}
                </div>
                <div
                  style={{
                    color: '#8b6f47',
                    fontSize: '15px',
                    marginBottom: '6px',
                    fontFamily: "'Noto Serif SC', serif",
                    fontWeight: 500,
                  }}
                >
                  {isDragging
                    ? '松开鼠标即可上传'
                    : '点击或拖拽图片到此处'}
                </div>
                <div
                  style={{
                    color: '#a08868',
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  支持 JPG/PNG 格式，最多 5 张
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {photoPreviews.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '14px',
                    marginTop: '20px',
                  }}
                >
                  {photoPreviews.map((preview, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        aspectRatio: '1',
                        boxShadow: '0 2px 10px rgba(180,140,100,0.15)',
                      }}
                    >
                      <img
                        src={preview}
                        alt={`预览 ${i + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(220,80,60,0.9)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '36px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: isSubmitting
                    ? 'rgba(212,169,110,0.6)'
                    : 'linear-gradient(135deg, #e8c38a 0%, #d4a96e 100%)',
                  color: '#5a4a3a',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: 600,
                  fontFamily: "'Noto Serif SC', serif",
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: isSubmitting
                    ? 'none'
                    : '0 4px 20px rgba(212,169,110,0.35)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow =
                      '0 8px 30px rgba(212,169,110,0.5)';
                    e.currentTarget.style.filter = 'brightness(1.05)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow =
                      '0 4px 20px rgba(212,169,110,0.35)';
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isSubmitting ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        border: '2.5px solid rgba(90,74,58,0.3)',
                        borderTop: '2.5px solid #5a4a3a',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    正在保存...
                  </span>
                ) : (
                  '✨ 保存游记'
                )}
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </button>
            </div>
          </div>

          <div
            style={{
              background: '#fef9ef',
              borderRadius: '16px',
              padding: '36px',
              boxShadow: '0 4px 30px rgba(180,140,100,0.1)',
              border: '1px solid rgba(180,140,100,0.08)',
              position: 'sticky',
              top: '20px',
              alignSelf: 'flex-start',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#8b6f47',
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                🗺️ 选择地点
              </h3>
              <p
                style={{
                  color: '#a08868',
                  fontSize: '13px',
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.7,
                }}
              >
                在地图上点击或拖动图钉标记旅行位置
              </p>
            </div>

            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1.5px solid rgba(180,140,100,0.2)',
                marginBottom: '16px',
              }}
            >
              <MapContainer
                center={position}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                  position={position}
                  setPosition={setPosition}
                />
              </MapContainer>
            </div>

            <div
              style={{
                background: 'rgba(212,169,110,0.08)',
                borderRadius: '10px',
                padding: '14px 18px',
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  color: '#a08868',
                  marginBottom: '6px',
                }}
              >
                已选坐标
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  color: '#8b6f47',
                  fontWeight: 500,
                }}
              >
                纬度: {position[0].toFixed(6)}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  color: '#8b6f47',
                  fontWeight: 500,
                }}
              >
                经度: {position[1].toFixed(6)}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntry;
