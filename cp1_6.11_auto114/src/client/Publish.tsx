import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { categoryLabels } from './types';

interface PublishProps {
  onClose: () => void;
}

const Publish: React.FC<PublishProps> = ({ onClose }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'new' | 'minor-flaw' | 'used'>('new');
  const [conditionDescription, setConditionDescription] = useState('');
  const [rentPerDay, setRentPerDay] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = 3 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError('请上传图片文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('请输入乐器名称');
      return;
    }
    if (!category) {
      setError('请选择分类');
      return;
    }
    if (images.length === 0) {
      setError('请至少上传一张图片');
      return;
    }
    if (!rentPerDay || Number(rentPerDay) <= 0) {
      setError('请输入有效的日租金');
      return;
    }
    if (!salePrice || Number(salePrice) <= 0) {
      setError('请输入有效的售价');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        '/api/instruments',
        {
          name,
          category,
          images,
          condition,
          conditionDescription,
          rentPerDay: Number(rentPerDay),
          salePrice: Number(salePrice),
          publisherId: user?.id,
          publisherNickname: user?.nickname,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        navigate(`/instrument/${response.data.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(92, 51, 23, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#FFF8DC',
          borderRadius: '16px',
          border: '2px solid #8B4513',
          boxShadow: '0 12px 48px rgba(92, 51, 23, 0.3)',
          padding: '32px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideIn 0.3s ease-out',
          position: 'relative',
        }}
      >
        {showSuccess && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(76, 175, 80, 0.95)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              zIndex: 10,
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>发布成功！</h2>
            <p>正在跳转到商品详情页...</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', color: '#5C3317' }}>发布乐器</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#8B4513',
              fontSize: '24px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
              乐器名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：马丁D-28木吉他"
              style={{ width: '100%', height: '44px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
                分类 *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', height: '44px' }}
              >
                <option value="">请选择分类</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
                成色 *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'new' | 'minor-flaw' | 'used')}
                style={{ width: '100%', height: '44px' }}
              >
                <option value="new">全新</option>
                <option value="minor-flaw">微瑕</option>
                <option value="used">旧品</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
                日租金（元）*
              </label>
              <input
                type="number"
                value={rentPerDay}
                onChange={(e) => setRentPerDay(e.target.value)}
                placeholder="例如：80"
                min="1"
                style={{ width: '100%', height: '44px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
                售价（元）*
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="例如：8500"
                min="1"
                style={{ width: '100%', height: '44px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
              成色描述
            </label>
            <textarea
              value={conditionDescription}
              onChange={(e) => setConditionDescription(e.target.value)}
              placeholder="描述乐器的使用情况、保养状态等..."
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#5C3317', marginBottom: '6px', fontWeight: '500' }}>
              上传图片（最多3张）*
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#FF8C00' : '#8B4513'}`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? '#FFE4B5' : 'transparent',
                transition: 'all 0.2s ease-out',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {images.length > 0 ? (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {images.map((img, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={img}
                        alt={`preview-${index}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #8B4513',
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#E53935',
                          color: 'white',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <div
                      style={{
                        width: '100px',
                        height: '100px',
                        border: '2px dashed #DEB887',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8B4513',
                        fontSize: '24px',
                      }}
                    >
                      +
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '32px' }}>📷</div>
                  <p style={{ color: '#5C3317', fontSize: '14px' }}>
                    拖拽图片到此处，或点击选择文件
                  </p>
                  <p style={{ color: '#8B4513', fontSize: '12px' }}>支持 JPG、PNG 格式，最多3张</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>

          {error && (
            <div
              style={{
                background: '#FFEBEB',
                border: '1px solid #E53935',
                color: '#C62828',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                color: '#5C3317',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                height: '48px',
                border: '1px solid #8B4513',
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                background: '#FF8C00',
                color: 'white',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                height: '48px',
                boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '发布中...' : '提交发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Publish;
