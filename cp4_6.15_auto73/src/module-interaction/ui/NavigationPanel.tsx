import { useState, useEffect, useMemo } from 'react';
import { Menu, X } from 'lucide-react';
import { useGalleryStore } from '@/store/useGalleryStore';

export default function NavigationPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const { artworks, isNavigationOpen, setNavigationOpen, setSelectedArtwork } =
    useGalleryStore();

  useEffect(() => {
    if (isNavigationOpen) {
      setIsVisible(true);
    }
  }, [isNavigationOpen]);

  const handleOpen = () => {
    setNavigationOpen(true);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setNavigationOpen(false);
    }, 300);
  };

  const handleThumbnailClick = (artworkId: string) => {
    setSelectedArtwork(artworkId);
    handleClose();
  };

  const thumbnailGradients = useMemo(() => {
    return artworks.map((artwork) => {
      const colors = artwork.colorPalette;
      const gradient = `linear-gradient(135deg, ${colors.join(', ')})`;
      return { id: artwork.id, gradient, name: artwork.name };
    });
  }, [artworks]);

  return (
    <>
      <button
        type="button"
        className="nav-menu-button"
        onClick={handleOpen}
        aria-label="打开导航目录"
      >
        <Menu size={24} />
      </button>

      <div
        className={`nav-panel-overlay ${isVisible ? 'visible' : ''}`}
        onClick={handleClose}
      />

      <div className={`nav-panel ${isVisible ? 'visible' : ''}`}>
        <div className="nav-panel-header">
          <h2 className="nav-panel-title">画廊目录</h2>
          <button
            type="button"
            className="nav-panel-close"
            onClick={handleClose}
            aria-label="关闭导航"
          >
            <X size={24} />
          </button>
        </div>

        <div className="nav-panel-content">
          <div className="thumbnail-grid">
            {thumbnailGradients.map((item) => (
              <button
                key={item.id}
                type="button"
                className="thumbnail-item"
                onClick={() => handleThumbnailClick(item.id)}
              >
                <div
                  className="thumbnail-image"
                  style={{ background: item.gradient }}
                />
                <span className="thumbnail-name">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        <style>{`
          .nav-menu-button {
            position: fixed;
            top: 24px;
            left: 24px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(15, 15, 35, 0.6);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 30;
            transition: all 0.3s ease-in-out;
            font-family: 'Orbitron', sans-serif;
          }

          .nav-menu-button:hover {
            background: rgba(139, 92, 246, 0.3);
            border-color: rgba(139, 92, 246, 0.5);
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
            transform: scale(1.05);
          }

          .nav-panel-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease-in-out;
            z-index: 40;
          }

          .nav-panel-overlay.visible {
            opacity: 1;
            pointer-events: auto;
          }

          .nav-panel {
            position: fixed;
            inset: 0;
            background: linear-gradient(
              135deg,
              rgba(30, 20, 60, 0.4),
              rgba(10, 15, 35, 0.4),
              rgba(20, 30, 60, 0.4)
            );
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            z-index: 50;
            display: flex;
            flex-direction: column;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease-in-out;
            font-family: 'Orbitron', sans-serif;
            color: #ffffff;
          }

          .nav-panel.visible {
            opacity: 1;
            pointer-events: auto;
          }

          .nav-panel-header {
            padding: 24px 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            flex-shrink: 0;
          }

          .nav-panel-title {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 2px;
            margin: 0;
            background: linear-gradient(135deg, #a78bfa, #22d3ee);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .nav-panel-close {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.3s ease-in-out;
          }

          .nav-panel-close:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            transform: rotate(90deg);
          }

          .nav-panel-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            overflow-y: auto;
          }

          .thumbnail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 24px;
            max-width: 900px;
            width: 100%;
          }

          .thumbnail-item {
            position: relative;
            width: 120px;
            height: 120px;
            border: none;
            padding: 0;
            background: transparent;
            cursor: pointer;
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.3s ease-in-out;
            justify-self: center;
          }

          .thumbnail-item:hover {
            transform: scale(1.2);
            z-index: 10;
          }

          .thumbnail-image {
            width: 100%;
            height: 100%;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            transition: box-shadow 0.3s ease-in-out;
          }

          .thumbnail-item:hover .thumbnail-image {
            box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5);
          }

          .thumbnail-name {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 8px 12px;
            background: linear-gradient(
              to top,
              rgba(0, 0, 0, 0.8),
              transparent
            );
            color: #ffffff;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease-in-out;
            letter-spacing: 0.5px;
          }

          .thumbnail-item:hover .thumbnail-name {
            opacity: 1;
            transform: translateY(0);
          }

          @media (max-width: 768px) {
            .nav-menu-button {
              top: 16px;
              left: 16px;
              width: 44px;
              height: 44px;
            }

            .nav-menu-button svg {
              width: 20px;
              height: 20px;
            }

            .nav-panel-header {
              padding: 16px 20px;
            }

            .nav-panel-title {
              font-size: 18px;
            }

            .nav-panel-content {
              padding: 20px;
              align-items: flex-end;
              padding-bottom: 40px;
            }

            .thumbnail-grid {
              grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
              gap: 16px;
              max-width: 100%;
            }

            .thumbnail-item {
              width: 100px;
              height: 100px;
            }

            .thumbnail-name {
              font-size: 11px;
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
}
