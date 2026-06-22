import React, { useState, useCallback, useRef } from 'react';
import { useAppContext } from './context/AppContext';
import { Material, MaterialType } from './types';
import MaterialPanel from './pages/MaterialPanel';
import DraftEditor from './pages/DraftEditor';

const TYPE_COLORS: Record<MaterialType, string> = {
  text: '#3B82F6',
  link: '#22C55E',
  image: '#8B5CF6',
};

function AddMaterialModal({ onClose, onEditMaterial }: { onClose: () => void; onEditMaterial?: Material | null }) {
  const { addMaterial, updateMaterial } = useAppContext();
  const [title, setTitle] = useState(onEditMaterial?.title || '');
  const [content, setContent] = useState(onEditMaterial?.content || '');
  const [type, setType] = useState<MaterialType>(onEditMaterial?.type || 'text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(onEditMaterial?.imageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('图片大小不能超过3MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('仅支持 jpg/png/gif/webp 格式');
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;
    if (onEditMaterial) {
      await updateMaterial(onEditMaterial.id, { title, content, type }, imageFile || undefined);
    } else {
      await addMaterial({ title, content, type }, imageFile || undefined);
    }
    onClose();
  }, [title, content, type, imageFile, onEditMaterial, addMaterial, updateMaterial, onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#00000066',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '480px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.3s ease',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', marginBottom: '20px' }}>
          {onEditMaterial ? '编辑素材' : '新建素材'}
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '6px' }}>
            素材类型
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['text', 'link', 'image'] as MaterialType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: type === t ? `2px solid ${TYPE_COLORS[t]}` : '1px solid #E2E8F0',
                  background: type === t ? TYPE_COLORS[t] + '10' : '#FFFFFF',
                  color: type === t ? TYPE_COLORS[t] : '#64748B',
                  fontWeight: type === t ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'text' ? '文字摘录' : t === 'link' ? '链接' : '图片'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '6px' }}>
            标题 <span style={{ color: '#94A3B8', fontWeight: 400 }}>(不超过30字)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 30))}
            placeholder="输入素材标题..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
          />
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', textAlign: 'right' }}>
            {title.length}/30
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '6px' }}>
            {type === 'link' ? '链接地址' : '内容'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === 'link' ? '输入链接URL...' : '输入素材内容...'}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
          />
        </div>

        {type === 'image' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '6px' }}>
              图片上传 <span style={{ color: '#94A3B8', fontWeight: 400 }}>(限3MB，jpg/png/gif/webp)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#475569',
              }}
            >
              选择图片
            </button>
            {preview && (
              <div style={{ marginTop: '8px' }}>
                <img
                  src={preview}
                  alt="预览"
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px' }}
                />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#64748B',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: title.trim() ? '#3B82F6' : '#CBD5E1',
              color: '#FFFFFF',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (title.trim()) e.currentTarget.style.background = '#2563EB'; }}
            onMouseLeave={(e) => { if (title.trim()) e.currentTarget.style.background = '#3B82F6'; }}
          >
            {onEditMaterial ? '保存' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);

  const handleEditMaterial = useCallback((material: Material) => {
    setEditMaterial(material);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditMaterial(null);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          height: '56px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 0 #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '20px', fontWeight: 600, color: '#1E293B' }}>灵感素材夹</span>
        <button
          onClick={() => { setEditMaterial(null); setShowModal(true); }}
          style={{
            position: 'absolute',
            right: '20px',
            background: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2563EB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#3B82F6'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          + 新建素材
        </button>
      </header>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <MaterialPanel onEditMaterial={handleEditMaterial} />
        <div style={{ width: '1px', background: '#E2E8F0', flexShrink: 0 }} />
        <DraftEditor />
      </div>
      {showModal && <AddMaterialModal onClose={handleCloseModal} onEditMaterial={editMaterial} />}
    </div>
  );
}
