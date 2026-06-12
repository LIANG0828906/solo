import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Artwork } from '../../types';
import { useGalleryStore } from '../../store';

const AdminPanel: React.FC = () => {
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const setArtworks = useGalleryStore((state) => state.setArtworks);

  useEffect(() => {
    fetchPendingArtworks();
  }, []);

  const fetchPendingArtworks = async () => {
    try {
      const response = await axios.get('/api/artworks?status=pending');
      setPendingArtworks(response.data);
    } catch (error) {
      console.error('获取待审核画作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.post(`/api/artworks/${id}/approve`);
      setPendingArtworks((prev) => prev.filter((a) => a.id !== id));
      const allResponse = await axios.get('/api/artworks');
      setArtworks(allResponse.data);
    } catch (error) {
      console.error('审核失败:', error);
      alert('审核失败');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">画作审核</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
      ) : pendingArtworks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          暂无待审核的画作
        </div>
      ) : (
        <div className="artwork-grid">
          {pendingArtworks.map((artwork) => (
            <div key={artwork.id} className="card" style={{ padding: '0' }}>
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.background = '#E0E0D0';
                }}
              />
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{artwork.title}</div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {artwork.artistName} · {artwork.year}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#A67C52', marginBottom: '12px' }}>
                  ¥{artwork.price.toFixed(2)}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => handleApprove(artwork.id)}
                >
                  通过审核
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
