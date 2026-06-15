import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { renderLayoutPreview } from '@/utils/imageProcessor';
import styles from './LayoutPreview.module.css';

export default function LayoutPreviewComponent() {
  const currentPhotoId = useAppStore((s) => s.currentPhotoId);
  const photos = useAppStore((s) => s.photos);
  const layout = useAppStore((s) => s.currentLayout);
  const photo = photos.find((p) => p.id === currentPhotoId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [rendering, setRendering] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  const render = useCallback(async () => {
    if (!photo) return;
    if (pendingRef.current) return;
    pendingRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(async () => {
      try {
        setRendering(true);
        const c = await renderLayoutPreview(photo.originalUrl, layout, 1200);
        setPreviewUrl(c.toDataURL('image/webp', 0.88));
      } finally {
        setRendering(false);
        pendingRef.current = false;
      }
    });
  }, [photo, layout]);

  useEffect(() => {
    void render();
  }, [render]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  if (!photo) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyInner}>
          <div className={styles.emptyArt}>📷</div>
          <h3>请选择一张作品</h3>
          <p>从作品库中选择或上传作品，开始排版设计</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.canvasStage} ref={containerRef}>
      <div className={styles.topBar}>
        <div>
          <h3 className={styles.workTitle}>{photo.title}</h3>
          <div className={styles.workMeta}>
            {photo.originalWidth} × {photo.originalHeight} px · {layout.templateType} · 样式 {layout.subStyle + 1}
          </div>
        </div>
        {rendering && <div className={styles.renderBadge}>渲染中...</div>}
      </div>

      <div className={styles.stageInner}>
        <div className={`${styles.canvasWrap} anim-fade-in-up`} key={previewUrl}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="排版预览"
              className={styles.previewImg}
              draggable={false}
            />
          ) : (
            <div className={`${styles.placeholder} skeleton`} />
          )}
        </div>
      </div>
    </div>
  );
}
