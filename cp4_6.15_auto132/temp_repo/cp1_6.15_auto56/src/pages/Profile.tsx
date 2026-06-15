import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Artwork, ActivityItem, User } from '../types';

type TabType = 'artworks' | 'favorites' | 'purchases' | 'activity';

function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('artworks');
  const [user, setUser] = useState<User | null>(null);
  const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // 上传/编辑表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dimensions: '',
    material: '木质',
    price: '',
    images: ['', '', '', '', ''],
  });

  const isOwnProfile = currentUser && currentUser.id === userId;

  useEffect(() => {
    const saved = localStorage.getItem('museum_user');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'artworks') {
        const { data } = await api.get(`/users/${userId}/artworks`);
        setMyArtworks(data);
      } else if (activeTab === 'favorites') {
        const { data } = await api.get(`/users/${userId}/favorites`);
        setFavorites(data);
      } else if (activeTab === 'purchases') {
        const { data } = await api.get(`/users/${userId}/purchases`);
        setPurchases(data);
      } else if (activeTab === 'activity') {
        const { data } = await api.get(`/users/${userId}/activity`);
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'artworks', label: '我的作品', icon: '🎨' },
    { key: 'favorites', label: '我的收藏', icon: '❤️' },
    { key: 'purchases', label: '购买记录', icon: '🛒' },
    { key: 'activity', label: '活动时间线', icon: '📅' },
  ];

  const handleStatusToggle = async (artwork: Artwork) => {
    try {
      const newStatus = artwork.status === 'active' ? 'inactive' : 'active';
      const { data } = await api.patch(`/artworks/${artwork.id}/status`, { status: newStatus });
      setMyArtworks(prev => prev.map(a => a.id === artwork.id ? data : a));
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setFormData({
      name: artwork.name,
      description: artwork.description,
      dimensions: artwork.dimensions,
      material: artwork.material,
      price: String(artwork.price),
      images: [...artwork.images, ...Array(5 - artwork.images.length).fill('')].slice(0, 5),
    });
    setShowEditModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const validImages = formData.images.filter(img => img.trim() !== '');
      if (editingArtwork) {
        await api.put(`/artworks/${editingArtwork.id}`, {
          ...formData,
          price: Number(formData.price),
          images: validImages,
        });
        setShowEditModal(false);
      } else {
        await api.post('/artworks', {
          ...formData,
          price: Number(formData.price),
          images: validImages,
          sellerId: currentUser.id,
          sellerName: currentUser.nickname,
        });
        setShowUploadModal(false);
      }
      setFormData({
        name: '',
        description: '',
        dimensions: '',
        material: '木质',
        price: '',
        images: ['', '', '', '', ''],
      });
      setEditingArtwork(null);
      loadData();
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('提交失败，请重试');
    }
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getActivityTag = (type: string) => {
    switch (type) {
      case 'favorite':
        return { label: '收藏', color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'purchase':
        return { label: '购买', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.15)' };
      case 'upload':
        return { label: '上传', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: '其他', color: 'var(--text-muted)', bg: 'var(--card-bg)' };
    }
  };

  return (
    <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px' }}>
      {/* 用户信息头部 */}
      <div className="frosted-card profile-header" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="profile-avatar">
            {isOwnProfile ? currentUser?.nickname.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
              {isOwnProfile ? currentUser?.nickname : '用户主页'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {myArtworks.length} 件作品 · {favorites.length} 个收藏 · {purchases.length} 次购买
            </p>
          </div>
          {isOwnProfile && (
            <button
              className="btn-gold"
              onClick={() => setShowUploadModal(true)}
            >
              + 上传作品
            </button>
          )}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <span style={{ marginRight: '6px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="tab-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>加载中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'artworks' && (
              <div className="artworks-grid">
                {myArtworks.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
                    <p>暂无作品，快去上传你的第一件作品吧！</p>
                  </div>
                ) : (
                  myArtworks.map((artwork, index) => (
                    <div
                      key={artwork.id}
                      className="artwork-item frosted-card"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="artwork-item-image" onClick={() => navigate(`/artwork/${artwork.id}`)}>
                        <img src={artwork.images[0]} alt={artwork.name} />
                        {artwork.status === 'inactive' && (
                          <div className="status-badge inactive">已下架</div>
                        )}
                      </div>
                      <div className="artwork-item-info">
                        <h4 className="artwork-item-title">{artwork.name}</h4>
                        <div className="artwork-item-price">¥{artwork.price}</div>
                      </div>
                      {isOwnProfile && (
                        <div className="artwork-item-actions">
                          <button onClick={() => handleEdit(artwork)} className="action-btn edit">
                            编辑
                          </button>
                          <button
                            onClick={() => handleStatusToggle(artwork)}
                            className={`action-btn ${artwork.status === 'active' ? 'offline' : 'online'}`}
                          >
                            {artwork.status === 'active' ? '下架' : '上架'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="favorites-list">
                {favorites.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
                    <p>还没有收藏的作品</p>
                  </div>
                ) : (
                  <div className="timeline">
                    {favorites.map((item, index) => (
                      <div key={item.id} className="timeline-item" style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className="timeline-date">{formatDate(item.createdAt)}</div>
                        <div className="timeline-content frosted-card">
                          <div className="timeline-tag" style={{ color: 'var(--info)', background: 'rgba(59, 130, 246, 0.15)' }}>
                            收藏
                          </div>
                          <div className="timeline-artwork" onClick={() => navigate(`/artwork/${item.artworkId}`)}>
                            <img src={item.artwork?.images?.[0]} alt="" className="timeline-thumb" />
                            <div className="timeline-artwork-info">
                              <div className="timeline-artwork-name">{item.artwork?.name}</div>
                              <div className="timeline-artwork-price">¥{item.artwork?.price}</div>
                            </div>
                          </div>
                          <div className="timeline-status">
                            {item.artwork?.status === 'active' ? '在售中' : '已下架'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className="purchases-list">
                {purchases.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
                    <p>还没有购买记录</p>
                  </div>
                ) : (
                  <div className="timeline">
                    {purchases.map((item, index) => (
                      <div key={item.id} className="timeline-item" style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className="timeline-date">{formatDate(item.createdAt)}</div>
                        <div className="timeline-content frosted-card">
                          <div className="timeline-tag" style={{ color: 'var(--success)', background: 'rgba(34, 197, 94, 0.15)' }}>
                            购买
                          </div>
                          <div className="timeline-artwork" onClick={() => navigate(`/artwork/${item.artworkId}`)}>
                            <img src={item.artwork?.images?.[0]} alt="" className="timeline-thumb" />
                            <div className="timeline-artwork-info">
                              <div className="timeline-artwork-name">{item.artwork?.name}</div>
                              <div className="timeline-artwork-price">¥{item.price}</div>
                            </div>
                          </div>
                          <div className="timeline-status success">
                            已完成
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="activity-list">
                {activities.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                    <p>暂无活动记录</p>
                  </div>
                ) : (
                  <div className="timeline">
                    {activities.map((item, index) => {
                      const tag = getActivityTag(item.type);
                      return (
                        <div key={`${item.type}-${item.id}`} className="timeline-item" style={{ animationDelay: `${index * 0.05}s` }}>
                          <div className="timeline-date">{formatDate(item.date)}</div>
                          <div className="timeline-content frosted-card">
                            <div className="timeline-tag" style={{ color: tag.color, background: tag.bg }}>
                              {tag.label}
                            </div>
                            <div className="timeline-artwork" onClick={() => navigate(`/artwork/${item.artwork.id}`)}>
                              <img src={item.artwork.images?.[0]} alt="" className="timeline-thumb" />
                              <div className="timeline-artwork-info">
                                <div className="timeline-artwork-name">{item.artwork.name}</div>
                                <div className="timeline-artwork-price">¥{item.artwork.price}</div>
                              </div>
                            </div>
                            <div className="timeline-status">
                              {item.status === 'active' ? '在售中' : item.status === 'inactive' ? '已下架' : item.status}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 上传作品弹窗 */}
      {(showUploadModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); setShowEditModal(false); setEditingArtwork(null); }}>
          <div className="upload-modal bounce-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">
              {editingArtwork ? '编辑作品' : '上传新作品'}
            </h3>
            <form onSubmit={handleUploadSubmit} className="upload-form">
              <div className="form-group">
                <label>作品名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入作品名称"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>材质</label>
                  <select
                    value={formData.material}
                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                  >
                    <option value="木质">木质</option>
                    <option value="树脂">树脂</option>
                    <option value="石膏">石膏</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>价格 (¥) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="请输入价格"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>规格尺寸</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={e => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder="例如：30cm × 20cm × 15cm"
                />
              </div>

              <div className="form-group">
                <label>作品描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请描述你的作品..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>作品照片 (最多5张)</label>
                <div className="image-grid">
                  {formData.images.map((img, index) => (
                    <div key={index} className="image-input-wrapper">
                      {img ? (
                        <div className="image-preview">
                          <img src={img} alt={`preview-${index}`} />
                          <button
                            type="button"
                            className="remove-image"
                            onClick={() => handleImageChange(index, '')}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder={`图片${index + 1}URL`}
                          value={img}
                          onChange={e => handleImageChange(index, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  请输入图片URL地址，第一张为主图
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => { setShowUploadModal(false); setShowEditModal(false); setEditingArtwork(null); }}
                >
                  取消
                </button>
                <button type="submit" className="btn-gold">
                  {editingArtwork ? '保存修改' : '上传作品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .profile-header {
          animation: fadeInUp 0.5s ease;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .profile-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--bg-primary);
          font-size: 28px;
          font-weight: 700;
        }
        .tabs-container {
          display: flex;
          gap: '8px';
          margin-bottom: 24px;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 0;
        }
        .tab-item {
          padding: 12px 20px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }
        .tab-item:hover {
          color: var(--text-primary);
        }
        .tab-item.active {
          color: var(--accent-gold);
        }
        .tab-item.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 2px;
          background: var(--accent-gold);
          border-radius: 2px;
        }
        .artworks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .artwork-item {
          overflow: hidden;
          animation: fadeInUp 0.4s ease forwards;
          opacity: 0;
        }
        .artwork-item-image {
          position: relative;
          width: 100%;
          height: 160px;
          cursor: pointer;
        }
        .artwork-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .status-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-badge.inactive {
          background: rgba(239, 68, 68, 0.9);
          color: white;
        }
        .artwork-item-info {
          padding: 12px 14px;
        }
        .artwork-item-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .artwork-item-price {
          font-size: 16px;
          color: var(--accent-gold);
          font-weight: 600;
        }
        .artwork-item-actions {
          display: flex;
          gap: 8px;
          padding: 0 14px 14px;
        }
        .action-btn {
          flex: 1;
          padding: 6px 0;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .action-btn.edit {
          background: rgba(59, 130, 246, 0.1);
          color: var(--info);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .action-btn.edit:hover {
          background: rgba(59, 130, 246, 0.2);
        }
        .action-btn.offline {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .action-btn.offline:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        .action-btn.online {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
          border-color: rgba(34, 197, 94, 0.3);
        }
        .action-btn.online:hover {
          background: rgba(34, 197, 94, 0.2);
        }
        .timeline {
          position: relative;
          padding-left: 24px;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--card-border);
        }
        .timeline-item {
          position: relative;
          margin-bottom: 20px;
          animation: fadeInUp 0.4s ease forwards;
          opacity: 0;
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -22px;
          top: 24px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent-gold);
          border: 2px solid var(--bg-primary);
          z-index: 1;
        }
        .timeline-date {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .timeline-content {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          position: relative;
        }
        .timeline-tag {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .timeline-artwork {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          cursor: pointer;
        }
        .timeline-thumb {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          object-fit: cover;
        }
        .timeline-artwork-info {
          flex: 1;
        }
        .timeline-artwork-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .timeline-artwork-price {
          font-size: 13px;
          color: var(--accent-gold);
        }
        .timeline-status {
          font-size: 12px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .timeline-status.success {
          color: var(--success);
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          gap: 16px;
          color: var(--text-muted);
        }
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--card-border);
          border-top-color: var(--accent-gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .upload-modal {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 28px;
          width: 90%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--card-border);
        }
        .bounce-in {
          animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.8); }
          60% { opacity: 1; transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--accent-gold);
          margin-bottom: 24px;
          text-align: center;
        }
        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-group label {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--card-border);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          border-color: var(--accent-gold);
        }
        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }
        .image-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        .image-input-wrapper {
          aspect-ratio: 1;
        }
        .image-input-wrapper input {
          width: 100%;
          height: 100%;
          padding: 8px;
          font-size: 11px;
          text-align: center;
        }
        .image-preview {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 6px;
          overflow: hidden;
        }
        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-image {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          color: white;
          border: none;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .form-actions button {
          flex: 1;
        }
        @media (max-width: 768px) {
          .artworks-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .image-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .timeline-content {
            flex-wrap: wrap;
            gap: 10px;
          }
          .timeline-tag {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;
