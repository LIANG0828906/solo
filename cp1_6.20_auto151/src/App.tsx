import React, { useState, useCallback, useRef, useMemo } from 'react';
import UploadPanel from './UploadPanel';
import StyleSelector from './StyleSelector';
import PreviewPanel from './PreviewPanel';
import CompareView from './CompareView';
import type {
  MountStyle,
  MountParams,
  CropArea,
} from './types';
import { defaultMountParams } from './types';
import { exportSinglePreview, exportCompareView } from './utils/export';

const App: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalImage, setOriginalImage] =
    useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [currentStyle, setCurrentStyle] = useState<MountStyle>('scroll');
  const [params, setParams] = useState<MountParams>(defaultMountParams);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareModes, setCompareModes] = useState<MountStyle[]>([
    'scroll',
    'frame',
  ]);

  const [exporting, setExporting] = useState(false);

  const handleSetImage = useCallback(
    (url: string, img: HTMLImageElement) => {
      setImageUrl(url);
      setOriginalImage(img);
    },
    []
  );

  const handleSetCrop: (area: CropArea) => void = useCallback((area) => {
    setCropArea(area);
  }, []);

  const handleSetStyle: (style: MountStyle) => void = useCallback((style) => {
    setCurrentStyle(style);
  }, []);

  const handleSetParams = useCallback(
    <K extends keyof MountParams>(
      style: K,
      key: keyof MountParams[K],
      value: MountParams[K][keyof MountParams[K]]
    ) => {
      setParams((prev) => ({
        ...prev,
        [style]: {
          ...prev[style],
          [key]: value,
        },
      }));
    },
    []
  ) as <K extends keyof MountParams>(
    style: K,
    key: keyof MountParams[K],
    value: MountParams[K][keyof MountParams[K]]
  ) => void;

  const toggleCompareStyle: (style: MountStyle) => void = useCallback(
    (style) => {
      setCompareModes((prev) => {
        const exists = prev.includes(style);
        if (exists) {
          if (prev.length <= 2) return prev;
          return prev.filter((s) => s !== style);
        } else {
          if (prev.length >= 4) return prev;
          return [...prev, style];
        }
      });
    },
    []
  );

  const handleExport = () => {
    if (!originalImage || !cropArea) return;
    if (exporting) return;
    setExporting(true);

    setTimeout(() => {
      try {
        if (isCompareMode && compareModes.length >= 2) {
          exportCompareView(originalImage, cropArea, compareModes, params);
        } else {
          exportSinglePreview(originalImage, cropArea, currentStyle, params);
        }
      } finally {
        setTimeout(() => setExporting(false), 1050);
      }
    }, 100);
  };

  const canExport = !!originalImage && !!cropArea;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="app-nav">
        <div className="app-title">书 法 装 裱 工 坊</div>
        <button
          type="button"
          className="export-btn"
          onClick={handleExport}
          disabled={!canExport || exporting}
        >
          <span>{exporting ? '导出中...' : '💾 导出 PNG'}</span>
          {exporting && <div className="progress-bar" key="progress" />}
        </button>
      </nav>

      <main className="app-main">
        <div className="left-pane">
          <UploadPanel
            onSetImage={handleSetImage}
            onSetCrop={handleSetCrop}
            imageUrl={imageUrl}
            cropArea={cropArea}
          />
          <StyleSelector
            currentStyle={currentStyle}
            params={params}
            isCompareMode={isCompareMode}
            compareModes={compareModes}
            onSetStyle={handleSetStyle}
            onSetParams={handleSetParams}
            onToggleCompareStyle={toggleCompareStyle}
            onSetCompareMode={setIsCompareMode}
          />
        </div>

        <div className="right-pane">
          {isCompareMode && compareModes.length >= 2 ? (
            <CompareView
              originalImage={originalImage}
              cropArea={cropArea}
              styles={compareModes}
              params={params}
            />
          ) : (
            <PreviewPanel
              originalImage={originalImage}
              cropArea={cropArea}
              currentStyle={currentStyle}
              params={params}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
