import React, { useState, useRef, useCallback } from 'react';
import useTeaStore, { SCORE_KEYS, SCORE_LABELS, type Tea } from '@/stores/teaStore';
import TeaList from '@/components/TeaList';
import ScoreSlider from '@/components/ScoreSlider';
import RadarChart from '@/components/RadarChart';
import { exportToFile, importFromFile } from '@/utils/localStorage';
import {
  Plus,
  Download,
  Upload,
  Trash2,
  FileText,
  BarChart3,
  Radar,
  Image as ImageIcon,
} from 'lucide-react';

type TabId = 'info' | 'scores' | 'radar' | 'images';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'info', label: '基础信息', icon: <FileText size={15} /> },
  { id: 'scores', label: '品鉴评分', icon: <BarChart3 size={15} /> },
  { id: 'radar', label: '雷达图', icon: <Radar size={15} /> },
  { id: 'images', label: '图片库', icon: <ImageIcon size={15} /> },
];

const InfoTab: React.FC<{ tea: Tea }> = ({ tea }) => {
  const updateTea = useTeaStore((s) => s.updateTea);
  const deleteTea = useTeaStore((s) => s.deleteTea);

  const handleField = useCallback(
    (field: keyof Tea, value: string) => {
      updateTea(tea.id, { [field]: value });
    },
    [tea.id, updateTea]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 480 }}>
      <FieldInput label="名称" value={tea.name} onChange={(v) => handleField('name', v)} />
      <FieldInput label="产地" value={tea.origin} onChange={(v) => handleField('origin', v)} />
      <FieldInput label="年份" value={tea.year} onChange={(v) => handleField('year', v)} />
      <div>
        <label style={labelStyle}>备注</label>
        <textarea
          value={tea.notes}
          onChange={(e) => handleField('notes', e.target.value)}
          style={{
            ...inputStyle,
            minHeight: 100,
            resize: 'vertical',
            fontFamily: "'Noto Serif SC', serif",
          }}
        />
      </div>
      <button
        onClick={() => {
          if (window.confirm('确定要删除这款茶叶吗？')) deleteTea(tea.id);
        }}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 18px',
          border: '1px solid #CD853F',
          borderRadius: 8,
          backgroundColor: 'transparent',
          color: '#CD853F',
          cursor: 'pointer',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#CD853F';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#CD853F';
        }}
      >
        <Trash2 size={14} /> 删除此茶
      </button>
    </div>
  );
};

const ScoresTab: React.FC<{ tea: Tea }> = ({ tea }) => {
  const updateTea = useTeaStore((s) => s.updateTea);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {SCORE_KEYS.map((key) => (
        <ScoreSlider
          key={key}
          label={SCORE_LABELS[key]}
          value={tea[key]}
          onChange={(v) => updateTea(tea.id, { [key]: v })}
        />
      ))}
    </div>
  );
};

const ImagesTab: React.FC<{ tea: Tea }> = ({ tea }) => {
  const updateTea = useTeaStore((s) => s.updateTea);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const readers = Array.from(files).map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      );
      Promise.all(readers).then((results) => {
        updateTea(tea.id, { images: [...tea.images, ...results] });
      });
      e.target.value = '';
    },
    [tea.id, tea.images, updateTea]
  );

  const removeImage = useCallback(
    (index: number) => {
      const images = tea.images.filter((_, i) => i !== index);
      updateTea(tea.id, { images });
    },
    [tea.id, tea.images, updateTea]
  );

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: '1px dashed #D2B48C',
          backgroundColor: 'rgba(210,180,140,0.15)',
          color: '#8D6E63',
          cursor: 'pointer',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: 13,
          marginBottom: 16,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#6B8E23';
          e.currentTarget.style.color = '#6B8E23';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#D2B48C';
          e.currentTarget.style.color = '#8D6E63';
        }}
      >
        + 上传图片
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {tea.images.map((src, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              borderRadius: 8,
              overflow: 'hidden',
              aspectRatio: '1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <img
              src={src}
              alt={`茶叶图片 ${i + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <button
              onClick={() => removeImage(i)}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {tea.images.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#8D6E63',
            fontSize: 13,
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          暂无图片，点击上方按钮上传
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [tabKey, setTabKey] = useState(0);
  const selectedTeaId = useTeaStore((s) => s.selectedTeaId);
  const teas = useTeaStore((s) => s.teas);
  const addTea = useTeaStore((s) => s.addTea);
  const importTeas = useTeaStore((s) => s.importTeas);

  const selectedTea = teas.find((t) => t.id === selectedTeaId) || null;

  const switchTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setTabKey((k) => k + 1);
  }, []);

  const handleExport = useCallback(() => {
    exportToFile(teas);
  }, [teas]);

  const handleImport = useCallback(async () => {
    try {
      const data = (await importFromFile()) as { teas?: Tea[] } | Tea[];
      const imported = Array.isArray(data) ? data : data.teas || [];
      if (imported.length > 0) {
        importTeas(imported);
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  }, [importTeas]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#FFF8DC',
        fontFamily: "'Noto Serif SC', 'Playfair Display', Georgia, serif",
        overflow: 'hidden',
      }}
    >
      <div className="tea-list-desktop">
        <TeaList />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '16px 24px',
        }}
      >
        <div className="mobile-nav">
          <TeaList />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => addTea()} style={actionBtnStyle}>
              <Plus size={15} /> 添加新茶
            </button>
            <button onClick={handleExport} style={secondaryBtnStyle}>
              <Download size={14} /> 导出
            </button>
            <button onClick={handleImport} style={secondaryBtnStyle}>
              <Upload size={14} /> 导入
            </button>
          </div>
        </div>

        {selectedTea ? (
          <>
            <div
              style={{
                display: 'flex',
                gap: 4,
                borderBottom: '1px solid rgba(210,180,140,0.4)',
                marginBottom: 20,
                flexShrink: 0,
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  style={{
                    padding: '10px 18px',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #6B8E23' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: activeTab === tab.id ? '#6B8E23' : '#8D6E63',
                    cursor: 'pointer',
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 14,
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div
              key={tabKey}
              style={{
                flex: 1,
                overflowY: 'auto',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              {activeTab === 'info' && <InfoTab tea={selectedTea} />}
              {activeTab === 'scores' && <ScoresTab tea={selectedTea} />}
              {activeTab === 'radar' && <RadarChart tea={selectedTea} />}
              {activeTab === 'images' && <ImagesTab tea={selectedTea} />}
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8D6E63',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 48 }}>🍵</span>
            <span
              style={{
                fontSize: 16,
                fontFamily: "'Noto Serif SC', serif",
                letterSpacing: 2,
              }}
            >
              选择一款茶叶开始品鉴
            </span>
            <span style={{ fontSize: 13, opacity: 0.7 }}>
              或点击「添加新茶」创建记录
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'Noto Serif SC', serif",
  color: '#5D4037',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid rgba(210,180,140,0.5)',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "'Noto Serif SC', serif",
  backgroundColor: 'rgba(255,255,255,0.7)',
  color: '#3E2723',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

const FieldInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#6B8E23';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(210,180,140,0.5)';
      }}
    />
  </div>
);

const actionBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  border: 'none',
  backgroundColor: '#6B8E23',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.2s ease',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid rgba(210,180,140,0.5)',
  backgroundColor: 'transparent',
  color: '#8D6E63',
  cursor: 'pointer',
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  transition: 'all 0.2s ease',
};

export default App;
