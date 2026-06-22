import React, { useState, useMemo } from 'react';
import type { WatermarkParams, DocumentMeta } from './watermark/WatermarkEngine';
import { WatermarkEngine } from './watermark/WatermarkEngine';
import MetadataCard from './copyright/MetadataCard';

const SAMPLE_CONTENT = `随着数字化时代的深入发展，文档安全和知识产权保护越来越受到重视。在企业内部文档流转、学术研究成果发布、以及个人作品传播等场景中，水印技术扮演着不可或缺的角色。

本文档旨在演示水印生成器的实际应用效果。通过在文档背景中叠加半透明的水印文字，可以有效标识文档的归属和机密等级，防止未经授权的复制和传播。水印技术既不会影响文档的正常阅读，又能在视觉上形成持续的版权提示。

我们的水印生成器支持多种自定义参数，包括水印文字内容、透明度、旋转角度、重复间距以及字体样式。所有参数调节都支持实时预览，用户可以直观地看到效果变化，找到最适合自己文档的水印配置方案。

在实际应用中，建议根据文档的涉密程度选择合适的水印参数。对于高度机密的文档，可以使用较低的透明度和较小的间距，使水印更加密集明显；对于一般的版权声明类文档，可以使用较高的透明度和较大的间距，在保护版权的同时保持文档的美观性。

此外，本工具还支持一键导出带水印的HTML文件，方便用户将加水印后的文档分享给他人或存档。导出的文件中包含完整的文档内容、水印覆盖层以及版权信息摘要，确保文档在任何设备上都能正确显示水印效果。

我们相信，通过合理使用水印技术，可以在信息流通和版权保护之间找到平衡点。既保障了信息的有效传播，又维护了创作者和所有者的合法权益。希望本工具能够为您的文档保护工作带来便利。`;

const FONT_OPTIONS = [
  { label: 'Inter (默认)', value: "'Inter', sans-serif" },
  { label: '宋体 SimSun', value: "'SimSun', '宋体', serif" },
  { label: '黑体 SimHei', value: "'SimHei', '黑体', sans-serif" },
  { label: '微软雅黑', value: "'Microsoft YaHei', sans-serif" },
  { label: '楷体 KaiTi', value: "'KaiTi', '楷体', serif" },
  { label: 'Georgia', value: "Georgia, serif" },
];

