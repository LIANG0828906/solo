import { useCallback, useEffect, useRef, useState } from 'react';
import { useSoundStore, getNickname, setNickname } from '@/store/useSoundStore';
import { CATEGORY_COLORS, CATEGORY_LABEL } from '@/engine/SoundBlock';
import type { SoundBlock } from '@/engine/SoundBlock';
import { audioManager } from '@/engine/AudioManager';

const LEVEL_BARS = 14;

export function SoundPanel(): JSX.Element {
  const {
    blocks,
    reorderBlocks,
    toggleMute,
    setVolume,
    totalVolume,
    setTotalVolume,
    saveScape,
    shareLink,
    clearShareLink,
  } = useSoundStore();

  const [activeVolumeFor, setActiveVolumeFor] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [showNick, setShowNick] = useState(false);
  const [nickInput, setNickInput] = useState('');

  const dragRef = useRef<{ id: string; startedAt: number; pointerId: number | null; longPressed: boolean } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressTargetId = useRef<string | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setLevel(audioManager.getAverageLevel());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (shareLink) {
      const t = window.setTimeout(() => clearShareLink(), 4000);
      return () => window.clearTimeout(t);
    }
    return;
  }, [shareLink, clearShareLink]);

  const startLongPress = (id: string) => {
    cancelLongPress();
    longPressTargetId.current = id;
    longPressTimer.current = window.setTimeout(() => {
      setActiveVolumeFor((cur) => (cur === id ? null : id));
      longPressTargetId.current = null;
    }, 1000);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressTargetId.current = null;
  };

  const handleBlockPointerDown = (e: React.PointerEvent<HTMLDivElement>, block: SoundBlock) => {
    startLongPress(block.id);
    dragRef.current = { id: block.id, startedAt: Date.now(), pointerId: e.pointerId, longPressed: false };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleBlockPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = Math.abs(e.movementX);
    const dy = Math.abs(e.movementY);
    if (!dragRef.current.longPressed && (dx > 4 || dy > 4)) {
      if (longPressTargetId.current === dragRef.current.id) {
        cancelLongPress();
        dragRef.current.longPressed = true;
      }
    }

    if (activeVolumeFor && dragRef.current.id === activeVolumeFor) {
      const curBlock = blocks.find((b) => b.id === activeVolumeFor);
      if (curBlock) {
        const next = Math.max(0, Math.min(100, curBlock.volume - e.movementY * 0.8));
        setVolume(activeVolumeFor, next);
      }
    }
  };

  const handleBlockPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelLongPress();
    const info = dragRef.current;
    if (!info) return;

    if (info.longPressed) {
      const container = (e.currentTarget as HTMLDivElement).parentElement;
      if (container) {
        const children = Array.from(container.querySelectorAll<HTMLDivElement>('.sound-block'));
        const my = children.find((c) => c.dataset.id === info.id);
        if (my) {
          const myRect = my.getBoundingClientRect();
          let targetIdx = children.indexOf(my);
          for (let i = 0; i < children.length; i++) {
            const c = children[i];
            const r = c.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && Math.abs(r.top - myRect.top) < r.height) {
              targetIdx = i;
              break;
            }
          }
          if (targetIdx !== -1 && children[targetIdx].dataset.id !== info.id) {
            const orderedIds = children.map((c) => c.dataset.id!).filter((id) => !!id);
            const from = orderedIds.indexOf(info.id);
            if (from !== -1) {
              orderedIds.splice(from, 1);
              orderedIds.splice(targetIdx, 0, info.id);
              reorderBlocks(orderedIds);
            }
          }
        }
      }
    }

    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    dragRef.current = null;
  };

  const knobRef = useRef<HTMLDivElement | null>(null);

  const handleKnobPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    knobRef.current = e.currentTarget as HTMLDivElement;
  };

  const handleKnobPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!knobRef.current || e.pointerId !== (knobRef.current as unknown as { pointerId?: number }).pointerId) return;
    const next = Math.max(0, Math.min(100, totalVolume - e.movementY * 0.8));
    setTotalVolume(next);
  };

  const handleKnobPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    knobRef.current = null;
  };

  const onSave = useCallback(() => {
    void audioManager.resumeContext();
    const nick = getNickname();
    if (!nick) {
      setShowNick(true);
      return;
    }
    saveScape(nick);
  }, [saveScape]);

  const confirmNick = () => {
    const name = nickInput.trim();
    if (!name) return;
    setNickname(name);
    setShowNick(false);
    saveScape(name);
    setNickInput('');
  };

  const activeBlock = blocks.find((b) => b.id === activeVolumeFor);
  const knobAngle = -135 + (totalVolume / 100) * 270;
  const displayLevel = Math.max(totalVolume / 100, level);

  return (
    <div className="sound-panel">
      <div className="level-meter" aria-label="总音量电平">
        {Array.from({ length: LEVEL_BARS }).map((_, i) => {
          const threshold = (i + 1) / LEVEL_BARS;
          const on = displayLevel >= threshold;
          return <div key={i} className={`level-bar ${on ? 'on' : ''}`} />;
        })}
      </div>

      <div className="blocks-scroll">
        {blocks.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingLeft: 8 }}>
            点击场景中的光点添加音效（最多 6 轨）
          </div>
        )}
        {blocks.map((b) => (
          <div
            key={b.id}
            data-id={b.id}
            className={`sound-block ${b.isOverlay ? 'overlay' : ''} ${dragRef.current?.id === b.id && dragRef.current.longPressed ? 'dragging' : ''}`}
            style={{ background: CATEGORY_COLORS[b.category] }}
            onPointerDown={(e) => handleBlockPointerDown(e, b)}
            onPointerMove={handleBlockPointerMove}
            onPointerUp={handleBlockPointerUp}
            onPointerCancel={handleBlockPointerUp}
            onDoubleClick={() => setActiveVolumeFor((cur) => (cur === b.id ? null : b.id))}
          >
            <div className="sound-block-name">
              {b.name}
              {activeVolumeFor === b.id && (
                <span style={{ marginLeft: 6, opacity: 0.9, fontSize: 11 }}>
                  {Math.round(b.volume)}
                </span>
              )}
            </div>
            <div className="sound-block-meta">
              <span>{CATEGORY_LABEL[b.category]}</span>
              <button
                type="button"
                className="sound-block-mute"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute(b.id);
                }}
              >
                {b.muted ? '🔇' : '🔊'}
              </button>
            </div>
            {activeBlock && activeBlock.id === b.id && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  height: 3,
                  width: `${b.volume}%`,
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 2,
                  transition: 'width 0.08s linear',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="knob-wrap">
        <div
          className="knob"
          onPointerDown={handleKnobPointerDown}
          onPointerMove={handleKnobPointerMove}
          onPointerUp={handleKnobPointerUp}
          onPointerCancel={handleKnobPointerUp}
          title="总音量：上下拖动"
        >
          <div
            className="knob-pointer"
            style={{ transform: `translateX(-50%) rotate(${knobAngle}deg)` }}
          />
        </div>
        <div className="knob-label">{Math.round(totalVolume)}</div>
      </div>

      <div className="save-wrap">
        <button type="button" className="save-btn" onClick={onSave} aria-label="保存音景">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>
        <div className="save-label">保存</div>
        {shareLink && (
          <div className="share-link" title={shareLink}>
            已生成：{window.location.origin + shareLink}
          </div>
        )}
      </div>

      {showNick && (
        <div className="nick-modal" onClick={() => setShowNick(false)}>
          <div className="nick-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="nick-modal-title">先给自己起个名字</h3>
            <p className="nick-modal-desc">其他玩家打开你的音景时，会看到这个昵称</p>
            <input
              className="nick-modal-input"
              value={nickInput}
              onChange={(e) => setNickInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmNick()}
              placeholder="例如：街角漫步者"
              autoFocus
              maxLength={16}
            />
            <div className="nick-modal-actions">
              <button type="button" className="nick-modal-btn ghost" onClick={() => setShowNick(false)}>
                取消
              </button>
              <button type="button" className="nick-modal-btn primary" onClick={confirmNick}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
