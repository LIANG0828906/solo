import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Capsule } from '@/types';
import { useCapsuleStore } from '@/store/capsuleStore';
import { getStripColor } from '@/utils/colors';
import { MarkdownRenderer } from './MarkdownRenderer';

interface CapsuleModalProps {
  capsule: Capsule;
  onClose: () => void;
  onTriggerParticles: () => void;
  alreadyOpened: boolean;
}

export function CapsuleModal({ capsule, onClose, onTriggerParticles, alreadyOpened }: CapsuleModalProps) {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);

  const getCapsuleAttachments = useCapsuleStore((s) => s.getCapsuleAttachments);
  const markAsOpened = useCapsuleStore((s) => s.markAsOpened);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      if (capsule.attachmentIds.length > 0) {
        const urls = await getCapsuleAttachments(capsule.id);
        if (!cancelled) {
          setAttachments(urls);
          setLoading(false);
        }
      } else {
        if (!cancelled) setLoading(false);
      }

      if (!alreadyOpened) {
        await markAsOpened(capsule.id);
        onTriggerParticles();
      }
    })();

    return () => { cancelled = true; };
  }, [capsule.id, capsule.attachmentIds.length, getCapsuleAttachments, markAsOpened, alreadyOpened, onTriggerParticles]);

  const stripColor = getStripColor(capsule.themeColor);

  const prevImage = () => {
    setCurrentImage((i) => (i - 1 + attachments.length) % attachments.length);
  };

  const nextImage = () => {
    setCurrentImage((i) => (i + 1) % attachments.length);
  };

  const openedDate = capsule.openedAt
    ? format(new Date(capsule.openedAt), 'yyyy年M月d日 HH:mm', { locale: zhCN })
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="capsule-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="关闭">
          ×
        </button>

        <div className="capsule-modal-header" style={{ ['--modal-strip-color' as any]: stripColor }}>
          <div className="capsule-modal-title">{capsule.title}</div>
          <div className="capsule-modal-date">
            开启日期：{format(new Date(capsule.openDate), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
            {openedDate && ` · 已于 ${openedDate} 开启`}
          </div>
        </div>

        <div className="capsule-modal-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="loading-spinner" style={{ marginRight: 12 }} />
              加载中...
            </div>
          ) : (
            <>
              {attachments.length > 0 && (
                <div className="image-gallery">
                  <div className="gallery-main">
                    <img src={attachments[currentImage]} alt={`附件 ${currentImage + 1}`} />
                    {attachments.length > 1 && (
                      <>
                        <button className="gallery-nav prev" onClick={prevImage} aria-label="上一张">
                          ‹
                        </button>
                        <button className="gallery-nav next" onClick={nextImage} aria-label="下一张">
                          ›
                        </button>
                      </>
                    )}
                  </div>
                  {attachments.length > 1 && (
                    <div className="gallery-dots">
                      {attachments.map((_, i) => (
                        <div
                          key={i}
                          className={`gallery-dot ${i === currentImage ? 'active' : ''}`}
                          onClick={() => setCurrentImage(i)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {capsule.content && <MarkdownRenderer content={capsule.content} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
