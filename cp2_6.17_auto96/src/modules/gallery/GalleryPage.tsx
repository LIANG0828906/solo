import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PhotoCard from './PhotoCard';
import PhotoViewer from './PhotoViewer';
import { usePhotoStore } from '../../store';
import { getAllPhotos } from '../storage/storageService';
import { demoPhotos } from '../storage/demoData';

const GalleryPage: React.FC = () => {
  const {
    photos,
    displayedCount,
    isLoading,
    hasMore,
    setPhotos,
    loadMorePhotos,
    openViewer
  } = usePhotoStore();

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      getAllPhotos().then((data) => {
        if (data.length > 0) {
          setPhotos(data);
        } else {
          setPhotos(demoPhotos);
        }
      }).catch(() => {
        setPhotos(demoPhotos);
      });
    }
  }, [setPhotos]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columnCount = useMemo(() => {
    if (windowWidth < 600) return 2;
    if (windowWidth < 900) return 3;
    if (windowWidth < 1400) return 4;
    return 5;
  }, [windowWidth]);

  const displayedPhotos = useMemo(() => photos.slice(0, displayedCount), [photos, displayedCount]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMorePhotos();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMorePhotos]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1A1A2E' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#1A1A2E',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>
          <span style={{ color: '#6C63FF' }}>Photo</span>Vault
        </h1>
        <Link
          to="/upload"
          style={{
            backgroundColor: '#6C63FF',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'background-color 0.2s ease-out'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5A52E0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6C63FF'; }}
        >
          + 上传照片
        </Link>
      </header>

      <main style={{ padding: '24px' }}>
        {displayedPhotos.length === 0 && !isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#2D2D3F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              marginBottom: '24px'
            }}>
              📷
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              相册还是空的
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
              上传您的第一张照片开始使用 PhotoVault
            </p>
            <Link
              to="/upload"
              style={{
                backgroundColor: '#6C63FF',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              立即上传
            </Link>
          </div>
        ) : (
          <div
            style={{
              columnCount: columnCount,
              columnGap: '12px'
            }}
          >
            {displayedPhotos.map((photo) => (
              <div key={photo.id} style={{ breakInside: 'avoid', marginBottom: '12px' }}>
                <PhotoCard
                  photo={photo}
                  onClick={() => openViewer(photo.id)}
                />
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div ref={sentinelRef} style={{ padding: '40px', textAlign: 'center' }}>
            {isLoading && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: '#6C63FF',
                  animation: 'spin 0.8s linear infinite'
                }} />
                加载中...
              </div>
            )}
          </div>
        )}

        {!hasMore && photos.length > 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            — 没有更多照片了 —
          </div>
        )}
      </main>

      <PhotoViewer />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GalleryPage;
