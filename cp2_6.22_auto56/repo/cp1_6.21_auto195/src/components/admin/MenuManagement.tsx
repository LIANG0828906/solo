import React, { useState } from 'react';
import { useMenu, MenuItem } from '../../context/MenuContext';
import MenuFormModal from './MenuFormModal';
import ImageModal from '../common/ImageModal';

const MenuManagement: React.FC = () => {
  const { state, addItem, updateItem, deleteItem } = useMenu();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setError('');
      await deleteItem(id);
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (data: Omit<MenuItem, 'id' | 'createdAt'>) => {
    try {
      setError('');
      if (editingItem) {
        await updateItem(editingItem.id, data);
      } else {
        await addItem(data);
      }
      setShowModal(false);
      setEditingItem(null);
    } catch (err: any) {
      throw err;
    }
  };

  const pageHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '4px',
  };

  const headerSubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
  };

  const addBtnStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: '#F59E0B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const errorStyle: React.CSSProperties = {
    background: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '0.5px solid #FECACA',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '0.5px solid #E5E7EB',
    padding: '20px',
    transition: 'all 0.25s ease',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  };

  const cardImageStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '12px',
    cursor: 'pointer',
    border: '2px solid #FDF2F8',
    flexShrink: 0,
  };

  const cardInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const cardNameStyle: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '4px',
    lineHeight: 1.3,
  };

  const cardPriceStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 800,
    color: '#EF4444',
    marginBottom: '8px',
  };

  const timeBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#F59E0B',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
  };

  const cardDescStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: 1.6,
    marginBottom: '16px',
    minHeight: '40px',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
  };

  const editBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: '1.5px solid #F59E0B',
    background: '#FFFFFF',
    color: '#F59E0B',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };

  const deleteBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: '1.5px solid #EF4444',
    background: '#FFFFFF',
    color: '#EF4444',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const confirmStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '20px',
    padding: '28px',
    maxWidth: '400px',
    width: '100%',
    animation: 'popIn 0.3s ease-out',
    textAlign: 'center',
  };

  const confirmIconStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
  };

  const confirmTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '8px',
  };

  const confirmMsgStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px',
  };

  const confirmBtnsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
  };

  const confirmCancelStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: '1.5px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const confirmDeleteStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    background: '#EF4444',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 24px',
    color: '#6B7280',
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '0.5px solid #E5E7EB',
  };

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h2 style={headerTitleStyle}>🍽️ 菜单管理</h2>
          <p style={headerSubtitleStyle}>
            共 {state.items.length} 道菜品 · 点击卡片图片查看大图
          </p>
        </div>
        <button
          style={addBtnStyle}
          onClick={handleAdd}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#D97706';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#F59E0B';
          }}
        >
          <span>➕</span>
          <span>添加菜品</span>
        </button>
      </div>

      {error && <div style={errorStyle}>⚠️ {error}</div>}

      {state.loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
          加载中...
        </div>
      ) : state.items.length === 0 ? (
        <div style={emptyStyle}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🍳</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            还没有添加菜品
          </div>
          <div style={{ fontSize: '14px' }}>点击右上角「添加菜品」开始创建您的菜单</div>
        </div>
      ) : (
        <div style={gridStyle}>
          {state.items.map((item) => (
            <div key={item.id} style={cardStyle} className="animate-fade-in-up">
              <div style={cardHeaderStyle}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={cardImageStyle}
                  onClick={() => setViewingImage({ src: item.image, alt: item.name })}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop';
                  }}
                />
                <div style={cardInfoStyle}>
                  <h3 style={cardNameStyle}>{item.name}</h3>
                  <div style={cardPriceStyle}>¥{item.price.toFixed(2)}</div>
                  <span style={timeBadgeStyle}>
                    ⏰ {item.startTime}-{item.endTime}
                  </span>
                </div>
              </div>

              <p style={cardDescStyle}>{item.description || '暂无描述'}</p>

              <div style={actionsStyle}>
                <button
                  style={editBtnStyle}
                  onClick={() => handleEdit(item)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#FFFBEB';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                  }}
                >
                  ✏️ 编辑
                </button>
                <button
                  style={deleteBtnStyle}
                  onClick={() => setDeleteConfirm(item.id)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                  }}
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MenuFormModal
          editingItem={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {viewingImage && (
        <ImageModal
          src={viewingImage.src}
          alt={viewingImage.alt}
          onClose={() => setViewingImage(null)}
        />
      )}

      {deleteConfirm && (
        <div style={overlayStyle} onClick={() => setDeleteConfirm(null)}>
          <div style={confirmStyle} onClick={(e) => e.stopPropagation()}>
            <div style={confirmIconStyle}>⚠️</div>
            <div style={confirmTitleStyle}>确认删除这道菜品？</div>
            <div style={confirmMsgStyle}>删除后无法恢复，请谨慎操作</div>
            <div style={confirmBtnsStyle}>
              <button
                style={confirmCancelStyle}
                onClick={() => setDeleteConfirm(null)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                }}
              >
                取消
              </button>
              <button
                style={confirmDeleteStyle}
                onClick={() => handleDelete(deleteConfirm)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#EF4444';
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
