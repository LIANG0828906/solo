import React, { useCallback, useRef, useState, useMemo } from 'react';
import { useStore, MaterialType } from '@/store/useStore';
import { processImage, getProcessedDimensions } from '@/modules/imageProcessor/processor';
import {
  exportToGLB,
  downloadGLB,
  buildShareUrl,
  copyToClipboard,
} from '@/modules/sceneRenderer/export';

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 300,
    minWidth: 300,
    background: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    overflowY: 'auto',
    boxShadow: '0 0 24px rgba(0, 212, 255, 0.08), inset 0 0 0 1px #00D4FF22',
    transition: 'box-shadow 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 4px 12px 4px',
    borderBottom: '1px solid #00D4FF22',
  },
  title: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 1.5,
    background: 'linear-gradient(90deg, #00D4FF, #00FF88)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#6A6A7A',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
  card: {
    background: '#2D2D2D',
    borderRadius: 10,
    padding: 14,
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  },
  cardTitle: {
    color: '#C0C0D0',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleIcon: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#00D4FF',
    boxShadow: '0 0 6px #00D4FF',
  },
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#A0A0B0',
    fontSize: 12,
    marginBottom: 8,
  },
  valueBadge: {
    background: 'rgba(0, 212, 255, 0.12)',
    border: '1px solid #00D4FF44',
    color: '#00D4FF',
    fontFamily: 'monospace',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
  },
  slider: {
    width: '100%',
    height: 6,
    background: '#1A1A2E',
    borderRadius: 3,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    transition: 'filter 0.2s ease',
  },
  buttonBase: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.5,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  select: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid #3A3A4A',
    background: '#1A1A2E',
    color: '#E0E0E0',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  uploadArea: {
    border: '2px dashed #00D4FF44',
    borderRadius: 10,
    padding: 20,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#1A1A2E55',
  },
  previewImg: {
    width: '100%',
    height: 90,
    objectFit: 'cover',
    borderRadius: 8,
    border: '1px solid #00D4FF33',
    marginBottom: 10,
  },
  progressWrap: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  ring: {
    width: 20,
    height: 20,
    border: '2px solid transparent',
    borderTop: '2px solid #00D4FF',
    borderRight: '2px solid #00FF88',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  progressBar: {
    flex: 1,
    height: 4,
    background: '#1A1A2E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00D4FF, #00FF88)',
    transition: 'width 0.15s linear',
    boxShadow: '0 0 8px #00D4FF',
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
  },
  smallBtn: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #3A3A4A',
    background: '#1A1A2E',
    color: '#C0C0D0',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  toast: {
    position: 'fixed',
    bottom: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    borderRadius: 8,
    background: 'rgba(0, 255, 136, 0.9)',
    color: '#0F0F1E',
    fontSize: 13,
    fontWeight: 600,
    zIndex: 9999,
    boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)',
    animation: 'fadeInUp 0.3s ease',
  },
  spinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 15, 30, 0.85)',
    zIndex: 10,
    borderRadius: 12,
  },
  spinnerRing: {
    width: 60,
    height: 60,
    border: '3px solid transparent',
    borderTop: '3px solid #00D4FF',
    borderRight: '3px solid #00FF88',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
};

const materialOptions: { value: MaterialType; label: string; desc: string }[] = [
  { value: 'matte', label: '哑光', desc: '柔和细腻' },
  { value: 'metal', label: '磨砂金属', desc: '冷硬质感' },
  { value: 'glass', label: '光滑玻璃', desc: '清透明亮' },
];

function useHover() {
  const [hover, setHover] = useState(false);
  return {
    hover,
    bind: {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
    },
  };
}

