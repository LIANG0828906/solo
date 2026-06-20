import React, { memo } from 'react';
import type { ImageItem } from '../../types';
import styles from './ImagePreview.module.css';

interface ImagePreviewProps {
  image: ImageItem | null;
  onExport: () => void;
  isExporting: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onExport, isExporting }) => {
  if (!image) {
    return (
      <div className={styles.preview}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👈</div>
          <div className={styles.emptyText}>点击左侧图片查看详情和配色方案</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.preview}>
      <div className={styles.header}>
        <h3 className={styles.title}>图片详情</h3>
        <button
          className={styles.exportBtn}
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <span className={styles.spinner} />
          ) : (
            <span>⬇️</span>
          )}
          {isExporting ? '导出中...' : '导出配色'}
        </button>
      </div>

      <div className={styles.imageContainer}>
        <img
          src={image.url}
          alt={image.name}
          className={styles.image}
        />
      </div>

      <div className={styles.info}>
        <div className={styles.imageName} title={image.name}>{image.name}</div>
        <div className={styles.imageMeta}>
          {image.width} × {image.height} px · {image.colors.length} 个主色调
        </div>
      </div>

      <div className={styles.colorsSection}>
        <div className={styles.colorsTitle}>主色调分析</div>
        <div className={styles.colorList}>
          {image.colors.map((color, idx) => (
            <div key={idx} className={styles.colorItem}>
              <div
                className={styles.colorSwatch}
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              />
              <div className={styles.colorInfo}>
                <div className={styles.colorHex}>{color.hex}</div>
                <div className={styles.colorRgb}>
                  RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                </div>
              </div>
              <div className={styles.colorRatio}>{color.ratio}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(ImagePreview);
