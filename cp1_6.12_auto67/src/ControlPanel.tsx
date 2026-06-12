import { HexColorPicker } from 'react-colorful';

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
}

interface ControlPanelProps {
  style: TypographyStyle;
  onChange: (style: TypographyStyle) => void;
  onCopy: () => void;
  copied: boolean;
}

const FONTS = [
  'Roboto',
  'Noto Serif SC',
  'Playfair Display',
  'Lora',
  'Merriweather',
  'Montserrat',
];

const WEIGHTS = [
  { label: 'Light', value: 'light' },
  { label: 'Regular', value: 'regular' },
  { label: 'Bold', value: 'bold' },
];

const controlItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const groupLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const interactiveBase: React.CSSProperties = {
  transition: 'transform 0.1s ease',
  cursor: 'pointer',
};

export default function ControlPanel({ style, onChange, onCopy, copied }: ControlPanelProps) {
  const update = (partial: Partial<TypographyStyle>) => {
    onChange({ ...style, ...partial });
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    ...interactiveBase,
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    accentColor: '#555',
    ...interactiveBase,
  };

  const numberInputStyle: React.CSSProperties = {
    width: '60px',
    padding: '6px 8px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    outline: 'none',
    ...interactiveBase,
  };

  const weightBtnBase: React.CSSProperties = {
    padding: '6px 14px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    cursor: 'pointer',
    ...interactiveBase,
  };

  const copyBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#333',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'transform 0.1s ease, background-color 0.2s ease',
  };

  return (
    <div
      style={{
        width: '280px',
        minWidth: '280px',
        height: '100vh',
        padding: '24px 20px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          fontSize: '16px',
          fontWeight: 600,
          margin: '0 0 4px 0',
          color: '#333',
        }}
      >
        字体排印调色板
      </h2>

      <div style={controlItemStyle}>
        <span style={groupLabelStyle}>字体 Font</span>
        <select
          value={style.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          style={selectStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
          }}
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div style={controlItemStyle}>
        <span style={groupLabelStyle}>字号 Size</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="range"
            min={12}
            max={72}
            value={style.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            style={sliderStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
          <input
            type="number"
            min={12}
            max={72}
            value={style.fontSize}
            onChange={(e) => {
              const v = Math.min(72, Math.max(12, Number(e.target.value) || 12));
              update({ fontSize: v });
            }}
            style={numberInputStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
            }}
          />
          <span style={{ fontSize: '12px', color: '#999' }}>px</span>
        </div>
      </div>

      <div style={controlItemStyle}>
        <span style={groupLabelStyle}>字重 Weight</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {WEIGHTS.map((w) => (
            <button
              key={w.value}
              onClick={() => update({ fontWeight: w.value })}
              style={{
                ...weightBtnBase,
                backgroundColor:
                  style.fontWeight === w.value
                    ? '#333'
                    : 'rgba(255,255,255,0.6)',
                color: style.fontWeight === w.value ? '#fff' : '#333',
                borderColor:
                  style.fontWeight === w.value ? '#333' : '#e0e0e0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div style={controlItemStyle}>
        <span style={groupLabelStyle}>颜色 Color</span>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '4px 0',
          }}
        >
          <HexColorPicker
            color={style.color}
            onChange={(c) => update({ color: c })}
          />
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#666',
            fontFamily: 'monospace',
            marginTop: '2px',
          }}
        >
          {style.color.toUpperCase()}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={onCopy}
          style={copyBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
        >
          {copied ? '已复制 ✓' : '复制 CSS'}
        </button>
        {copied && (
          <div
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#4caf50',
              marginTop: '6px',
              animation: 'fadeCopy 0.3s ease',
            }}
          >
            已复制
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeCopy {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
