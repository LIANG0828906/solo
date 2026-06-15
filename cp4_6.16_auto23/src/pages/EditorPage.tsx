import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Type,
  Sticker,
  Sparkles,
  Download,
  Save,
  Trash2,
  Layers,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Eye,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';
import {
  useStore,
  type Meme,
  type OverlayElement,
  type AnimationType,
  type AnimationSpeed,
  type AnimationConfig,
} from '../store/useStore';

const DEFAULT_STICKERS = ['😂', '❤️', '💣', '🔥', '😎', '🤔', '👍', '😭', '🎉', '💀', '✨', '🤡'];

const ANIMATION_OPTIONS: { type: AnimationType; label: string; icon: string }[] = [
  { type: 'none', label: '无动效', icon: '🚫' },
  { type: 'shake', label: '抖动', icon: '📳' },
  { type: 'pulse', label: '脉冲放大', icon: '💗' },
  { type: 'swing', label: '左右摇摆', icon: '🎭' },
  { type: 'blink', label: '闪烁', icon: '✨' },
];

const SPEED_OPTIONS: { value: AnimationSpeed; label: string }[] = [
  { value: 'slow', label: '慢' },
  { value: 'medium', label: '中' },
  { value: 'fast', label: '快' },
];

const LOOP_OPTIONS: { value: number | 'infinite'; label: string }[] = [
  { value: 1, label: '1次' },
  { value: 2, label: '2次' },
  { value: 3, label: '3次' },
  { value: 4, label: '4次' },
  { value: 5, label: '5次' },
  { value: 'infinite', label: '无限循环' },
];

