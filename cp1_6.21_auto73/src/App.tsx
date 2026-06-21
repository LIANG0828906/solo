import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { CanvasEditor } from './components/CanvasEditor';
import { LayerPanel } from './components/LayerPanel';
import { convertToVector, exportDesign } from './api';
import { SvgLayer, AnchorPoint, ExportOptions } from './types';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [layers, setLayers] = useState<SvgLayer[]>([]);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [fineness, setFineness] = useState(5);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'svg',
    selectedLayerIds: [],
    bgColor: '#FFFFFF',
  });

  const handleUpload = useCallback((image: string) => {
    setUploadedImage(image);
    setLayers([]);
    setSelectedLayerIds([]);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!uploadedImage) return;
    setIsConverting(true);
    try {
      const result = await convertToVector(uploadedImage, fineness);
      const enrichedLayers: SvgLayer[] = result.paths.map(p => ({
        ...p,
        visible: true,
      }));
      setLayers(enrichedLayers);
      setSelectedLayerIds([]);
    } catch (error) {
      console.error('转绘失败:', error);
      alert('转绘失败，请重试');
    } finally {
      setIsConverting(false);
    }
  }, [uploadedImage, fineness]);

  const handleAnchorMove = useCallback((layerId: string, anchorIndex: number, newPos: AnchorPoint) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id !== layerId) return layer;
      const newAnchors = [...layer.anchors];
      newAnchors[anchorIndex] = newPos;
      return { ...layer, anchors: newAnchors };
    }));
  }, []);

  const handlePathUpdate = useCallback((layerId: string, newD: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, d: newD } : layer
    ));
  }, []);

  const handleToggleVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  const handleDeleteLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(l => l.id !== layerId));
    setSelectedLayerIds(prev => prev.filter(id => id !== layerId));
  }, []);

  const handleSelectLayer = useCallback((layerId: string, multi: boolean) => {
    setSelectedLayerIds(prev => {
      if (multi) {
        return prev.includes(layerId)
          ? prev.filter(id => id !== layerId)
          : [...prev, layerId];
      }
      return [layerId];
    });
  }, []);

  const handleMergeLayers = useCallback(() => {
    if (selectedLayerIds.length < 2) return;

    setLayers(prev => {
      const layersToMerge = prev.filter(l => selectedLayerIds.includes(l.id));
      if (layersToMerge.length < 2) return prev;

      const mergedD = layersToMerge.map(l => l.d).join(' ');
      const mergedAnchors = layersToMerge.flatMap(l => l.anchors);
      const mergedStrokes = layersToMerge.map(l => l.stroke);

      const mergedLayer: SvgLayer = {
        id: `merged-${Date.now()}`,
        d: mergedD,
        type: layersToMerge[0].type,
        name: `合并图层 (${layersToMerge.length})`,
        stroke: mergedStrokes[0],
        strokeWidth: Math.max(...layersToMerge.map(l => l.strokeWidth)),
        fill: 'none',
        anchors: mergedAnchors,
        visible: true,
      };

      const remaining = prev.filter(l => !selectedLayerIds.includes(l.id));
      return [mergedLayer, ...remaining];
    });

    setSelectedLayerIds([]);
  }, [selectedLayerIds]);

  const handleReorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const newLayers = [...prev];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      return newLayers;
    });
  }, []);

  const handleOpenExport = useCallback(() => {
    setExportOptions({
      format: 'svg',
      selectedLayerIds: layers.map(l => l.id),
      bgColor: '#FFFFFF',
    });
    setExportModalOpen(true);
  }, [layers]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportDesign(exportOptions.selectedLayerIds, exportOptions.format);

      const exportLayers = layers.filter(l => exportOptions.selectedLayerIds.includes(l.id));

      if (exportOptions.format === 'svg') {
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <g>
${exportLayers.map(l => `    <path d="${l.d}" stroke="${l.stroke}" stroke-width="${l.strokeWidth}" fill="${l.fill}" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')}
  </g>
</svg>`;
        downloadFile(svgContent, 'design.svg', 'image/svg+xml');
      } else if (exportOptions.format === 'json') {
        const jsonContent = JSON.stringify({
          version: '1.0',
          exportDate: new Date().toISOString(),
          backgroundColor: exportOptions.bgColor,
          layers: exportLayers.map(l => ({
            id: l.id,
            name: l.name,
            type: l.type,
            d: l.d,
            stroke: l.stroke,
            strokeWidth: l.strokeWidth,
            fill: l.fill,
            anchors: l.anchors,
          })),
        }, null, 2);
        downloadFile(jsonContent, 'design.json', 'application/json');
      } else if (exportOptions.format === 'png') {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = exportOptions.bgColor;
          ctx.fillRect(0, 0, 800, 600);
          const svgData = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <g>
${exportLayers.map(l => `    <path d="${l.d}" stroke="${l.stroke}" stroke-width="${l.strokeWidth}" fill="${l.fill}" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n')}
  </g>
</svg>`;
          const img = new Image();
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            canvas.toBlob((pngBlob) => {
              if (pngBlob) {
                const pngUrl = URL.createObjectURL(pngBlob);
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'design.png';
                a.click();
                URL.revokeObjectURL(pngUrl);
              }
            }, 'image/png');
          };
          img.src = url;
        }
      }

      setTimeout(() => {
        setIsExporting(false);
        setExportModalOpen(false);
      }, 500);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
      setIsExporting(false);
    }
  }, [exportOptions, layers]);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExportLayer = (layerId: string) => {
    setExportOptions(prev => ({
      ...prev,
      selectedLayerIds: prev.selectedLayerIds.includes(layerId)
        ? prev.selectedLayerIds.filter(id => id !== layerId)
        : [...prev.selectedLayerIds, layerId],
    }));
  };

  return (
    <div className="main-layout">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">✎</div>
          <span>Sketch to Vector</span>
        </div>
      </header>
      <div className="content-area">
        <div className="left-panel">
          <ImageUploader onUpload={handleUpload} currentImage={uploadedImage} />

          <div className="controls-section">
            <h2>转绘设置</h2>
            <div className="slider-container">
              <div className="slider-label">
                <span>线稿精细度</span>
                <span>{fineness}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={fineness}
                onChange={(e) => setFineness(Number(e.target.value))}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handleConvert}
              disabled={!uploadedImage || isConverting}
            >
              {isConverting ? (
                <>
                  <div className="spinner"></div>
                  <span>转绘中...</span>
                </>
              ) : (
                <>
                  <span>🎯</span>
                  <span>开始转绘</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="center-panel">
          <CanvasEditor
            layers={layers}
            onAnchorMove={handleAnchorMove}
            onPathUpdate={handlePathUpdate}
          />
        </div>

        <div className="right-panel">
          <LayerPanel
            layers={layers}
            selectedLayerIds={selectedLayerIds}
            onToggleVisibility={handleToggleVisibility}
            onDelete={handleDeleteLayer}
            onSelect={handleSelectLayer}
            onMerge={handleMergeLayers}
            onReorder={handleReorderLayers}
            onToggleExport={handleOpenExport}
          />
        </div>
      </div>

      {exportModalOpen && (
        <div className="export-modal" onClick={() => !isExporting && setExportModalOpen(false)}>
          <div className="export-modal-content" onClick={e => e.stopPropagation()}>
            <div className="export-title">导出设置</div>

            <div className="format-group">
              <h3>导出格式</h3>
              {(['svg', 'png', 'json'] as const).map(format => (
                <div
                  key={format}
                  className={`format-option ${exportOptions.format === format ? 'selected' : ''}`}
                  onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                >
                  <input
                    type="radio"
                    name="format"
                    checked={exportOptions.format === format}
                    onChange={() => {}}
                  />
                  <span className="format-label">{format.toUpperCase()}</span>
                  <span className="format-desc">
                    {format === 'svg' && '矢量图形，可无限缩放'}
                    {format === 'png' && '位图图像，支持背景色'}
                    {format === 'json' && '元数据，含锚点坐标'}
                  </span>
                </div>
              ))}
            </div>

            {exportOptions.format === 'png' && (
              <div className="color-picker-group">
                <label>背景色：</label>
                <input
                  type="color"
                  value={exportOptions.bgColor}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, bgColor: e.target.value }))}
                />
                <span style={{ fontSize: '13px', color: '#666' }}>{exportOptions.bgColor}</span>
              </div>
            )}

            {exportOptions.format === 'svg' && (
              <div className="layer-selection">
                <h3>选择图层</h3>
                {layers.map(layer => (
                  <div
                    key={layer.id}
                    className="layer-checkbox"
                    onClick={() => toggleExportLayer(layer.id)}
                  >
                    <input
                      type="checkbox"
                      checked={exportOptions.selectedLayerIds.includes(layer.id)}
                      onChange={() => {}}
                    />
                    <span style={{ fontSize: '14px' }}>{layer.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="export-actions">
              <button
                className="btn-secondary"
                onClick={() => setExportModalOpen(false)}
                disabled={isExporting}
              >
                取消
              </button>
              <button
                className={`btn-export ${isExporting ? 'downloading' : ''}`}
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <span>⬇️</span>
                    <span>下载中...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>确认导出</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
