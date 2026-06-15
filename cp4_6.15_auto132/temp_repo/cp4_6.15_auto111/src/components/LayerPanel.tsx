import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '@/store/slice';
import { getPresetsMap } from '@/utils/presets';
import ThumbnailWorker from '@/workers/thumbnail.worker.ts?worker';

interface DragInfo {
  id: string;
  targetIndex: number | null;
}

export default function LayerPanel() {
  const elements = useStore((s) => s.elements);
  const selectedIds = useStore((s) => s.selectedIds);
  const selectElements = useStore((s) => s.selectElements);
  const reorderElement = useStore((s) => s.reorderElement);
  const toggleVisibility = useStore((s) => s.toggleVisibility);

  const [collapsed, setCollapsed] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const workerRef = useRef<Worker | null>(null);
  const scheduledForThumbnail = useRef<Set<string>>(new Set());
  const dragInfo = useRef<DragInfo>({ id: '', targetIndex: null });
  const [hoverTarget, setHoverTarget] = useState<number | null>(null);

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => b.zIndex - a.zIndex),
    [elements]
  );

  // 初始化 Worker，批量生成缩略图
  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new ThumbnailWorker();
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'done') {
          setThumbnails((prev) => ({ ...prev, ...e.data.thumbnails }));
        }
      };
    }
    const presetsMap = getPresetsMap();
    const missing = elements.filter(
      (e) =>
        !thumbnails[e.id] &&
        !scheduledForThumbnail.current.has(e.id) &&
        presetsMap[e.presetId]
    );
    if (missing.length === 0) return;
    missing.forEach((e) => scheduledForThumbnail.current.add(e.id));
    const payload = missing.map((e) => ({
      id: e.id,
      element: e,
      preset: presetsMap[e.presetId],
    }));
    workerRef.current.postMessage({
      type: 'generate',
      elements: payload,
      size: 40,
    });
    return () => {
      // 保留 worker 供后续使用
    };
  }, [elements, thumbnails]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      dragInfo.current = { id, targetIndex: null };
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setHoverTarget(index);
      dragInfo.current.targetIndex = index;
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      const id = dragInfo.current.id || e.dataTransfer.getData('text/plain');
      if (!id) return;
      // sortedElements 是 zIndex 逆序（顶部在前），所以要转换
      const realSortedLength = sortedElements.length;
      const sourceZIndex = elements.find((x) => x.id === id)?.zIndex;
      if (sourceZIndex === undefined) return;
      // 目标zIndex: sortedElements[targetIndex].zIndex
      const targetZIndex = sortedElements[targetIndex]?.zIndex;
      if (targetZIndex === undefined) return;
      // 重新排序，把id放在目标位置（考虑方向）
      const reordered = [...sortedElements];
      const sourceIdx = reordered.findIndex((x) => x.id === id);
      if (sourceIdx < 0) return;
      const [moved] = reordered.splice(sourceIdx, 1);
      let insertIdx = targetIndex;
      if (sourceIdx < targetIndex) insertIdx = targetIndex;
      reordered.splice(insertIdx, 0, moved);
      // 反转：zIndex升序
      const zOrderMap = new Map<string, number>();
      reordered
        .slice()
        .reverse()
        .forEach((e, i) => zOrderMap.set(e.id, i));
      // 只把moved元素移动到目标zIndex，使用store的reorder
      reorderElement(id, zOrderMap.get(id) ?? targetZIndex);
      setHoverTarget(null);
      dragInfo.current = { id: '', targetIndex: null };
    },
    [sortedElements, elements, reorderElement]
  );

  const handleDragLeave = useCallback(() => {
    setHoverTarget(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setHoverTarget(null);
    dragInfo.current = { id: '', targetIndex: null };
  }, []);

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        left: 12,
        bottom: 12,
        width: 260,
        maxWidth: 'calc(100% - 24px)',
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 15,
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'var(--neon-green)',
          }}
        >
          <Layers size={13} />
          图层
          <span
            style={{
              marginLeft: 4,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: 0,
            }}
          >
            {elements.length}
          </span>
        </div>
        {collapsed ? (
          <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>

      {!collapsed && (
        <div
          style={{
            maxHeight: '40vh',
            minHeight: elements.length > 0 ? undefined : 48,
            overflowY: 'auto',
            padding: 6,
          }}
        >
          {sortedElements.length === 0 && (
            <div
              style={{
                padding: '12px 10px',
                fontSize: 11,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
              }}
            >
              拖拽左侧元素到画布开始创作
            </div>
          )}
          {sortedElements.map((el, index) => {
            const preset = getPresetsMap()[el.presetId];
            const thumb = thumbnails[el.id];
            const isSelected = selectedIds.includes(el.id);
            return (
              <div
                key={el.id}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                style={{ position: 'relative' }}
              >
                {hoverTarget === index && (
                  <div
                    className="drop-indicator"
                    style={{
                      position: 'absolute',
                      left: 4,
                      right: 4,
                      top: -1,
                      zIndex: 10,
                    }}
                  />
                )}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, el.id)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    e.stopPropagation();
                    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
                    selectElements([el.id], additive);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 6px',
                    borderRadius: 8,
                    cursor: 'grab',
                    background: isSelected
                      ? 'rgba(0,240,255,0.08)'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(0,240,255,0.35)'
                      : '1px solid transparent',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                    marginBottom: 2,
                  }}
                  title={el.name}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'rgba(15,15,25,0.85)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: preset?.defaultColor ?? el.color,
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          opacity: el.visible ? 1 : 0.3,
                        }}
                        draggable={false}
                      />
                    ) : preset ? (
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="xMidYMid meet"
                        width="28"
                        height="28"
                        style={{ opacity: el.visible ? 1 : 0.25 }}
                        dangerouslySetInnerHTML={{ __html: preset.svgContent }}
                      />
                    ) : null}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      opacity: el.visible ? 1 : 0.45,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        color: isSelected
                          ? 'var(--neon-cyan)'
                          : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {preset?.name ?? el.name}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        gap: 6,
                        marginTop: 1,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: el.color,
                          marginTop: 2,
                          flexShrink: 0,
                          boxShadow: `0 0 4px ${el.color}aa`,
                        }}
                      />
                      <span>#{el.id.slice(0, 4)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(el.id);
                    }}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: el.visible
                        ? 'var(--text-secondary)'
                        : 'var(--text-muted)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        'rgba(0,240,255,0.35)';
                      (e.currentTarget as HTMLElement).style.color =
                        'var(--neon-cyan)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLElement).style.color = el.visible
                        ? 'var(--text-secondary)'
                        : 'var(--text-muted)';
                    }}
                    title={el.visible ? '隐藏图层' : '显示图层'}
                  >
                    {el.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
