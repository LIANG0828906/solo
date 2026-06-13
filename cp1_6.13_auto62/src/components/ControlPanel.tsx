import { useCallback, useState, useEffect, useRef } from 'react';
import { Upload, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore, type StyleType } from '@/store/useAppStore';

const STYLES: { key: StyleType; label: string; gradient: string; color: string }[] = [
  { key: 'lowpoly', label: '低多边形', gradient: 'linear-gradient(135deg, #ff6f00, #ffab00)', color: '#ff8f00' },
  { key: 'toon', label: '卡通渲染', gradient: 'linear-gradient(135deg, #7c4dff, #b388ff)', color: '#7c4dff' },
  { key: 'wireframe', label: '线稿', gradient: 'linear-gradient(135deg, #ffffff, #b0bec5)', color: '#ffffff' },
  { key: 'watercolor', label: '水彩风', gradient: 'linear-gradient(135deg, #00bcd4, #448aff)', color: '#00bcd4' },
];

export default function ControlPanel() {
  const currentStyle = useAppStore((s) => s.currentStyle);
  const detailIntensity = useAppStore((s) => s.detailIntensity);
  const modelLoaded = useAppStore((s) => s.modelLoaded);
  const isLoading = useAppStore((s) => s.isLoading);
  const isExporting = useAppStore((s) => s.isExporting);
  const showSaveMessage = useAppStore((s) => s.showSaveMessage);
  const setStyle = useAppStore((s) => s.setStyle);
  const setDetailIntensity = useAppStore((s) => s.setDetailIntensity);
  const setUploadedFile = useAppStore((s) => s.setUploadedFile);
  const triggerFlash = useAppStore((s) => s.triggerFlash);
  const triggerSaveMessage = useAppStore((s) => s.triggerSaveMessage);
  const setExporting = useAppStore((s) => s.setExporting);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sliderPressed, setSliderPressed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'obj' || ext === 'gltf' || ext === 'glb') {
        setUploadedFile(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setUploadedFile]);

  const handleExport = useCallback(() => {
    setExporting(true);
    triggerFlash();

    const store = useAppStore.getState();
    if (store.exportHandler) {
      store.exportHandler();
    }

    setTimeout(() => {
      triggerSaveMessage();
      setExporting(false);
    }, 300);
  }, [setExporting, triggerFlash, triggerSaveMessage]);

  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsNarrow(window.innerWidth < 768);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (isNarrow) {
    return (
      <>
        <div className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          <span>控制面板</span>
        </div>
        <div className={`control-panel mobile ${isMobileOpen ? 'open' : ''}`}>
          <PanelContent
            currentStyle={currentStyle}
            detailIntensity={detailIntensity}
            modelLoaded={modelLoaded}
            isLoading={isLoading}
            isExporting={isExporting}
            showSaveMessage={showSaveMessage}
            sliderPressed={sliderPressed}
            fileInputRef={fileInputRef}
            setSliderPressed={setSliderPressed}
            handleFileSelect={handleFileSelect}
            setStyle={setStyle}
            setDetailIntensity={setDetailIntensity}
            handleExport={handleExport}
            STYLES={STYLES}
          />
        </div>
      </>
    );
  }

  return (
    <div className="control-panel">
      <PanelContent
        currentStyle={currentStyle}
        detailIntensity={detailIntensity}
        modelLoaded={modelLoaded}
        isLoading={isLoading}
        isExporting={isExporting}
        showSaveMessage={showSaveMessage}
        sliderPressed={sliderPressed}
        fileInputRef={fileInputRef}
        setSliderPressed={setSliderPressed}
        handleFileSelect={handleFileSelect}
        setStyle={setStyle}
        setDetailIntensity={setDetailIntensity}
        handleExport={handleExport}
        STYLES={STYLES}
      />
    </div>
  );
}

interface PanelContentProps {
  currentStyle: StyleType;
  detailIntensity: number;
  modelLoaded: boolean;
  isLoading: boolean;
  isExporting: boolean;
  showSaveMessage: boolean;
  sliderPressed: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setSliderPressed: (v: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setStyle: (s: StyleType) => void;
  setDetailIntensity: (v: number) => void;
  handleExport: () => void;
  STYLES: typeof STYLES_;
}

type STYLES_ = typeof STYLES;

function PanelContent({
  currentStyle,
  detailIntensity,
  modelLoaded,
  isLoading,
  isExporting,
  showSaveMessage,
  sliderPressed,
  fileInputRef,
  setSliderPressed,
  handleFileSelect,
  setStyle,
  setDetailIntensity,
  handleExport,
  STYLES,
}: PanelContentProps) {
  return (
    <div className="panel-inner">
      <div className="panel-title">
        <span className="title-icon">◆</span>
        STYLE VIEWER
      </div>

      <div className="panel-section">
        <label className="section-label">上传模型</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".obj,.gltf,.glb"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload size={16} />
          <span>{isLoading ? '加载中...' : '选择文件'}</span>
        </button>
        <div className="file-hint">支持 .obj / .gltf / .glb</div>
      </div>

      <div className="panel-section">
        <label className="section-label">渲染风格</label>
        <div className="style-buttons">
          {STYLES.map((s) => (
            <button
              key={s.key}
              className={`style-btn ${currentStyle === s.key ? 'active' : ''}`}
              onClick={() => setStyle(s.key)}
              style={{
                '--glow-color': s.color,
              } as React.CSSProperties}
            >
              <span
                className="style-color-block"
                style={{ background: s.gradient }}
              />
              <span className="style-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <label className="section-label">
          细节强度 <span className="detail-value">{detailIntensity}</span>
        </label>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={detailIntensity}
            onChange={(e) => setDetailIntensity(Number(e.target.value))}
            onMouseDown={() => setSliderPressed(true)}
            onMouseUp={() => setSliderPressed(false)}
            onTouchStart={() => setSliderPressed(true)}
            onTouchEnd={() => setSliderPressed(false)}
            className="detail-slider"
          />
          <div
            className="slider-thumb"
            style={{
              left: `${detailIntensity}%`,
              transform: sliderPressed ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        </div>
      </div>

      <div className="panel-section">
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={!modelLoaded || isExporting}
        >
          <Download size={16} />
          <span>{isExporting ? '导出中...' : '导出截图'}</span>
        </button>
        <div className="export-hint">1920 × 1080 PNG</div>
      </div>

      {showSaveMessage && (
        <div className="save-message">✓ 已保存</div>
      )}
    </div>
  );
}
