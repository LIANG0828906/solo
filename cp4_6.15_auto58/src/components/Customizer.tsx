import React, { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Theme, ThemeTile } from '@/data/themes';
import { PRESET_THEMES, MAX_CUSTOM_IMAGES, MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '@/data/themes';
import './Customizer.css';

interface CustomizerProps {
  isOpen: boolean;
  currentThemeId: string;
  customTiles: ThemeTile[];
  onClose: () => void;
  onSelectPreset: (theme: Theme) => void;
  onUpdateCustomTiles: (tiles: ThemeTile[]) => void;
}

const Customizer: React.FC<CustomizerProps> = ({
  isOpen,
  currentThemeId,
  customTiles,
  onClose,
  onSelectPreset,
  onUpdateCustomTiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const processImage = useCallback((file: File): Promise<ThemeTile | null> => {
    return new Promise((resolve) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setUploadError('不支持的图片格式，请上传 jpg、png 或 webp 格式的图片');
        resolve(null);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setUploadError(`图片大小不能超过 ${MAX_IMAGE_SIZE_MB}MB`);
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 200;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const scale = Math.max(size / img.width, size / img.height);
            const x = (size - img.width * scale) / 2;
            const y = (size - img.height * scale) / 2;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            const thumbnailUrl = canvas.toDataURL('image/webp', 0.8);

            resolve({
              id: uuidv4(),
              name: file.name.replace(/\.[^/.]+$/, ''),
              color: '#6B7280',
              imageUrl: thumbnailUrl,
            });
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          setUploadError('图片加载失败');
          resolve(null);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setUploadError('文件读取失败');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploadError('');
      const remainingSlots = MAX_CUSTOM_IMAGES - customTiles.length;

      if (files.length > remainingSlots) {
        setUploadError(`最多还能上传 ${remainingSlots} 张图片`);
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const newTiles: ThemeTile[] = [];

      for (const file of filesToProcess) {
        const tile = await processImage(file);
        if (tile) {
          newTiles.push(tile);
        }
      }

      if (newTiles.length > 0) {
        onUpdateCustomTiles([...customTiles, ...newTiles]);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [customTiles, processImage, onUpdateCustomTiles]
  );

  const handleRemoveTile = useCallback(
    (tileId: string) => {
      onUpdateCustomTiles(customTiles.filter((t) => t.id !== tileId));
    },
    [customTiles, onUpdateCustomTiles]
  );

  const handleUploadClick = useCallback(() => {
    if (customTiles.length >= MAX_CUSTOM_IMAGES) {
      setUploadError(`最多只能上传 ${MAX_CUSTOM_IMAGES} 张图片`);
      return;
    }
    setUploadError('');
    fileInputRef.current?.click();
  }, [customTiles.length]);

  return (
    <>
      <div className={`customizer-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <div className={`customizer-drawer ${isOpen ? 'open' : ''}`}>
        <div className="customizer-header">
          <h2>主题定制</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="customizer-content">
          <section className="theme-section">
            <h3>预设主题</h3>
            <div className="preset-themes">
              {PRESET_THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className={`theme-card ${currentThemeId === theme.id ? 'active' : ''}`}
                  onClick={() => onSelectPreset(theme)}
                >
                  <div
                    className="theme-preview"
                    style={{ background: `linear-gradient(135deg, ${theme.accentColor}40, ${theme.tiles[0].color}20)` }}
                  >
                    <div className="theme-tiles-preview">
                      {theme.tiles.slice(0, 4).map((tile) => (
                        <div
                          key={tile.id}
                          className="mini-tile"
                          style={{ backgroundColor: tile.color + '60' }}
                        >
                          {tile.emoji}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="theme-info">
                    <span className="theme-name">{theme.name}</span>
                    <span className="theme-desc">{theme.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="theme-section">
            <h3>
              我的图片
              <span className="tile-count">
                ({customTiles.length}/{MAX_CUSTOM_IMAGES})
              </span>
            </h3>

            <div className="custom-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                onChange={handleFileUpload}
                className="file-input"
              />

              <div className="upload-grid">
                {customTiles.map((tile) => (
                  <div key={tile.id} className="uploaded-tile">
                    <img src={tile.imageUrl} alt={tile.name} className="uploaded-image" />
                    <button
                      className="remove-tile-btn"
                      onClick={() => handleRemoveTile(tile.id)}
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {customTiles.length < MAX_CUSTOM_IMAGES && (
                  <div className="upload-placeholder" onClick={handleUploadClick}>
                    <span className="upload-icon">+</span>
                    <span className="upload-text">上传图片</span>
                  </div>
                )}
              </div>

              {uploadError && <div className="upload-error">{uploadError}</div>}

              <div className="upload-tips">
                <p>💡 支持 jpg、png、webp 格式，单张不超过 3MB</p>
                <p>💡 上传后将自动裁剪为正方形缩略图</p>
              </div>
            </div>

            {customTiles.length >= 3 && (
              <button
                className="use-custom-btn"
                onClick={() => {
                  const customTheme: Theme = {
                    id: 'custom',
                    name: '我的主题',
                    description: '自定义图片主题',
                    tiles: customTiles,
                    accentColor: '#6B7280',
                  };
                  onSelectPreset(customTheme);
                }}
              >
                使用自定义主题
              </button>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default Customizer;