const App: React.FC = () => {
  const [watermarkParams, setWatermarkParams] = useState<WatermarkParams>({
    text: '机密',
    opacity: 0.15,
    angle: 45,
    spacing: 80,
    fontFamily: "'Inter', sans-serif",
    fontSize: 18,
    color: '#6B7280',
  });

  const [documentMeta] = useState<DocumentMeta>({
    title: '企业内部技术白皮书',
    author: '张三',
    createdAt: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  const [documentContent] = useState(SAMPLE_CONTENT);

  const watermarkStyle = useMemo(() => {
    return WatermarkEngine.generateWatermarkStyle(watermarkParams);
  }, [watermarkParams]);

  const documentHtml = useMemo(() => {
    return WatermarkEngine.generateDocumentHtml(documentContent, documentMeta);
  }, [documentContent, documentMeta]);

  const updateParam = <K extends keyof WatermarkParams>(
    key: K,
    value: WatermarkParams[K]
  ) => {
    setWatermarkParams(prev => ({ ...prev, [key]: value }));
  };

  const pageContainerStyle: React.CSSProperties = {
    minHeight: '100vh',
    padding: '40px 340px 40px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const documentWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: 800,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
    minHeight: 1000,
    backgroundColor: '#fff',
    transition: 'all 0.3s ease-in-out',
  };

  const watermarkOverlayStyle: React.CSSProperties = {
    backgroundImage: '',
    backgroundRepeat: 'repeat',
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    transition: 'all 0.3s ease-in-out',
  };

  return (
    <>
      <style>{`
        .wm-panel input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(90deg, #6366F1 var(--progress, 50%), #E5E7EB var(--progress, 50%));
          outline: none;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
        }
        .wm-panel input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          transition: all 0.2s ease-in-out;
        }
        .wm-panel input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.6);
        }
        .wm-panel input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          transition: all 0.2s ease-in-out;
        }
        .wm-panel input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.6);
        }
        .wm-text-input:focus {
          outline: none;
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .wm-font-select:focus {
          outline: none;
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
      `}</style>
      <div style={pageContainerStyle}>
        <div style={{ width: '100%', maxWidth: 800, marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            文档水印与版权声明生成器
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            调节右侧参数，实时预览水印效果，一键导出带水印的文档
          </p>
        </div>

        <div style={documentWrapperStyle}>
          <div dangerouslySetInnerHTML={{ __html: documentHtml }} />
          <div style={{
            ...watermarkOverlayStyle,
            ...parseWatermarkStyle(watermarkStyle),
          }} />
        </div>

        <MetadataCard
          meta={documentMeta}
          watermarkParams={watermarkParams}
          documentContent={documentContent}
        />
      </div>

      <WatermarkPanel
        params={watermarkParams}
        onUpdate={updateParam}
      />
    </>
  );
};

function parseWatermarkStyle(styleStr: string): React.CSSProperties {
  const result: Record<string, string> = {};
  const declarations = styleStr.split(';').map(s => s.trim()).filter(Boolean);
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx > 0) {
      const key = decl.slice(0, colonIdx).trim();
      const value = decl.slice(colonIdx + 1).trim().replace(/^url\("(.*)"\)$/, 'url($1)');
      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      result[camelKey] = value;
    }
  }
  return result as React.CSSProperties;
}

interface WatermarkPanelProps {
  params: WatermarkParams;
  onUpdate: <K extends keyof WatermarkParams>(key: K, value: WatermarkParams[K]) => void;
}

const WatermarkPanel: React.FC<WatermarkPanelProps> = ({ params, onUpdate }) => {
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 280,
    borderRadius: 16,
    padding: 24,
    background: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255,255,255,0.4)',
    zIndex: 100,
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 20,
  };

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  };

  const valueBadgeStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#6366F1',
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '2px 10px',
    borderRadius: 20,
    transition: 'all 0.3s ease-in-out',
  };

  const textInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: params.fontFamily,
    transition: 'all 0.3s ease-in-out',
    background: 'rgba(255,255,255,0.8)',
  };

  const fontSelectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
  };

  const calcProgress = (min: number, max: number, val: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  return (
    <div className="wm-panel" style={panelStyle}>
      <div style={{
        fontSize: 16,
        fontWeight: 700,
        color: '#1F2937',
        marginBottom: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span>🎛️</span>
        水印调节面板
      </div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
        拖动滑块实时预览效果
      </div>

      <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '12px 0' }} />

      <div style={sectionTitleStyle}>水印文字</div>
      <input
        type="text"
        className="wm-text-input"
        style={textInputStyle}
        value={params.text}
        onChange={e => onUpdate('text', e.target.value)}
        placeholder="请输入水印文字"
        maxLength={20}
      />

      <div style={{ ...sectionTitleStyle, marginTop: 20 }}>透明度</div>
      <div style={labelRowStyle}>
        <span style={labelStyle}>不透明度</span>
        <span style={valueBadgeStyle}>{(params.opacity * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={5}
        max={30}
        step={1}
        value={Math.round(params.opacity * 100)}
        onChange={e => onUpdate('opacity', parseInt(e.target.value) / 100)}
        style={{ ['--progress' as any]: `${calcProgress(5, 30, params.opacity * 100)}%` }}
      />

      <div style={sectionTitleStyle}>旋转角度</div>
      <div style={labelRowStyle}>
        <span style={labelStyle}>倾斜角度</span>
        <span style={valueBadgeStyle}>{params.angle}°</span>
      </div>
      <input
        type="range"
        min={0}
        max={90}
        step={1}
        value={params.angle}
        onChange={e => onUpdate('angle', parseInt(e.target.value))}
        style={{ ['--progress' as any]: `${calcProgress(0, 90, params.angle)}%` }}
      />

      <div style={sectionTitleStyle}>重复间距</div>
      <div style={labelRowStyle}>
        <span style={labelStyle}>水印间隔</span>
        <span style={valueBadgeStyle}>{params.spacing}px</span>
      </div>
      <input
        type="range"
        min={30}
        max={120}
        step={1}
        value={params.spacing}
        onChange={e => onUpdate('spacing', parseInt(e.target.value))}
        style={{ ['--progress' as any]: `${calcProgress(30, 120, params.spacing)}%` }}
      />

      <div style={sectionTitleStyle}>字体样式</div>
      <select
        className="wm-font-select"
        style={{
          ...fontSelectStyle,
          fontFamily: params.fontFamily,
        }}
        value={params.fontFamily}
        onChange={e => onUpdate('fontFamily', e.target.value)}
      >
        {FONT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
            {opt.label}
          </option>
        ))}
      </select>

      <div style={sectionTitleStyle}>文字大小</div>
      <div style={labelRowStyle}>
        <span style={labelStyle}>字号</span>
        <span style={valueBadgeStyle}>{params.fontSize}px</span>
      </div>
      <input
        type="range"
        min={12}
        max={36}
        step={1}
        value={params.fontSize}
        onChange={e => onUpdate('fontSize', parseInt(e.target.value))}
        style={{ ['--progress' as any]: `${calcProgress(12, 36, params.fontSize)}%` }}
      />

      <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '20px 0 12px' }} />
      <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>
        调节参数后，左侧文档区域会实时更新水印效果
      </div>
    </div>
  );
};

export default App;
