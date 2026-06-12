import React, { useState } from 'react';
import { createItem } from '../api';
import { useAppContext } from '../App';

const CATEGORIES = ['书籍', '小家电', '手工艺品'];

export default function Publish({ navigate }: { navigate: (path: string) => void }) {
  const { user, addToast, refreshItems } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('书籍');
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (!user) {
    navigate('/register');
    return null;
  }

  const handleImageFile = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      addToast('仅支持 JPG/PNG 格式');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('图片不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageBase64(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast('请填写完整信息');
      return;
    }
    setLoading(true);
    try {
      await createItem({
        user_id: user!.id,
        title: title.trim(),
        description: description.trim(),
        category,
        image: imageBase64 || undefined,
      });
      addToast('发布成功！');
      refreshItems();
      navigate('/');
    } catch (err: any) {
      addToast(err.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{
        marginBottom: '20px',
        cursor: 'pointer',
        color: '#D4A574',
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }} onClick={() => navigate('/')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#D4A574">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        返回公告板
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 4px 24px rgba(139,94,60,0.1)',
      }}>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          color: '#8B5E3C',
          fontSize: '22px',
          marginBottom: '24px',
        }}>
          📝 发布闲置物品
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Georgia, serif',
              color: '#8B5E3C',
              fontSize: '14px',
              marginBottom: '6px',
            }}>
              物品标题
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="给物品起个吸引人的标题"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #E8DDD3',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Georgia, serif',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#D4A574'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8DDD3'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Georgia, serif',
              color: '#8B5E3C',
              fontSize: '14px',
              marginBottom: '6px',
            }}>
              描述 <span style={{ color: '#A0887A', fontSize: '12px' }}>({description.length}/200)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 200))}
              placeholder="描述物品的状况、使用时间等..."
              maxLength={200}
              required
              style={{
                width: '100%',
                height: '100px',
                padding: '12px 16px',
                border: '1px solid #E8DDD3',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Georgia, serif',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#D4A574'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8DDD3'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Georgia, serif',
              color: '#8B5E3C',
              fontSize: '14px',
              marginBottom: '10px',
            }}>
              类别
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: category === cat ? '2px solid #D4A574' : '1px solid #E8DDD3',
                    borderRadius: '12px',
                    background: category === cat ? '#FFF8F0' : '#fff',
                    color: category === cat ? '#8B5E3C' : '#A0887A',
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Georgia, serif',
              color: '#8B5E3C',
              fontSize: '14px',
              marginBottom: '10px',
            }}>
              上传图片 <span style={{ color: '#A0887A', fontSize: '12px' }}>(JPG/PNG, 不超过5MB)</span>
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: dragOver ? '2px dashed #D4A574' : '2px dashed #E8DDD3',
                borderRadius: '14px',
                padding: imagePreview ? '0' : '32px',
                textAlign: 'center',
                background: dragOver ? '#FFF8F0' : '#FAFAFA',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
              }}
            >
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="预览"
                    style={{
                      width: '100%',
                      maxHeight: '250px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { setImageBase64(''); setImagePreview(''); }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="#C4B5A4" style={{ marginBottom: '8px' }}>
                    <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                  </svg>
                  <p style={{ fontFamily: 'Georgia, serif', color: '#A0887A', fontSize: '13px', marginBottom: '8px' }}>
                    拖拽图片到此处或点击上传
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileInput}
                    style={{ fontSize: '13px', fontFamily: 'Georgia, serif' }}
                  />
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#C4B5A4' : 'linear-gradient(135deg, #D4A574, #8B5E3C)',
              color: '#FFF8F0',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontFamily: 'Georgia, serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(139,94,60,0.3)',
            }}
          >
            {loading ? '发布中...' : '发布到公告板'}
          </button>
        </form>
      </div>
    </div>
  );
}