export default function EditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const meme = useStore((state) => state.memes.find((m) => m.id === id));
  const updateMeme = useStore((state) => state.updateMeme);

  const [overlays, setOverlays] = useState<OverlayElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [animation, setAnimation] = useState<AnimationConfig>({
    type: 'none',
    speed: 'medium',
    loopCount: 'infinite',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isAnimationSwitching, setIsAnimationSwitching] = useState(false);
  const [newText, setNewText] = useState('');
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState('#2C2C2C');
  const [activeTab, setActiveTab] = useState<'text' | 'sticker' | 'animation'>('text');
  const [toast, setToast] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    type: 'move' | 'resize' | 'rotate' | null;
    startX: number;
    startY: number;
    startOverlay: OverlayElement | null;
    startAngle: number;
  }>({ type: null, startX: 0, startY: 0, startOverlay: null, startAngle: 0 });

  useEffect(() => {
    if (meme) {
      setOverlays(meme.overlays || []);
      setAnimation(meme.animation || { type: 'none', speed: 'medium', loopCount: 'infinite' });
    }
  }, [meme]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const selectedOverlay = overlays.find((o) => o.id === selectedId);

  const handleAnimationChange = (type: AnimationType) => {
    setIsAnimationSwitching(true);
    setTimeout(() => {
      setAnimation((prev) => ({ ...prev, type }));
      setIsAnimationSwitching(false);
    }, 300);
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    const previewEl = previewRef.current;
    const width = previewEl ? previewEl.offsetWidth : 400;
    const height = previewEl ? previewEl.offsetHeight : 300;
    const maxZ = overlays.reduce((max, o) => Math.max(max, o.zIndex), 0);
    const newOverlay: OverlayElement = {
      id: uuidv4(),
      type: 'text',
      content: newText,
      x: width / 2 - 100,
      y: height / 2 - 30,
      width: 200,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      fontSize: textSize,
      color: textColor,
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedId(newOverlay.id);
    setNewText('');
  };

  const addStickerOverlay = (sticker: string) => {
    const previewEl = previewRef.current;
    const width = previewEl ? previewEl.offsetWidth : 400;
    const height = previewEl ? previewEl.offsetHeight : 300;
    const maxZ = overlays.reduce((max, o) => Math.max(max, o.zIndex), 0);
    const newOverlay: OverlayElement = {
      id: uuidv4(),
      type: 'sticker',
      content: sticker,
      x: width / 2 - 40,
      y: height / 2 - 40,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedId(newOverlay.id);
  };

  const updateOverlay = (id: string, updates: Partial<OverlayElement>) => {
    setOverlays(overlays.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const deleteOverlay = (id: string) => {
    setOverlays(overlays.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = overlays.findIndex((o) => o.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= overlays.length) return;
    const newOverlays = [...overlays];
    const temp = newOverlays[idx].zIndex;
    newOverlays[idx].zIndex = newOverlays[targetIdx].zIndex;
    newOverlays[targetIdx].zIndex = temp;
    [newOverlays[idx], newOverlays[targetIdx]] = [newOverlays[targetIdx], newOverlays[idx]];
    setOverlays(newOverlays);
  };

  const getRelativeCoords = useCallback((clientX: number, clientY: number) => {
    const previewEl = previewRef.current;
    if (!previewEl) return { x: 0, y: 0 };
    const rect = previewEl.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent, overlayId: string, action: 'move' | 'resize' | 'rotate') => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const overlay = overlays.find((o) => o.id === overlayId);
    if (!overlay) return;

    const coords = getRelativeCoords(e.clientX, e.clientY);
    let startAngle = 0;
    if (action === 'rotate') {
      const centerX = overlay.x + overlay.width / 2;
      const centerY = overlay.y + overlay.height / 2;
      startAngle = Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
    }

    dragStateRef.current = {
      type: action,
      startX: coords.x,
      startY: coords.y,
      startOverlay: { ...overlay },
      startAngle,
    };
    setSelectedId(overlayId);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const { type, startX, startY, startOverlay, startAngle } = dragStateRef.current;
      if (!type || !startOverlay) return;

      const coords = getRelativeCoords(e.clientX, e.clientY);
      const dx = coords.x - startX;
      const dy = coords.y - startY;

      if (type === 'move') {
        const newX = Math.max(0, Math.min(startOverlay.x + dx, (previewRef.current?.offsetWidth || 400) - startOverlay.width));
        const newY = Math.max(0, Math.min(startOverlay.y + dy, (previewRef.current?.offsetHeight || 300) - startOverlay.height));
        updateOverlay(startOverlay.id, { x: newX, y: newY });
      } else if (type === 'resize') {
        const newWidth = Math.max(40, startOverlay.width + dx);
        const newHeight = startOverlay.type === 'sticker' 
          ? Math.max(40, startOverlay.height + dy)
          : Math.max(30, startOverlay.height + dy);
        updateOverlay(startOverlay.id, { width: newWidth, height: newHeight });
      } else if (type === 'rotate') {
        const centerX = startOverlay.x + startOverlay.width / 2;
        const centerY = startOverlay.y + startOverlay.height / 2;
        const currentAngle = Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
        const newRotation = startOverlay.rotation + (currentAngle - startAngle);
        updateOverlay(startOverlay.id, { rotation: newRotation });
      }
    },
    [getRelativeCoords]
  );

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = { type: null, startX: 0, startY: 0, startOverlay: null, startAngle: 0 };
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleExport = async () => {
    if (!previewRef.current || !meme) return;
    setIsExporting(true);
    setSelectedId(null);

    const startTime = Date.now();

    try {
      const canvasOpts = {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc: Document) => {
          const cloned = clonedDoc.querySelector('.preview-canvas') as HTMLElement;
          if (cloned) {
            cloned.style.animation = 'none';
            const animated = cloned.querySelector('.animated-wrapper') as HTMLElement;
            if (animated) animated.style.animation = 'none';
          }
        },
      };
      const canvasPromise = html2canvas(previewRef.current, canvasOpts);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Export timeout')), 2000)
      );
      const canvas = await Promise.race([canvasPromise, timeoutPromise]);

      const elapsed = Date.now() - startTime;
      const dataUrl = canvas.toDataURL('image/png');

      await updateMeme(meme.id, {
        imageUrl: dataUrl,
        overlays: [],
      });

      showToast(`✓ 导出成功！用时 ${elapsed}ms`);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAnimation = async () => {
    if (!meme) return;
    await updateMeme(meme.id, { animation, overlays });
    showToast('✓ 动效已保存');
  };

  const handleResetAnimation = () => {
    handleAnimationChange('none');
    setAnimation({ type: 'none', speed: 'medium', loopCount: 'infinite' });
  };

  const getAnimationStyle = () => {
    if (animation.type === 'none') return {};
    const speedClass = animation.speed === 'slow' ? '1.5s' : animation.speed === 'medium' ? '0.8s' : '0.4s';
    const iteration = animation.loopCount === 'infinite' ? 'infinite' : `${animation.loopCount}`;
    return {
      animation: `${animation.type} ${speedClass} ease-in-out ${iteration}`,
      transformOrigin: 'center center',
    };
  };

  if (!meme) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>表情包不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> 返回首页
        </button>
      </div>
    );
  }

  return (
    <div>
      <header className="app-header">
        <div className="flex items-center gap-4">
          <button className="btn" onClick={() => navigate('/')} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={20} />
          </button>
          <div className="logo">
            <span className="logo-icon">✏️</span>
            编辑：{meme.name}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={handleResetAnimation}>
            <RotateCcw size={18} /> 重置
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download size={18} />
            {isExporting ? '导出中...' : '导出图片'}
          </button>
        </div>
      </header>

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#2C2C2C',
            color: '#F5E642',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 600,
            zIndex: 2000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {toast}
        </div>
      )}

      <div className="editor-layout">
        <div className="editor-preview">
          <div
            className={`animation-preview-transition ${isAnimationSwitching ? 'switching' : ''}`}
            style={{ width: '100%', maxWidth: 600, maxHeight: '100%' }}
          >
            <div
              ref={previewRef}
              className="preview-canvas animated-wrapper"
              style={getAnimationStyle()}
              onClick={() => setSelectedId(null)}
            >
              <img
                src={meme.imageUrl}
                alt={meme.name}
                style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
                draggable={false}
              />

              {overlays.map((overlay) => {
                const isSelected = selectedId === overlay.id;
                return (
                  <div
                    key={overlay.id}
                    className={`draggable-element ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: overlay.x,
                      top: overlay.y,
                      width: overlay.width,
                      height: overlay.height,
                      transform: `rotate(${overlay.rotation}deg)`,
                      opacity: overlay.opacity,
                      zIndex: overlay.zIndex,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPointerDown={(e) => handlePointerDown(e, overlay.id, 'move')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(overlay.id);
                    }}
                  >
                    {overlay.type === 'text' ? (
                      <div
                        style={{
                          fontSize: overlay.fontSize,
                          color: overlay.color,
                          fontWeight: 700,
                          fontFamily: "'Fredoka', 'Noto Sans SC', sans-serif",
                          textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          width: '100%',
                        }}
                      >
                        {overlay.content}
                      </div>
                    ) : (
                      <div style={{ fontSize: Math.min(overlay.width, overlay.height) * 0.9 }}>
                        {overlay.content}
                      </div>
                    )}

                    {isSelected && (
                      <>
                        <div className="rotate-line" />
                        <div
                          className="rotate-handle"
                          onPointerDown={(e) => handlePointerDown(e, overlay.id, 'rotate')}
                          title="旋转"
                        >
                          ↻
                        </div>
                        <div
                          className="resize-handle bottom-right"
                          onPointerDown={(e) => handlePointerDown(e, overlay.id, 'resize')}
                          title="缩放"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="editor-tools">
          <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl">
            <button
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'text' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('text')}
            >
              <Type size={16} className="inline mr-1" /> 文字
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'sticker' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('sticker')}
            >
              <Sticker size={16} className="inline mr-1" /> 贴纸
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'animation' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('animation')}
            >
              <Sparkles size={16} className="inline mr-1" /> 动效
            </button>
          </div>

          {activeTab === 'text' && (
            <div className="animate-fadeIn">
              <div className="tool-section">
                <h3 className="tool-section-title">
                  <Type size={18} /> 添加文字气泡
                </h3>
                <div className="space-y-3">
                  <input
                    className="input"
                    placeholder="输入文字内容..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTextOverlay()}
                    maxLength={30}
                  />
                  <div className="flex gap-3">
                    <div style={{ flex: 1 }}>
                      <label className="block text-xs text-gray-500 mb-1">字号: {textSize}px</label>
                      <input
                        type="range"
                        className="slider"
                        min="12"
                        max="72"
                        value={textSize}
                        onChange={(e) => setTextSize(Number(e.target.value))}
                      />
                    </div>
                    <div style={{ width: 80 }}>
                      <label className="block text-xs text-gray-500 mb-1">颜色</label>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        style={{ width: '100%', height: 38, borderRadius: 8, cursor: 'pointer', border: '2px solid #E0E0E0' }}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={addTextOverlay}
                    disabled={!newText.trim()}
                  >
                    <Plus2 size={18} /> 添加文字
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sticker' && (
            <div className="animate-fadeIn">
              <div className="tool-section">
                <h3 className="tool-section-title">
                  <Sticker size={18} /> 选择贴纸
                </h3>
                <div className="sticker-grid">
                  {DEFAULT_STICKERS.map((sticker, idx) => (
                    <button
                      key={idx}
                      className="sticker-item"
                      onClick={() => addStickerOverlay(sticker)}
                      title="点击添加贴纸"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'animation' && (
            <div className="animate-fadeIn">
              <div className="tool-section">
                <h3 className="tool-section-title">
                  <Sparkles size={18} /> 动态效果
                </h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {ANIMATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      className={`sticker-item flex-col ${animation.type === opt.type ? 'active' : ''}`}
                      onClick={() => handleAnimationChange(opt.type)}
                      style={{ flexDirection: 'column', fontSize: 20, aspectRatio: 'auto', padding: '8px 4px', height: 64 }}
                    >
                      <span style={{ fontSize: 22 }}>{opt.icon}</span>
                      <span style={{ fontSize: 10, marginTop: 2 }}>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {animation.type !== 'none' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">播放速度</label>
                      <div className="flex gap-2">
                        {SPEED_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            className={`chip flex-1 justify-center ${animation.speed === opt.value ? 'active' : ''}`}
                            onClick={() => setAnimation((prev) => ({ ...prev, speed: opt.value }))}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">循环次数</label>
                      <div className="flex gap-2 flex-wrap">
                        {LOOP_OPTIONS.map((opt) => (
                          <button
                            key={String(opt.value)}
                            className={`chip ${animation.loopCount === opt.value ? 'active' : ''}`}
                            onClick={() => setAnimation((prev) => ({ ...prev, loopCount: opt.value }))}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="btn btn-primary w-full" onClick={handleSaveAnimation}>
                      <Save size={18} /> 保存动效设置
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {selectedOverlay && (
            <div className="tool-section animate-fadeIn">
              <h3 className="tool-section-title">
                <Layers size={18} /> 元素属性
                {selectedOverlay.type === 'text' ? '（文字）' : '（贴纸）'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    不透明度: {Math.round(selectedOverlay.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={selectedOverlay.opacity}
                    onChange={(e) => updateOverlay(selectedOverlay.id, { opacity: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    旋转角度: {Math.round(selectedOverlay.rotation)}°
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      className="slider flex-1"
                      min="-180"
                      max="180"
                      value={selectedOverlay.rotation}
                      onChange={(e) => updateOverlay(selectedOverlay.id, { rotation: Number(e.target.value) })}
                    />
                    <input
                      type="number"
                      className="input"
                      style={{ width: 70, padding: '6px 8px', fontSize: 12 }}
                      value={Math.round(selectedOverlay.rotation)}
                      onChange={(e) => updateOverlay(selectedOverlay.id, { rotation: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">层级调整</label>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={() => moveLayer(selectedOverlay.id, 'up')}
                    >
                      <ChevronUp size={16} /> 上移
                    </button>
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={() => moveLayer(selectedOverlay.id, 'down')}
                    >
                      <ChevronDown size={16} /> 下移
                    </button>
                  </div>
                </div>

                {selectedOverlay.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">文字内容</label>
                      <input
                        className="input"
                        value={selectedOverlay.content}
                        onChange={(e) => updateOverlay(selectedOverlay.id, { content: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-3">
                      <div style={{ flex: 1 }}>
                        <label className="block text-xs text-gray-500 mb-1">字号: {selectedOverlay.fontSize}px</label>
                        <input
                          type="range"
                          className="slider"
                          min="12"
                          max="72"
                          value={selectedOverlay.fontSize}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { fontSize: Number(e.target.value) })}
                        />
                      </div>
                      <div style={{ width: 80 }}>
                        <label className="block text-xs text-gray-500 mb-1">颜色</label>
                        <input
                          type="color"
                          value={selectedOverlay.color}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { color: e.target.value })}
                          style={{ width: '100%', height: 38, borderRadius: 8, cursor: 'pointer', border: '2px solid #E0E0E0' }}
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  className="btn btn-danger w-full"
                  onClick={() => deleteOverlay(selectedOverlay.id)}
                >
                  <Trash2 size={18} /> 删除此元素
                </button>
              </div>
            </div>
          )}

          {overlays.length > 0 && (
            <div className="tool-section">
              <h3 className="tool-section-title">
                <Eye size={18} /> 图层列表 ({overlays.length})
              </h3>
              <div className="space-y-2">
                {[...overlays]
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((overlay) => (
                    <div
                      key={overlay.id}
                      className={`chip justify-between w-full ${selectedId === overlay.id ? 'active' : ''}`}
                      onClick={() => setSelectedId(overlay.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="truncate flex-1 text-left" style={{ marginRight: 8 }}>
                        {overlay.type === 'text' ? '📝' : '🎨'} {overlay.content.slice(0, 10)}
                        {overlay.content.length > 10 ? '...' : ''}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOverlay(overlay.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: selectedId === overlay.id ? '#2C2C2C' : '#999',
                          padding: 0,
                          fontSize: 14,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Plus2({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