const ControlPanel: React.FC = () => {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const {
    bind: bumpBind,
    hover: bumpHover,
  } = useHover();
  const {
    bind: lightXBind,
    hover: lightXHover,
  } = useHover();
  const {
    bind: lightYBind,
    hover: lightYHover,
  } = useHover();
  const {
    bind: matBind,
    hover: matHover,
  } = useHover();
  const {
    bind: resetBind,
    hover: resetHover,
  } = useHover();
  const {
    bind: exportBind,
    hover: exportHover,
  } = useHover();
  const {
    bind: uploadBind,
    hover: uploadHover,
  } = useHover();
  const {
    bind: shareBind,
    hover: shareHover,
  } = useHover();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件');
        return;
      }
      store.setProcessing(true, 0);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setPreviewSrc(dataUrl);
        const img = new Image();
        img.onload = async () => {
          try {
            const dims = getProcessedDimensions(img);
            const canvas = document.createElement('canvas');
            canvas.width = dims.width;
            canvas.height = dims.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
            ctx.drawImage(img, 0, 0, dims.width, dims.height);
            const imgData = ctx.getImageData(0, 0, dims.width, dims.height);
            store.setImageData(imgData, dims.width, dims.height);

            const depthMap = await processImage(img, {
              onProgress: (p) => store.setProcessing(true, p),
            });

            store.setDepthMap(depthMap, dims.width, dims.height);
            store.setProcessing(false, 1);
            showToast('浮雕生成完成 ✨');
          } catch (e) {
            console.error(e);
            store.setProcessing(false, 0);
            showToast('处理失败：' + (e instanceof Error ? e.message : '未知错误'));
          }
        };
        img.onerror = () => {
          store.setProcessing(false, 0);
          showToast('图片加载失败');
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        store.setProcessing(false, 0);
        showToast('文件读取失败');
      };
      reader.readAsDataURL(file);
    },
    [store, showToast]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      if (fileRef.current) fileRef.current.value = '';
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onExport = useCallback(async () => {
    if (!store.depthMap || store.depthMap.length === 0) {
      showToast('请先上传图片生成浮雕');
      return;
    }
    try {
      setExporting(true);
      const glb = await exportToGLB(
        store.depthMap,
        store.depthWidth,
        store.depthHeight,
        store.bumpStrength,
        store.material
      );
      downloadGLB(glb);
      showToast('GLB 模型已导出 ✓');
    } catch (e) {
      console.error(e);
      showToast('导出失败：' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setExporting(false);
    }
  }, [store, showToast]);

  const onShare = useCallback(async () => {
    if (!store.depthMap) {
      showToast('请先上传图片再分享配置');
      return;
    }
    const url = buildShareUrl({
      depth: store.bumpStrength,
      lightX: store.lightX,
      lightY: store.lightY,
      material: store.material,
    });
    try {
      await copyToClipboard(url);
      showToast('分享链接已复制 ✓');
    } catch {
      prompt('复制以下链接分享：', url);
    }
  }, [store, showToast]);

  const progressPct = useMemo(() => Math.round(store.processingProgress * 100), [store.processingProgress]);

  const cssInject = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00D4FF, #0088FF);
      box-shadow: 0 0 8px #00D4FF;
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }
    input[type="range"]::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00D4FF, #0088FF);
      border: none;
      box-shadow: 0 0 8px #00D4FF;
      cursor: pointer;
    }
    select option { background: #1A1A2E; color: #E0E0E0; }
  `;

  return (
    <>
      <style>{cssInject}</style>
      <div
        style={{
          ...styles.panel,
          position: 'relative',
        }}
      >
        {exporting && (
          <div style={styles.spinner}>
            <div style={styles.spinnerRing} />
          </div>
        )}

        <div style={styles.header}>
          <div>
            <div style={styles.title}>光影雕刻师</div>
            <div style={styles.subtitle}>LIGHT · SHADOW · SCULPTOR</div>
          </div>
        </div>

        {/* Upload */}
        <div style={{
          ...styles.card,
          boxShadow: uploadHover ? '0 0 12px #00D4FF33' : 'none',
        }}>
          <div style={styles.cardTitle}>
            <span style={styles.cardTitleIcon} />
            图片上传
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
          {previewSrc && (
            <img
              src={previewSrc}
              alt="preview"
              style={styles.previewImg}
              onClick={() => fileRef.current?.click()}
            />
          )}
          <div
            {...uploadBind}
            style={{
              ...styles.uploadArea,
              borderColor: uploadHover ? '#00D4FF' : '#00D4FF44',
              background: uploadHover ? 'rgba(0, 212, 255, 0.08)' : '#1A1A2E55',
              boxShadow: uploadHover ? 'inset 0 0 12px rgba(0, 212, 255, 0.15)' : 'none',
            }}
            onClick={() => fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
            <div style={{ color: '#A0A0B0', fontSize: 12 }}>
              {previewSrc ? '点击或拖拽更换图片' : '点击或拖拽上传图片'}
            </div>
            <div style={{ color: '#6A6A7A', fontSize: 10, marginTop: 4 }}>
              最大 1920×1080，自动缩放至 800×600
            </div>
          </div>

          {store.isProcessing && (
            <div style={styles.progressWrap}>
              <div style={styles.ring} />
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
              </div>
              <span
                style={{
                  color: '#00D4FF',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {progressPct}%
              </span>
            </div>
          )}
        </div>

        {/* Bump */}
        <div style={{
          ...styles.card,
          boxShadow: bumpHover ? '0 0 12px #00D4FF22' : 'none',
        }}>
          <div {...bumpBind} style={styles.cardTitle}>
            <span style={styles.cardTitleIcon} />
            浮雕参数
          </div>
          <div style={styles.label}>
            <span>凹凸强度</span>
            <span style={styles.valueBadge}>{store.bumpStrength.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={store.bumpStrength}
            onChange={(e) => store.setBumpStrength(parseFloat(e.target.value))}
            style={{
              ...styles.slider,
              filter: bumpHover ? 'brightness(1.2)' : 'none',
            }}
          />
        </div>

        {/* Light */}
        <div style={{
          ...styles.card,
          boxShadow: lightXHover || lightYHover ? '0 0 12px #00FF8822' : 'none',
        }}>
          <div style={styles.cardTitle}>
            <span style={{ ...styles.cardTitleIcon, background: '#00FF88', boxShadow: '0 0 6px #00FF88' }} />
            光照方向
          </div>
          <div {...lightXBind} style={{ marginBottom: 14 }}>
            <div style={styles.label}>
              <span>水平 X</span>
              <span style={styles.valueBadge}>{store.lightX.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={store.lightX}
              onChange={(e) => store.setLightX(parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>
          <div {...lightYBind}>
            <div style={styles.label}>
              <span>垂直 Y</span>
              <span style={styles.valueBadge}>{store.lightY.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={store.lightY}
              onChange={(e) => store.setLightY(parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>

        {/* Material */}
        <div {...matBind} style={{
          ...styles.card,
          boxShadow: matHover ? '0 0 12px #FFAA0022' : 'none',
        }}>
          <div style={styles.cardTitle}>
            <span style={{ ...styles.cardTitleIcon, background: '#FFAA00', boxShadow: '0 0 6px #FFAA00' }} />
            材质质感
          </div>
          <select
            value={store.material}
            onChange={(e) => store.setMaterial(e.target.value as MaterialType)}
            style={{
              ...styles.select,
              borderColor: matHover ? '#00D4FF' : '#3A3A4A',
              boxShadow: matHover ? '0 0 8px #00D4FF33' : 'none',
            }}
          >
            {materialOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} · {o.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div style={styles.buttonRow}>
          <button
            {...resetBind}
            onClick={() => store.resetAll()}
            style={{
              ...styles.buttonBase,
              background: resetHover ? '#5AA0E9' : '#4A90D9',
              boxShadow: resetHover ? '0 0 12px #4A90D966' : 'none',
            }}
          >
            ↺ 重置
          </button>
          <button
            {...shareBind}
            onClick={onShare}
            style={{
              ...styles.buttonBase,
              background: shareHover
                ? 'linear-gradient(90deg, #1AECBA, #00CF91)'
                : 'linear-gradient(90deg, #10B981, #059669)',
              boxShadow: shareHover ? '0 0 12px #10B98166' : 'none',
            }}
          >
            🔗 分享
          </button>
        </div>

        <button
          {...exportBind}
          onClick={onExport}
          disabled={exporting}
          style={{
            ...styles.buttonBase,
            padding: '12px 16px',
            background: exportHover
              ? 'linear-gradient(90deg, #00D4FF, #0088FF)'
              : 'linear-gradient(90deg, #27AE60, #1E8449)',
            boxShadow: exportHover ? '0 0 14px #27AE6066' : 'none',
            opacity: exporting ? 0.7 : 1,
          }}
        >
          📦 导出 GLTF 模型
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ color: '#5A5A6A', fontSize: 10, textAlign: 'center', letterSpacing: 1 }}>
          拖拽场景旋转 · 滚轮缩放
        </div>
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}
    </>
  );
};

export default ControlPanel;
