import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PhotoCard from './PhotoCard';
import PhotoViewer from './PhotoViewer';
import { usePhotoStore } from '../../store';
import { getAllPhotos } from '../storage/storageService';
import { demoPhotos } from '../storage/demoData';
import type { Photo } from '../../types';

const GAP = 12;
const INITIAL_COUNT = 20;
const LOAD_PER_PAGE = 8;

const GalleryPage: React.FC = () => {
  const {
    photos,
    displayedCount,
    isLoading,
    hasMore,
    setPhotos,
    setDisplayedCount,
    setIsLoading,
    setHasMore,
    openViewer
  } = usePhotoStore();

  const [columnCount, setColumnCount] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const dataLoaded = useRef(false);

  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      if (w < 600) setColumnCount(2);
      else if (w < 900) setColumnCount(3);
      else if (w < 1400) setColumnCount(4);
      else setColumnCount(5);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    if (!dataLoaded.current) {
      dataLoaded.current = true;
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

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      const total = photos.length;
      const next = Math.min(displayedCount + LOAD_PER_PAGE, total);
      setDisplayedCount(next);
      setHasMore(next < total);
      setIsLoading(false);
    }, 300);
  }, [photos.length, displayedCount, isLoading, hasMore, setDisplayedCount, setHasMore, setIsLoading]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [hasMore, isLoading, loadMore]);

  const displayedPhotos = useMemo(
    () => photos.slice(0, displayedCount),
    [photos, displayedCount]
  );

  const columns = useMemo(() => {
    const cols: Photo[][] = Array.from({ length: columnCount }, () => []);
    const colHeights: number[] = Array(columnCount).fill(0);

    displayedPhotos.forEach((photo) => {
      let shortestIdx = 0;
      for (let i = 1; i < columnCount; i++) {
        if (colHeights[i] < colHeights[shortestIdx]) {
          shortestIdx = i;
        }
      }
      cols[shortestIdx].push(photo);
      const aspectRatio = photo.height / photo.width || 1;
      const cardHeight = 200 * aspectRatio + 60;
      colHeights[shortestIdx] += cardHeight + GAP;
    });

    return cols;
  }, [displayedPhotos, columnCount]);

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
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
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
            transition: 'background-color 0.25s ease-out',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5A52E0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6C63FF'; }}
        >
          + 上传照片
        </Link>
      </header>

      <main style={{ padding: `${GAP}px` }} ref={containerRef}>
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
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              立即上传
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: `${GAP}px` }}>
            {columns.map((column, colIdx) => (
              <div key={colIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                {column.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onClick={() => openViewer(photo.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: '1px' }} />

        {isLoading && (
          <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px'
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#6C63FF',
                animation: 'spin 0.8s linear infinite'
              }} />
              加载中...
            </div>
          </div>
        )}

        {!hasMore && photos.length > 0 && (
          <div style={{
            padding: '40px 0 24px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '14px'
          }}>
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
