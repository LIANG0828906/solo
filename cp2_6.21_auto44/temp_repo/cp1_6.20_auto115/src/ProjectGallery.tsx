import React, { useState, useEffect, useRef, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import type { Photo, License } from './types';
import { getPhotoLicenses, recordView } from './api';

interface ProjectGalleryProps {
  photos: Photo[];
  onPhotoClick: (photoId: string) => void;
  loading?: boolean;
}

const breakpointColumns = {
  default: 3,
  1100: 2,
  700: 1,
};

const ProjectGallery: React.FC<ProjectGalleryProps> = ({ photos, onPhotoClick, loading }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [photoLicenses, setPhotoLicenses] = useState<Map<string, License[]>>(new Map());

  useEffect(() => {
    const fetchLicenses = async () => {
      const licenseMap = new Map<string, License[]>();
      for (const photo of photos.slice(0, 12)) {
        try {
          const licenses = await getPhotoLicenses(photo.id);
          licenseMap.set(photo.id, licenses);
        } catch (e) {
          // ignore
        }
      }
      setPhotoLicenses(licenseMap);
    };
    if (photos.length > 0) {
      fetchLicenses();
    }
  }, [photos]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-photo-id');
            if (id && !loadedImages.has(id)) {
              setLoadedImages((prev) => new Set(prev).add(id));
            }
          }
        });
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    const currentObserver = observerRef.current;
    imageRefs.current.forEach((el) => {
      if (el) currentObserver.observe(el);
    });

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [photos, loadedImages]);

  const setImageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      imageRefs.current.set(id, el);
      observerRef.current?.observe(el);
    } else {
      const existing = imageRefs.current.get(id);
      if (existing) {
        observerRef.current?.unobserve(existing);
        imageRefs.current.delete(id);
      }
    }
  }, []);

  const openGallery = (index: number) => {
    setSelectedIndex(index);
    const photo = photos[index];
    if (photo) {
      recordView(photo.id).catch(() => {});
    }
  };

  const closeGallery = useCallback(() => {
    setSelectedIndex(null);
    setIsFullscreen(false);
  }, []);

  const goNext = useCallback(() => {
    if (selectedIndex !== null && photos.length > 0) {
      const nextIndex = (selectedIndex + 1) % photos.length;
      setSelectedIndex(nextIndex);
      const photo = photos[nextIndex];
      if (photo) {
        recordView(photo.id).catch(() => {});
      }
    }
  }, [selectedIndex, photos]);

  const goPrev = useCallback(() => {
    if (selectedIndex !== null && photos.length > 0) {
      const prevIndex = (selectedIndex - 1 + photos.length) % photos.length;
      setSelectedIndex(prevIndex);
      const photo = photos[prevIndex];
      if (photo) {
        recordView(photo.id).catch(() => {});
      }
    }
  }, [selectedIndex, photos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      switch (e.key) {
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'Escape':
          closeGallery();
          break;
        case 'f':
        case 'F':
          setIsFullscreen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, goNext, goPrev, closeGallery]);

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;
  const selectedPhotoLicense = selectedPhoto ? photoLicenses.get(selectedPhoto.id) : undefined;
  const hasActiveLicense = selectedPhotoLicense?.some(l => l.status === 'approved' && l.expiresAt && new Date(l.expiresAt) > new Date());

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getLicenseStatus = (photoId: string) => {
    const licenses = photoLicenses.get(photoId);
    if (!licenses || licenses.length === 0) return 'none';
    const approved = licenses.filter(l => l.status === 'approved' && l.expiresAt && new Date(l.expiresAt) > new Date());
    if (approved.length > 0) return 'approved';
    const pending = licenses.filter(l => l.status === 'pending');
    if (pending.length > 0) return 'pending';
    return 'expired';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📷</div>
        <div className="empty-state-text">暂无照片，上传您的第一张作品吧</div>
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            ref={(el) => setImageRef(photo.id, el)}
            data-photo-id={photo.id}
            className="photo-card"
            onClick={() => openGallery(index)}
          >
            {loadedImages.has(photo.id) ? (
              <img
                src={photo.thumbnailMedium}
                alt={photo.filename}
                loading="lazy"
              />
            ) : (
              <div style={{ aspectRatio: '4/3', background: '#e0e0e0' }} />
            )}
            <div className="photo-card-overlay">
              <div className="photo-card-info">
                <div className="photo-card-stats">
                  <span className="photo-card-stat">
                    👁 {photo.viewCount || 0}
                  </span>
                  <span className="photo-card-stat">
                    ⬇ {photo.downloadCount || 0}
                  </span>
                </div>
                {getLicenseStatus(photo.id) !== 'none' && (
                  <span className="license-badge">
                    {getLicenseStatus(photo.id) === 'approved' ? '✓ 已授权' : 
                     getLicenseStatus(photo.id) === 'pending' ? '⏳ 审核中' : '已过期'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </Masonry>

      {selectedPhoto && (
        <div className="modal-gallery" onClick={closeGallery}>
          <button
            className="modal-gallery-close"
            onClick={(e) => {
              e.stopPropagation();
              closeGallery();
            }}
          >
            ×
          </button>

          <button
            className="modal-gallery-nav prev"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            ‹
          </button>

          <button
            className="modal-gallery-nav next"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            ›
          </button>

          <img
            key={selectedPhoto.id}
            src={hasActiveLicense ? selectedPhoto.originalUrl : selectedPhoto.watermarkedUrl}
            alt={selectedPhoto.filename}
            className="modal-gallery-image"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="modal-gallery-info" onClick={(e) => e.stopPropagation()}>
            <div className="modal-gallery-filename">{selectedPhoto.filename}</div>
            <div className="modal-gallery-meta">
              <span>上传于 {formatDate(selectedPhoto.uploadDate)}</span>
              <span>浏览 {selectedPhoto.viewCount || 0} 次</span>
              <span>下载 {selectedPhoto.downloadCount || 0} 次</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? '退出全屏' : '全屏浏览'} (F)
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onPhotoClick(selectedPhoto.id);
                  closeGallery();
                }}
              >
                查看详情 / 申请授权
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectGallery;
