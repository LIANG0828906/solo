import { useState, useMemo } from 'react';
import {
  ColorTheme,
  SavedTheme,
  PRESET_COLORS,
  PRESET_THEMES,
  THEME_VARIABLE_KEYS,
  THEME_VARIABLE_LABELS,
} from './types';
import {
  generateVariants,
  isValidHex,
  exportThemeJSON,
  adjustBrightness,
} from './themeEngine';

interface EditorProps {
  theme: ColorTheme;
  savedThemes: SavedTheme[];
  onThemeChange: (key: keyof Omit<ColorTheme, 'name'>, value: string) => void;
  onThemeNameChange: (name: string) => void;
  onLoadTheme: (theme: ColorTheme) => void;
  onSaveTheme: () => void;
  onDeleteTheme: (id: string) => void;
  onRenameTheme: (id: string, newName: string) => void;
}

const VARIANT_LABELS: Record<string, string> = {
  light20: '浅色 20%',
  light40: '浅色 40%',
  light60: '浅色 60%',
  dark20: '深色 20%',
  dark40: '深色 40%',
  complementary: '对比色',
};

function Editor({
  theme,
  savedThemes,
  onThemeChange,
  onThemeNameChange,
  onLoadTheme,
  onSaveTheme,
  onDeleteTheme,
  onRenameTheme,
}: EditorProps) {
  const [activeVariable, setActiveVariable] =
    useState<keyof Omit<ColorTheme, 'name'>>('primary');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);

  const primaryVariants = useMemo(
    () => generateVariants(theme.primary),
    [theme.primary]
  );

  const handleColorInputChange = (
    key: keyof Omit<ColorTheme, 'name'>,
    value: string
  ) => {
    if (isValidHex(value) || value === '#') {
      onThemeChange(key, value);
    }
  };

  const handlePresetClick = (color: string) => {
    onThemeChange(activeVariable, color);
  };

  const handleExport = () => {
    exportThemeJSON(theme);
  };

  const startRename = (t: SavedTheme) => {
    setEditingId(t.id);
    setEditingName(t.name);
  };

  const confirmRename = () => {
    if (editingId && editingName.trim()) {
      onRenameTheme(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1E293B',
        borderRadius: 12,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        gap: 20,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#E2E8F0',
            marginBottom: 4,
          }}
        >
          主题编辑器
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8' }}>
          调整颜色变量，实时预览效果
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          主题名称
        </div>
        <input
          type="text"
          value={theme.name}
          onChange={(e) => onThemeNameChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #334155',
            background: '#0F172A',
            color: '#E2E8F0',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.2s ease-out',
          }}
          onFocus={(e) => (e.target.style.borderColor = theme.primary)}
          onBlur={(e) => (e.target.style.borderColor = '#334155')}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            fontWeight: 500,
          }}
        >
          核心颜色变量
        </div>
        {THEME_VARIABLE_KEYS.map((key) => (
          <div
            key={key}
            onClick={() => setActiveVariable(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: activeVariable === key ? '#0F172A' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.2s ease-out',
              border:
                activeVariable === key
                  ? `2px solid ${theme.primary}`
                  : '2px solid transparent',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: theme[key],
                boxShadow:
                  activeVariable === key
                    ? `0 0 0 3px rgba(99, 102, 241, 0.3)`
                    : 'none',
                transition: 'box-shadow 0.2s ease-out',
                border: '2px solid #334155',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => onThemeChange(key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: -5,
                  left: -5,
                  width: 50,
                  height: 50,
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 13, color: '#E2E8F0', marginBottom: 2 }}
              >
                {THEME_VARIABLE_LABELS[key]}
              </div>
              <input
                type="text"
                value={theme[key]}
                onChange={(e) => handleColorInputChange(key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'monospace',
                  padding: 0,
                  cursor: 'text',
                  width: '100%',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          预设色板
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 10,
          }}
        >
          {PRESET_COLORS.map((color) => {
            const isSelected = theme[activeVariable] === color;
            return (
              <div
                key={color}
                onClick={() => handlePresetClick(color)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: color,
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? `0 0 0 3px #6366F1, 0 0 12px rgba(99, 102, 241, 0.5)`
                    : 'none',
                  transition:
                    'box-shadow 0.2s ease-out, transform 0.2s ease-out',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'scale(1)';
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          主色变体系统
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {Object.entries(primaryVariants).map(([key, value]) => (
            <div
              key={key}
              onMouseEnter={() => setHoveredVariant(key)}
              onMouseLeave={() => setHoveredVariant(null)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 8,
                  background: value,
                  transform: hoveredVariant === key ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s ease-out',
                  border: '1px solid #334155',
                }}
              />
              <div
                style={{
                  fontSize: 10,
                  color: '#94A3B8',
                  opacity: hoveredVariant === key ? 1 : 0.7,
                  transition: 'opacity 0.2s ease-out',
                  whiteSpace: 'nowrap',
                }}
              >
                {hoveredVariant === key
                  ? value.startsWith('rgba')
                    ? value
                    : value.toUpperCase()
                  : VARIANT_LABELS[key]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          预置主题
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onLoadTheme(preset)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #334155',
                background: '#0F172A',
                color: '#E2E8F0',
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  adjustBrightness(preset.primary, -30);
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  preset.primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  '#0F172A';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  '#334155';
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: preset.primary,
                }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSaveTheme}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: theme.primary,
            color: theme.text,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              adjustBrightness(theme.primary, -10);
            (e.currentTarget as HTMLButtonElement).style.transform =
              'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              theme.primary;
            (e.currentTarget as HTMLButtonElement).style.transform =
              'translateY(0)';
          }}
        >
          保存主题
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #334155',
            background: '#0F172A',
            color: '#E2E8F0',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              theme.primary;
            (e.currentTarget as HTMLButtonElement).style.transform =
              'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              '#334155';
            (e.currentTarget as HTMLButtonElement).style.transform =
              'translateY(0)';
          }}
        >
          导出
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflow: 'hidden',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          已保存主题 ({savedThemes.length})
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {savedThemes.length === 0 && (
            <div
              style={{
                fontSize: 12,
                color: '#64748B',
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              暂无保存的主题
            </div>
          )}
          {savedThemes.map((saved) => (
            <div
              key={saved.id}
              onClick={() => editingId !== saved.id && onLoadTheme(saved)}
              style={{
                width: '100%',
                minHeight: 48,
                background: '#0F172A',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: editingId === saved.id ? 'default' : 'pointer',
                transition: 'transform 0.2s ease-out, background 0.2s ease-out',
              }}
              onMouseEnter={(e) => {
                if (editingId !== saved.id) {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    'translateY(-1px)';
                  (e.currentTarget as HTMLDivElement).style.background =
                    '#1E293B';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.background = '#0F172A';
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: saved.primary,
                  flexShrink: 0,
                }}
              />
              {editingId === saved.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename();
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditingName('');
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    background: '#1E293B',
                    border: '1px solid ' + saved.primary,
                    borderRadius: 4,
                    padding: '4px 8px',
                    color: '#E2E8F0',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              ) : (
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: '#E2E8F0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {saved.name}
                </span>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(saved);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: 'transparent',
                    color: '#94A3B8',
                    fontSize: 11,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease-out, color 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(99, 102, 241, 0.2)';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      '#A5B4FC';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      '#94A3B8';
                  }}
                >
                  重命名
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTheme(saved.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: 'transparent',
                    color: '#94A3B8',
                    fontSize: 11,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease-out, color 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(239, 68, 68, 0.2)';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      '#FCA5A5';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      '#94A3B8';
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Editor;
