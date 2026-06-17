import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPhotoById } from '../storage/storageService';
import type { Photo } from '../../types';

const PhotoSharePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getPhotoById(id)
      .then((data) => {
        setPhoto(data || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#1A1A2E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.2)',
          borderTopColor: '#6C63FF',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!photo) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '24px'
        }}>🔍</div>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
          照片不存在
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px', textAlign: 'center' }}>
          这张照片可能已被删除，或者链接无效
        </p>
        <Link
          to="/"
          style={{
            backgroundColor: '#6C63FF',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          返回图库
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1A1A2E',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
          <span style={{ color: '#6C63FF' }}>Photo</span>Vault
        </h1>
        <Link
          to="/"
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease-out'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          ← 返回图库
        </Link>
      </header>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div className="fade-in" style={{ maxWidth: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={photo.fullUrl}
            alt={photo.title}
            style={{
              maxWidth: '100%',
              maxHeight: '75vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)'
            }}
          />
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              {photo.title}
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
              拍摄于 {photo.date}
            </p>
          </div>
        </div>
      </div>

      <footer style={{
        padding: '16px 24px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '12px',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        PhotoVault - 您的私人相册
      </footer>
    </div>
  );
};

export default PhotoSharePage;
