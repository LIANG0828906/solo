import React, { useState, useRef, useEffect } from 'react';
import { useStore, PRESET_CHARACTERS, COLOR_PALETTE } from '@/store/useStore';
import type { Character as CharacterType, Panel } from '@/types/story';

const getDialogBubblePath = (direction: 'left' | 'right', w: number, h: number): string => {
  const r = 12;
  if (direction === 'right') {
    return `M ${r} 0 
            L ${w - r} 0 
            Q ${w} 0 ${w} ${r} 
            L ${w} ${h - r} 
            Q ${w} ${h} ${w - r} ${h}
            L ${r + 20} ${h}
            L ${r + 8} ${h + 14}
            L ${r + 12} ${h}
            L ${r} ${h}
            Q 0 ${h} 0 ${h - r}
            L 0 ${r}
            Q 0 0 ${r} 0
            Z`;
  } else {
    return `M ${r} 0 
            L ${w - r} 0 
            Q ${w} 0 ${w} ${r} 
            L ${w} ${h - r} 
            Q ${w} ${h} ${w - r} ${h}
            L ${w - r - 12} ${h}
            L ${w - r - 8} ${h + 14}
            L ${w - r - 20} ${h}
            L ${r} ${h}
            Q 0 ${h} 0 ${h - r}
            L 0 ${r}
            Q 0 0 ${r} 0
            Z`;
  }
};

interface DialogBubbleProps {
  text: string;
  x: number;
  y: number;
  direction: 'left' | 'right';
  onDoubleClick?: () => void;
  displayedText?: string;
}

const DialogBubble: React.FC<DialogBubbleProps> = ({
  text,
  x,
  y,
  direction,
  onDoubleClick,
  displayedText,
}) => {
  const showText = displayedText ?? text;
  const lines = showText.split('\n').slice(0, 2);
  const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
  const bubbleW = Math.min(260, Math.max(120, maxLineLen * 15 + 40));
  const bubbleH = lines.length > 1 ? 72 : 48;

  let bx = x;
  if (direction === 'right') {
    bx = x + 50;
  } else {
    bx = x - 50 - bubbleW;
  }
  const by = y - bubbleH - 20;

  return (
    <g onDoubleClick={onDoubleClick} style={{ cursor: onDoubleClick ? 'pointer' : 'default' }}>
      <path
        d={getDialogBubblePath(direction, bubbleW, bubbleH)}
        transform={`translate(${bx}, ${by})`}
        fill="white"
        stroke="#4A2C2A"
        strokeWidth="3"
      />
      <foreignObject x={bx + 12} y={by + 8} width={bubbleW - 24} height={bubbleH - 8}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#4A2C2A',
            lineHeight: lines.length > 1 ? '24px' : '28px',
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
          }}
        >
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </foreignObject>
    </g>
  );
};

interface CharacterNodeProps {
  character: CharacterType;
  panel: Panel;
  onStartMove: (id: string) => void;
  onEndMove: () => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onRemove: (id: string) => void;
  fadeAnim?: boolean;
  animDelay?: number;
  typingText?: string;
}

