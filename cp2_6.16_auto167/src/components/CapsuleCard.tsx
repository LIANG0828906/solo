import { memo, forwardRef } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Capsule } from '@/types';
import { getStripColor } from '@/utils/colors';

interface CapsuleCardProps {
  capsule: Capsule;
  index: number;
  onClick: () => void;
  onOpen?: () => void;
  hideContentPreview?: boolean;
}

export const CapsuleCard = memo(forwardRef<HTMLDivElement, CapsuleCardProps>(function CapsuleCard(
  { capsule, index, onClick, onOpen, hideContentPreview = false },
  forwardRef
) {
  const countdown = useCountdown(capsule.openDate);
  const { ref, animationStyle } = useScrollAnimation({
    index,
    staggerDelay: 0.08,
    threshold: 0.1,
  });

  const stripColor = getStripColor(capsule.themeColor);
  const isReady = countdown.isExpired;

  return (
    <div
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLElement | null>).current = el;
        if (typeof forwardRef === 'function') forwardRef(el);
      }}
      className="capsule-card"
      style={{
        ...animationStyle,
        ['--card-strip-color' as any]: stripColor,
      }}
      onClick={!isReady ? onClick : undefined}
    >
      <div className="capsule-card-inner">
        <div className="capsule-card-header">
          <div className="capsule-card-title">{capsule.title}</div>
          <div className="capsule-card-locks">
            {capsule.isPrivate && <div className="lock-icon private">🔒</div>}
            {capsule.openedAt && <div className="lock-icon" title="已开启">✓</div>}
          </div>
        </div>

        {!hideContentPreview && !capsule.isPrivate && (
          <div className="capsule-card-body">
            <div className="capsule-card-content-preview">
              {capsule.content || '（无文字内容）'}
            </div>
          </div>
        )}

        {hideContentPreview && !capsule.openedAt && (
          <div className="capsule-card-body">
            <div className="capsule-card-content-preview" style={{ textAlign: 'center', padding: '20px 0' }}>
              🔒 内容已加密
            </div>
          </div>
        )}

        {capsule.openedAt && (
          <div className="capsule-card-body">
            <div className="capsule-card-content-preview" style={{ color: 'var(--success)' }}>
              已开启
            </div>
          </div>
        )}

        <div className="capsule-card-footer">
          <div className="capsule-card-countdown">
            <span className="capsule-card-countdown-label">
              {isReady ? '状态' : '开启倒计时'}
            </span>
            <span className={`capsule-card-countdown-value ${isReady ? 'ready' : ''}`}>
              {countdown.formatted}
            </span>
          </div>
          {capsule.attachmentIds.length > 0 && (
            <div className="capsule-card-meta">
              <div className="capsule-card-attach-count">
                📷 {capsule.attachmentIds.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {isReady && !capsule.openedAt && (
        <button
          className="open-button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
          }}
        >
          ✨ 开启胶囊
        </button>
      )}
    </div>
  );
}));
