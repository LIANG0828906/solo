import { useState, useEffect, useRef, useCallback } from 'react';
import { usePhotoStore, preloadDefaultThumbnails } from './data/photoStore';
import { PageFlipEngine } from './animation/pageFlipEngine';
import AlbumCover from './components/AlbumCover';
import AlbumPage from './components/AlbumPage';
import type { Photo, FlipDirection, FlipTransform } from './types';

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg className="favorites-icon" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ChevronNavIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {direction === 'left' ? (
      <polyline points="15 18 9 12 15 6" />
    ) : (
      <polyline points="9 18 15 12 9 6" />
    )}
  </svg>
);

const UploadIcon = () => (
  <svg className="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

interface ParticleData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  isStar: boolean;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

const MAX_PARTICLE_INSTANCES = 3;
const PARTICLE_POOL: { particles: ParticleData[]; timeout: number | null }[] = [];

function App() {
  const {
    photos,
    currentPage,
    favoriteCount,
    isFlipping,
    isCoverOpen,
    addPhoto,
    toggleFavorite,
    goToNextPage,
    goToPrevPage,
    openCover
  } = usePhotoStore();

  const [isCoverOpening, setIsCoverOpening] = useState(false);
  const [favoritesDragOver, setFavoritesDragOver] = useState(false);
  const [draggingPhoto, setDraggingPhoto] = useState<Photo | null>(null);
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const [newPhotoIds, setNewPhotoIds] = useState<Set<string>>(new Set());
  const [flyingPhoto, setFlyingPhoto] = useState<{
    photo: Photo;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    id: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [flipAnimation, setFlipAnimation] = useState<{
    direction: FlipDirection;
    frontTransform: FlipTransform;
    backTransform: FlipTransform;
    progress: number;
  } | null>(null);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const flipEngineRef = useRef<PageFlipEngine | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const favoritesBtnRef = useRef<HTMLButtonElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const particleInstanceCount = useRef(0);
  const flyIdRef = useRef(0);

  useEffect(() => {
    preloadDefaultThumbnails();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    flipEngineRef.current = new PageFlipEngine({
      duration: 400,
      pageWidth: 420,
      pageHeight: 600
    });
    return () => {
      flipEngineRef.current?.cancel();
    };
  }, []);



  const handleOpenCover = useCallback(() => {
    if (isCoverOpen) return;
    setIsCoverOpening(true);
    setTimeout(() => {
      openCover();
      setIsCoverOpening(false);
    }, 900);
  }, [isCoverOpen, openCover]);

  const triggerFlip = useCallback(
    (direction: FlipDirection) => {
      if (isFlipping || isMobile) return;
      if (direction === 'next' && currentPage >= photos.length - 2 && photos.length % 2 === 0) return;
      if (direction === 'next' && currentPage >= photos.length - 1) return;
      if (direction === 'prev' && currentPage <= 0) return;

      const engine = flipEngineRef.current;
      if (!engine) return;

      if (direction === 'next') {
        goToNextPage();
      } else {
        goToPrevPage();
      }

      engine.startFlip(direction, (front, back, progress) => {
        setFlipAnimation({ direction, frontTransform: front, backTransform: back, progress });
        if (progress >= 1) {
          setTimeout(() => setFlipAnimation(null), 50);
        }
      });
    },
    [isFlipping, isMobile, currentPage, photos.length, goToNextPage, goToPrevPage]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCoverOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          handleOpenCover();
        }
        return;
      }
      if (e.key === 'ArrowRight') triggerFlip('next');
      if (e.key === 'ArrowLeft') triggerFlip('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCoverOpen, handleOpenCover, triggerFlip]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !isCoverOpen) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0) triggerFlip('next');
        else triggerFlip('prev');
      }
    },
    [isMobile, isCoverOpen, triggerFlip]
  );

  const spawnParticles = useCallback((x: number, y: number) => {
    if (particleInstanceCount.current >= MAX_PARTICLE_INSTANCES) return;
    particleInstanceCount.current++;

    const particleCount = 30;
    const particles: ParticleData[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 60 + Math.random() * 80;
      particles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: 6 + Math.random() * 8,
        isStar: i % 3 === 0,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 720,
        life: 1
      });
    }

    const poolEntry = { particles, timeout: null };
    PARTICLE_POOL.push(poolEntry);

    const container = particleContainerRef.current;
    if (!container) return;

    const startTime = performance.now();
    const duration = 600;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);

      particles.forEach((p) => {
        p.x = p.vx * t;
        p.y = p.vy * t + 0.5 * 200 * t * t;
        p.rotation += p.rotationSpeed * (1 / 60);
        p.life = 1 - t * t;
      });

      const existingEls = container.querySelectorAll(`[data-instance="${poolEntry}"]`);
      existingEls.forEach((el) => el.remove());

      particles.forEach((p, i) => {
        if (p.life <= 0) return;
        const el = document.createElement('div');
        el.className = `particle ${p.isStar ? 'star' : ''}`;
        el.style.left = `${x + p.x}px`;
        el.style.top = `${y + p.y}px`;
        el.style.width = `${p.size}px`;
        el.style.height = `${p.size}px`;
        el.style.opacity = String(p.life);
        el.style.transform = `rotate(${p.rotation}deg) scale(${0.5 + p.life * 0.5})`;
        el.dataset.instance = String(i);
        container.appendChild(el);
      });

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          const finalEls = container.querySelectorAll('[class*="particle"]');
          finalEls.forEach((el) => {
            if (el.parentElement === container) el.remove();
          });
          particleInstanceCount.current = Math.max(0, particleInstanceCount.current - 1);
          const idx = PARTICLE_POOL.indexOf(poolEntry);
          if (idx > -1) PARTICLE_POOL.splice(idx, 1);
        }, 50);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const handlePhotoDragStart = useCallback((photo: Photo, e: React.DragEvent) => {
    setDraggingPhoto(photo);
    try {
      e.dataTransfer.setData('text/plain', photo.id);
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      /* ignore */
    }
  }, []);

  const handlePhotoDragEnd = useCallback(() => {
    setDraggingPhoto(null);
    setFavoritesDragOver(false);
  }, []);

  const handleFavoritesDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setFavoritesDragOver(true);
  }, []);

  const handleFavoritesDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleFavoritesDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setFavoritesDragOver(false);
  }, []);

  const handleFavoritesDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setFavoritesDragOver(false);
      if (!draggingPhoto) return;

      const photo = draggingPhoto;
      if (photo.isFavorite) {
        setDraggingPhoto(null);
        return;
      }

      const btnRect = favoritesBtnRef.current?.getBoundingClientRect();
      const targetX = btnRect ? btnRect.left + btnRect.width / 2 : 60;
      const targetY = btnRect ? btnRect.top + btnRect.height / 2 : 50;

      const dragImg = (e.dataTransfer as unknown as { mozSourceNode?: HTMLElement }).mozSourceNode || e.currentTarget;
      let startX = 0,
        startY = 0;
      if (dragImg instanceof HTMLElement) {
        const r = dragImg.getBoundingClientRect();
        startX = r.left + r.width / 2;
        startY = r.top + r.height / 2;
      } else {
        startX = e.clientX;
        startY = e.clientY;
      }

      const flyId = ++flyIdRef.current;
      setFlyingPhoto({
        photo,
        startX,
        startY,
        endX: targetX,
        endY: targetY,
        id: flyId
      });

      setTimeout(() => {
        toggleFavorite(photo.id);
        spawnParticles(targetX, targetY);
        setFlyingPhoto(null);
        setDraggingPhoto(null);
      }, 500);
    },
    [draggingPhoto, toggleFavorite, spawnParticles]
  );

  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsFileDragOver(false);

      const files = Array.from(e.dataTransfer.files || []).filter((f) =>
        /^image\/(jpeg|png|jpg)$/i.test(f.type)
      );
      if (files.length === 0) return;

      for (const file of files) {
        try {
          const url = await readFileAsDataURL(file);
          const id = Math.random().toString(36).slice(2, 10);
          addPhoto({
            url,
            takenAt: new Date().toISOString().split('T')[0],
            location: '',
            note: ''
          });
          setNewPhotoIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
          setTimeout(() => {
            setNewPhotoIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, 3000);
        } catch (err) {
          console.error('Failed to read image file:', err);
        }
      }
    },
    [addPhoto]
  );

  const handleWindowDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
    if (hasFiles) setIsFileDragOver(true);
  }, []);

  const handleWindowDragLeave = useCallback((e: DragEvent) => {
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsFileDragOver(false);
    }
  }, []);

  const handleWindowDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsFileDragOver(false);
  }, []);

  useEffect(() => {
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [handleWindowDragOver, handleWindowDragLeave, handleWindowDrop]);

  const flyingPhotoStyle = flyingPhoto
    ? {
        left: `${flyingPhoto.startX - 50}px`,
        top: `${flyingPhoto.startY - 37.5}px`,
        width: '100px',
        height: '75px',
        transition: 'all 0.5s cubic-bezier(0.55, 0, 0.68, 0.53)',
        transform: `translate(${flyingPhoto.endX - flyingPhoto.startX}px, ${flyingPhoto.endY - flyingPhoto.startY}px) scale(0.1) rotate(360deg)`,
        opacity: 0.1
      }
    : undefined;

  const canGoPrev = currentPage > 0 && isCoverOpen;
  const canGoNext = isCoverOpen && (isMobile ? currentPage < photos.length - 1 : currentPage < photos.length - 2 || (photos.length % 2 === 1 && currentPage === photos.length - 2));

  return (
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <button
        ref={favoritesBtnRef}
        className={`favorites-btn ${favoriteCount > 0 ? 'has-favorites' : ''} ${favoritesDragOver ? 'drag-over' : ''}`}
        onDragEnter={handleFavoritesDragEnter}
        onDragOver={handleFavoritesDragOver}
        onDragLeave={handleFavoritesDragLeave}
        onDrop={handleFavoritesDrop}
        aria-label={`收藏夹，已收藏 ${favoriteCount} 张照片`}
      >
        <HeartIcon filled={favoriteCount > 0} />
        <span className="favorites-count">{favoriteCount}</span>
      </button>

      <div ref={wrapperRef} className="album-wrapper">
        <button
          className={`nav-button prev`}
          onClick={() => triggerFlip('prev')}
          disabled={!canGoPrev || isFlipping}
          aria-label="上一页"
          style={{ display: isMobile ? 'none' : undefined }}
        >
          <ChevronNavIcon direction="left" />
        </button>

        {!isCoverOpen ? (
          <AlbumCover
            photoCount={photos.length}
            favoriteCount={favoriteCount}
            isOpening={isCoverOpening}
            onOpen={handleOpenCover}
          />
        ) : isMobile ? (
          <div className="album-spread" style={{ flexDirection: 'column' }}>
            {photos.map((photo, idx) => (
              <AlbumPage
                key={photo.id}
                photo={photo}
                side="right"
                pageNumber={idx + 1}
                isNew={newPhotoIds.has(photo.id)}
                onDragStart={handlePhotoDragStart}
                onDragEnd={handlePhotoDragEnd}
                showFlipHotspots={false}
              />
            ))}
          </div>
        ) : (
          <div className="album-spread">
            {photos.map((_p, idx) => {
              if (idx !== currentPage && idx !== currentPage + 1) return null;
              const photo = photos[idx];
              if (!photo) return null;
              const side: 'left' | 'right' = idx === currentPage ? 'left' : 'right';
              const isFlippingFront =
                flipAnimation &&
                ((flipAnimation.direction === 'next' && side === 'right') ||
                  (flipAnimation.direction === 'prev' && side === 'left'));
              const isFlippingBack =
                flipAnimation &&
                ((flipAnimation.direction === 'next' && side === 'left') ||
                  (flipAnimation.direction === 'prev' && side === 'right'));

              let flipStyle: React.CSSProperties | undefined;
              if (isFlippingFront) {
                const t = flipAnimation.frontTransform;
                flipStyle = {
                  transform: t.transform,
                  boxShadow: t.boxShadow,
                  opacity: t.opacity,
                  zIndex: t.zIndex,
                  filter: t.filter,
                  transformOrigin: side === 'right' ? '0% 50%' : '100% 50%'
                };
              } else if (isFlippingBack) {
                const t = flipAnimation.backTransform;
                flipStyle = {
                  transform: t.transform,
                  boxShadow: t.boxShadow,
                  opacity: t.opacity,
                  zIndex: t.zIndex,
                  filter: t.filter,
                  transformOrigin: side === 'right' ? '0% 50%' : '100% 50%'
                };
              }

              return (
                <AlbumPage
                  key={photo.id}
                  photo={photo}
                  side={side}
                  pageNumber={idx + 1}
                  isNew={newPhotoIds.has(photo.id)}
                  onDragStart={handlePhotoDragStart}
                  onDragEnd={handlePhotoDragEnd}
                  onFlip={triggerFlip}
                  flipStyle={flipStyle}
                />
              );
            })}
          </div>
        )}

        <button
          className={`nav-button next`}
          onClick={() => triggerFlip('next')}
          disabled={!canGoNext || isFlipping}
          aria-label="下一页"
          style={{ display: isMobile ? 'none' : undefined }}
        >
          <ChevronNavIcon direction="right" />
        </button>
      </div>

      {isCoverOpen && photos.length > 0 && (
        <div className="page-indicator">
          <span className="page-indicator-current">{isMobile ? currentPage + 1 : Math.min(currentPage + 1, photos.length)}</span>
          <span className="page-indicator-total">/ {photos.length}</span>
        </div>
      )}

      <div ref={particleContainerRef} className="particle-container" />

      {flyingPhoto && (
        <div className="flying-photo" style={flyingPhotoStyle} key={flyingPhoto.id}>
          <img src={flyingPhoto.photo.url} alt="" draggable={false} />
        </div>
      )}

      {isFileDragOver && (
        <div
          className="drop-zone-overlay"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          <UploadIcon />
          <div className="drop-zone-text">释放添加照片</div>
          <div className="drop-zone-hint">支持 JPG、PNG 格式</div>
        </div>
      )}
    </div>
  );
}

export default App;