const CharacterNode: React.FC<CharacterNodeProps> = ({
  character,
  panel,
  onStartMove,
  onEndMove,
  onUpdatePosition,
  onDoubleClick,
  onRemove,
  fadeAnim,
  animDelay = 0,
  typingText,
}) => {
  const [opacity, setOpacity] = useState(fadeAnim ? 0 : 1);
  const ref = useRef<SVGGElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (fadeAnim) {
      const timer = setTimeout(() => setOpacity(1), animDelay);
      return () => clearTimeout(timer);
    }
  }, [fadeAnim, animDelay]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    isDragging.current = true;
    onStartMove(character.id);

    const svg = (ref.current?.closest('svg') as unknown) as SVGSVGElement | null;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    offset.current = {
      x: svgP.x - character.x,
      y: svgP.y - character.y,
    };

    const handleMove = (ev: MouseEvent) => {
      if (!isDragging.current || !svg) return;
      const pt2 = svg.createSVGPoint();
      pt2.x = ev.clientX;
      pt2.y = ev.clientY;
      const sp = pt2.matrixTransform(svg.getScreenCTM()?.inverse());
      let nx = sp.x - offset.current.x;
      let ny = sp.y - offset.current.y;
      nx = Math.max(40, Math.min(panel.width - 40, nx));
      ny = Math.max(60, Math.min(panel.height - 40, ny));
      onUpdatePosition(character.id, nx, ny);
    };

    const handleUp = () => {
      isDragging.current = false;
      onEndMove();
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  return (
    <g
      ref={ref}
      style={{
        opacity,
        transition: fadeAnim ? 'opacity 0.5s ease-out' : undefined,
      }}
    >
      {character.dialog && (
        <DialogBubble
          text={character.dialog.text}
          x={character.x}
          y={character.y}
          direction={character.dialog.direction}
          onDoubleClick={() => onDoubleClick(character.id)}
          displayedText={typingText}
        />
      )}
      <g
        onMouseDown={handleMouseDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick(character.id);
        }}
        style={{ cursor: 'grab' }}
      >
        <rect
          x={character.x - 38}
          y={character.y - 18}
          width="76"
          height="22"
          rx="11"
          fill="#4A2C2A"
        />
        <text
          x={character.x}
          y={character.y - 3}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#FFF8E7"
        >
          {character.name}
        </text>
        <text
          x={character.x}
          y={character.y + 46}
          textAnchor="middle"
          fontSize="56"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {character.emoji}
        </text>
        <circle
          cx={character.x}
          cy={character.y + 22}
          r="34"
          fill="rgba(74,44,42,0.08)"
          style={{ pointerEvents: 'none' }}
        />
      </g>
      <g
        onClick={(e) => {
          e.stopPropagation();
          onRemove(character.id);
        }}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={character.x + 32} cy={character.y - 22} r="10" fill="#E63946" />
        <text
          x={character.x + 32}
          y={character.y - 18}
          textAnchor="middle"
          fontSize="12"
          fill="white"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          ×
        </text>
      </g>
    </g>
  );
};

interface PanelEditorProps {
  isPlayPreview?: boolean;
  fadeAnimate?: boolean;
  typingTexts?: Record<string, string>;
}

