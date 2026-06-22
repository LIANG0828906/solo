import React, { useRef } from 'react';
import { saveAs } from 'file-saver';
import { useStore } from '../store';
import { BUILDING_MODELS, LightMode } from '../types';
import { Save, Download, Trash2, Upload, FolderOpen } from 'lucide-react';

declare global {
  interface Window {
    __getSceneSnapshot?: () => string | null;
    __getCameraPosition?: () => [number, number, number];
  }
}

const panelStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(8px)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '20px 16px',
  overflowY: 'auto',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#B0A8C0',
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const buttonBase: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#E0E0E0',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontFamily: "'system-ui', sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '120px',
  background: '#F5F0E8',
  borderRadius: '8px',
  padding: '12px',
  boxSizing: 'border-box',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  color: '#333333',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const LightModeShort: Record<LightMode, string> = {
  sunny: '晴天',
  cloudy: '阴天',
  dusk: '黄昏',
  indoor: '室内',
};

function timestampFilename(name: string) {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${encodeURIComponent(name.replace(/\s+/g, '_'))}_${stamp}.png`;
}

export default function SavePanel() {
  const { schemes, saveScheme, loadScheme, deleteScheme } = useStore();
  const [schemeName, setSchemeName] = React.useState('');
  const [hoverId, setHoverId] = React.useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const cam = window.__getCameraPosition?.();
    if (!cam) {
      alert('场景未就绪，无法获取当前视角');
      return;
    }
    const name = schemeName.trim() || `方案 ${schemes.length + 1}`;
    saveScheme(name, cam);
    setSchemeName('');
  };

  const handleExport = () => {
    const dataUrl = window.__getSceneSnapshot?.();
    if (!dataUrl) {
      alert('场景未就绪，无法导出截图');
      return;
    }
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const name = schemeName.trim() || '光照方案';
        saveAs(blob, timestampFilename(name));
      });
  };

  const handleLoad = (id: string) => {
    loadScheme(id);
  };

  return (
    <div style={panelStyle}>
      <div>
        <div style={{ ...sectionTitleStyle, fontSize: '15px', color: '#E0E0E0', letterSpacing: '0' }}>
          方案管理
        </div>
        <div style={{ fontSize: '12px', color: '#807890', marginTop: '4px' }}>
          保存视角与光照，导出截图报告
        </div>
      </div>

      <section>
        <div style={sectionTitleStyle}>保存方案</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            ref={inputRef}
            value={schemeName}
            onChange={(e) => setSchemeName(e.target.value)}
            placeholder="输入方案名称（可选）"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '9px 11px',
              color: '#E0E0E0',
              fontSize: '12px',
              outline: 'none',
              fontFamily: "'system-ui', sans-serif",
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button style={buttonBase} onClick={handleSave} title="保存当前配置">
              <Save size={14} />
              <span>保存</span>
            </button>
            <button style={buttonBase} onClick={handleExport} title="导出当前画布PNG">
              <Download size={14} />
              <span>导出</span>
            </button>
          </div>
        </div>
      </section>

      <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={sectionTitleStyle}>
          已保存方案 ({schemes.length})
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
            paddingRight: '4px',
            flex: 1,
            minHeight: 0,
          }}
        >
          {schemes.length === 0 && (
            <div
              style={{
                padding: '20px 10px',
                textAlign: 'center',
                color: '#605870',
                fontSize: '12px',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
            >
              <FolderOpen size={24} style={{ opacity: 0.4, marginBottom: '6px' }} />
              <div>暂无保存的方案</div>
              <div style={{ marginTop: '4px', fontSize: '11px' }}>调整后点击"保存"即可创建</div>
            </div>
          )}
          {schemes.map((s) => {
            const model = BUILDING_MODELS.find((m) => m.id === s.modelId);
            const isHover = hoverId === s.id;
            return (
              <div
                key={s.id}
                style={{
                  ...cardStyle,
                  transform: isHover ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHover
                    ? '0 4px 12px rgba(0,0,0,0.15)'
                    : '0 2px 6px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div
                    onClick={() => handleLoad(s.id)}
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#1A1A2E',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                    title="点击加载"
                  >
                    {s.name}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定删除方案「${s.name}」？`)) {
                        deleteScheme(s.id);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#888',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      opacity: isHover ? 1 : 0.5,
                      transition: 'all 0.2s',
                    }}
                    title="删除方案"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#555',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '2px 8px',
                    marginTop: 'auto',
                    paddingTop: '6px',
                  }}
                >
                  <span style={{ color: '#888' }}>模型</span>
                  <span>{model?.name}</span>
                  <span style={{ color: '#888' }}>光照</span>
                  <span>
                    {LightModeShort[s.lightConfig.mode]}·{Math.round(s.lightConfig.sunAzimuth)}°
                  </span>
                  <span style={{ color: '#888' }}>采光点</span>
                  <span>{s.analysisPoints.length} 个</span>
                  <span style={{ color: '#888' }}>时间</span>
                  <span>{formatDate(s.timestamp)}</span>
                </div>
                <button
                  onClick={() => handleLoad(s.id)}
                  style={{
                    marginTop: '6px',
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid rgba(26, 26, 46, 0.15)',
                    background: 'rgba(142,45,226,0.1)',
                    color: '#4A00E0',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Upload size={12} />
                  <span>加载此方案</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
