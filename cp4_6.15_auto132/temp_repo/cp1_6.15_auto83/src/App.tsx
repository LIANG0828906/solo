import { useState, useMemo, useCallback } from 'react';
import { PhotoData, generateMockPhotos } from './utils/photoData';
import Gallery from './components/Gallery';
import FullscreenView from './components/FullscreenView';
import CompareMode from './components/CompareMode';

export default function App() {
  const [photos] = useState<PhotoData[]>(() => generateMockPhotos(60));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<PhotoData | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(t => t !== tagId);
      }
      return [...prev, tagId];
    });
  }, []);

  const handlePhotoClick = useCallback((photo: PhotoData, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSelectedPhotoIds(prev => {
        if (prev.includes(photo.id)) {
          return prev.filter(id => id !== photo.id);
        }
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, photo.id];
      });
    } else {
      if (selectedPhotoIds.length > 0) {
        setSelectedPhotoIds([]);
      } else {
        setFullscreenPhoto(photo);
      }
    }
  }, [selectedPhotoIds.length]);

  const handleEnterCompare = useCallback(() => {
    if (selectedPhotoIds.length >= 2 && selectedPhotoIds.length <= 4) {
      setCompareMode(true);
    }
  }, [selectedPhotoIds.length]);

  const handleCloseCompare = useCallback(() => {
    setCompareMode(false);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenPhoto(null);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setSelectedPhotoIds([]);
  }, []);

  const comparePhotos = useMemo(() => {
    return photos.filter(p => selectedPhotoIds.includes(p.id));
  }, [photos, selectedPhotoIds]);

  const compareModeAvailable = selectedPhotoIds.length >= 2 && selectedPhotoIds.length <= 4;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">摄影记忆画廊</h1>
        <p className="app-subtitle">探索光影 · 记录灵感 · 学习构图</p>
      </header>

      <Gallery
        photos={photos}
        selectedPhotoIds={selectedPhotoIds}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        onPhotoClick={handlePhotoClick}
        onEnterCompare={handleEnterCompare}
        onCancelSelection={handleCancelSelection}
        compareModeAvailable={compareModeAvailable}
      />

      {fullscreenPhoto && (
        <FullscreenView
          photo={fullscreenPhoto}
          onClose={handleCloseFullscreen}
        />
      )}

      {compareMode && comparePhotos.length >= 2 && (
        <CompareMode
          photos={comparePhotos}
          onClose={handleCloseCompare}
        />
      )}

      {selectedPhotoIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#a0a0a0',
            zIndex: 50,
          }}
        >
          按住 <strong style={{ color: '#e0e0e0' }}>Ctrl/Command</strong> 点击选择多张照片进行比较
          {selectedPhotoIds.length > 0 && (
            <button
              onClick={handleCancelSelection}
              style={{
                marginLeft: '16px',
                background: 'transparent',
                border: '1px solid #666',
                color: '#a0a0a0',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              取消选择
            </button>
          )}
        </div>
      )}
    </div>
  );
}