export const PanelEditor: React.FC<PanelEditorProps> = ({
  isPlayPreview = false,
  fadeAnimate = false,
  typingTexts,
}) => {
  const {
    story,
    currentPanelIndex,
    updatePanelBackground,
    addCharacter,
    removeCharacter,
    updateCharacterPosition,
    updateCharacterDialog,
  } = useStore();

  const panel = story.panels[currentPanelIndex];
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [dialogInput, setDialogInput] = useState('');
  const [movingCharId, setMovingCharId] = useState<string | null>(null);
  const [bgImageLoading, setBgImageLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCharId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCharId]);

  if (!panel) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPlayPreview) return;
    const charType = e.dataTransfer.getData('application/preset-character');
    const preset = PRESET_CHARACTERS.find((p) => p.type === charType);
    if (!preset) return;

    const svg = (e.currentTarget as unknown as HTMLElement).querySelector('svg');
    if (!svg) return;
    const pt = (svg as unknown as SVGSVGElement).createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const sp = pt.matrixTransform((svg as unknown as SVGSVGElement).getScreenCTM()?.inverse());
    const x = Math.max(40, Math.min(panel.width - 40, sp.x));
    const y = Math.max(80, Math.min(panel.height - 40, sp.y));
    addCharacter(panel.id, preset, x, y);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCharDoubleClick = (charId: string) => {
    if (isPlayPreview) return;
    const ch = panel.characters.find((c) => c.id === charId);
    if (!ch) return;
    setEditingCharId(charId);
    setDialogInput(ch.dialog?.text ?? '');
  };

  const handleSaveDialog = () => {
    if (!editingCharId) return;
    updateCharacterDialog(panel.id, editingCharId, dialogInput);
    setEditingCharId(null);
  };

  const handleBgImageUpload = (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg)$/)) {
      alert('仅支持 JPG/PNG 格式');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }
    setBgImageLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updatePanelBackground(panel.id, undefined, dataUrl);
      setBgImageLoading(false);
    };
    reader.onerror = () => {
      alert('图片加载失败');
      setBgImageLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          className="relative shadow-2xl rounded-xl overflow-hidden"
          style={{
            width: panel.width,
            height: panel.height,
            backgroundColor: panel.backgroundColor,
            backgroundImage: panel.backgroundImage ? `url(${panel.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '3px solid #4A2C2A',
            flexShrink: 0,
          }}
        >
          {bgImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <svg
            viewBox={`0 0 ${panel.width} ${panel.height}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            {panel.characters.map((ch, idx) => (
              <CharacterNode
                key={ch.id}
                character={ch}
                panel={panel}
                onStartMove={(id) => !isPlayPreview && setMovingCharId(id)}
                onEndMove={() => setMovingCharId(null)}
                onUpdatePosition={(id, x, y) =>
                  updateCharacterPosition(panel.id, id, x, y)
                }
                onDoubleClick={handleCharDoubleClick}
                onRemove={(id) => removeCharacter(panel.id, id)}
                fadeAnim={fadeAnimate}
                animDelay={fadeAnimate ? idx * 250 : 0}
                typingText={typingTexts?.[ch.id]}
              />
            ))}
          </svg>

          {panel.characters.length === 0 && !isPlayPreview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="px-6 py-4 rounded-2xl text-center"
                style={{
                  backgroundColor: 'rgba(74,44,42,0.08)',
                  border: '2px dashed rgba(74,44,42,0.3)',
                }}
              >
                <div className="text-4xl mb-2">🎭</div>
                <div className="font-medium" style={{ color: '#4A2C2A' }}>
                  从右上角角色库拖拽角色到此画布
                </div>
                <div className="text-sm mt-1 opacity-70" style={{ color: '#4A2C2A' }}>
                  双击角色可添加对话
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isPlayPreview && (
        <div
          className="px-6 py-4 border-t-2"
          style={{ borderColor: 'rgba(74,44,42,0.1)', backgroundColor: '#FFF8E7' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bangers text-lg" style={{ color: '#4A2C2A' }}>
                🎨 背景色:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto max-w-[600px] pb-1">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => updatePanelBackground(panel.id, c, undefined)}
                    className="flex-shrink-0 transition-all rounded-lg"
                    style={{
                      width: panel.backgroundColor === c ? 40 : 32,
                      height: panel.backgroundColor === c ? 40 : 32,
                      backgroundColor: c,
                      border: panel.backgroundColor === c ? '3px solid white' : '2px solid #4A2C2A',
                      boxShadow: panel.backgroundColor === c ? '0 0 0 2px #E63946' : 'none',
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="btn"
                onClick={() => fileInputRef.current?.click()}
              >
                🖼️ 上传图片
              </button>
              {panel.backgroundImage && (
                <button
                  className="btn btn-ghost"
                  onClick={() => updatePanelBackground(panel.id, undefined, '')}
                >
                  清除图片
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBgImageUpload(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <div
            className="mt-4 text-center py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'rgba(74,44,42,0.06)', color: '#4A2C2A' }}
          >
            📌 当前面板：<span style={{ color: '#E63946' }}>{currentPanelIndex + 1}</span> /{' '}
            {story.panels.length}
          </div>
        </div>
      )}

      {editingCharId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setEditingCharId(null)}
        >
          <div
            className="animate-zoom-in bg-white rounded-2xl shadow-2xl p-6 w-[92%] max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bangers text-xl mb-4" style={{ color: '#4A2C2A' }}>
              💬 编辑对话
            </h3>
            <textarea
              ref={inputRef}
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveDialog();
                }
              }}
              rows={3}
              maxLength={60}
              placeholder="输入角色对话（支持两行文本，按回车保存，Shift+回车换行）"
              className="w-full mb-4 resize-none"
              style={{
                border: '2px solid #ccc',
                borderRadius: '8px',
                padding: '12px',
                outline: 'none',
                fontSize: '15px',
              }}
            />
            <div className="text-xs mb-4 opacity-60" style={{ color: '#4A2C2A' }}>
              提示：气泡方向将根据角色位置自动调整
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-ghost" onClick={() => setEditingCharId(null)}>
                取消
              </button>
              <button className="btn btn-accent" onClick={handleSaveDialog}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
