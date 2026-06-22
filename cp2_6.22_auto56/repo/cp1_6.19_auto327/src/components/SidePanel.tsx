import { useGalleryStore } from '../store';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  step?: number;
}

function SliderInput({ label, value, min, max, onChange, step = 1 }: SliderInputProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>
          {label}
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          style={{
            width: '70px',
            padding: '6px 10px',
            border: '1px solid #DDD',
            borderRadius: '4px',
            fontSize: '13px',
            textAlign: 'right',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#8B4513';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#DDD';
          }}
        />
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: '#E0E0E0',
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none',
        }}
      />
    </div>
  );
}

export function SidePanel() {
  const {
    artworks,
    selectedId,
    layout,
    updateSelected,
    alignHorizontal,
    alignVerticalCenter,
    distributeEvenly,
    shuffle,
    undo,
    redo,
    historyIndex,
    history,
  } = useGalleryStore();

  const selectedArtwork = artworks.find((a) => a.id === selectedId);
  const artworkIndex = selectedId
    ? artworks.findIndex((a) => a.id === selectedId) + 1
    : null;

  const handleRotationChange = (rotation: 0 | 15 | 30) => {
    updateSelected({ rotation });
  };

  const buttonStyle = {
    padding: '10px 16px',
    border: '1px solid #DDD',
    borderRadius: '6px',
    backgroundColor: '#FFF',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    flex: 1,
    color: '#333',
  };

  const buttonHoverStyle = {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
    color: '#FFF',
  };

  const actionButtonStyle = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#8B4513',
    color: '#FFF',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    flex: 1,
  };

  const disabledButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: '#CCC',
    cursor: 'not-allowed',
    opacity: 0.6,
  };

  return (
    <div
      style={{
        width: '300px',
        backgroundColor: '#FAFAFA',
        borderLeft: '1px solid #E0E0E0',
        padding: '16px',
        overflowY: 'auto',
        height: 'calc(100vh - 100px)',
        boxSizing: 'border-box',
      }}
    >
      {selectedArtwork && artworkIndex ? (
        <>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #E0E0E0',
            }}
          >
            画作 #{artworkIndex}
          </div>

          <SliderInput
            label="X 位置"
            value={selectedArtwork.x}
            min={0}
            max={layout.canvasWidth}
            onChange={(v) => updateSelected({ x: v })}
          />

          <SliderInput
            label="Y 位置"
            value={selectedArtwork.y}
            min={0}
            max={layout.canvasHeight}
            onChange={(v) => updateSelected({ y: v })}
          />

          <SliderInput
            label="宽度"
            value={selectedArtwork.width}
            min={80}
            max={400}
            onChange={(v) => updateSelected({ width: v })}
          />

          <SliderInput
            label="高度"
            value={selectedArtwork.height}
            min={80}
            max={400}
            onChange={(v) => updateSelected({ height: v })}
          />

          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '13px',
                color: '#555',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              旋转角度
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[0, 15, 30].map((deg) => (
                <button
                  key={deg}
                  onClick={() => handleRotationChange(deg as 0 | 15 | 30)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border:
                      selectedArtwork.rotation === deg
                        ? '2px solid #8B4513'
                        : '1px solid #DDD',
                    borderRadius: '4px',
                    backgroundColor:
                      selectedArtwork.rotation === deg ? '#FFF8F0' : '#FFF',
                    color:
                      selectedArtwork.rotation === deg ? '#8B4513' : '#333',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #E0E0E0',
              paddingTop: '16px',
              marginBottom: '16px',
            }}
          />
        </>
      ) : (
        <div
          style={{
            fontSize: '14px',
            color: '#999',
            textAlign: 'center',
            padding: '40px 0',
            marginBottom: '16px',
          }}
        >
          点击画布中的画作进行选择
        </div>
      )}

      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#333',
          marginBottom: '12px',
        }}
      >
        全局布局工具
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={alignHorizontal}
          style={buttonStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, buttonStyle);
          }}
        >
          水平对齐
        </button>

        <button
          onClick={alignVerticalCenter}
          style={buttonStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, buttonStyle);
          }}
        >
          垂直居中对齐
        </button>

        <button
          onClick={distributeEvenly}
          style={buttonStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, buttonStyle);
          }}
        >
          均匀分布
        </button>

        <button
          onClick={shuffle}
          style={buttonStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, buttonStyle);
          }}
        >
          随机打乱
        </button>
      </div>

      <div
        style={{
          borderTop: '1px solid #E0E0E0',
          marginTop: '16px',
          paddingTop: '16px',
        }}
      />

      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#333',
          marginBottom: '12px',
        }}
      >
        历史记录
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          style={historyIndex <= 0 ? disabledButtonStyle : actionButtonStyle}
          onMouseEnter={(e) => {
            if (historyIndex > 0) {
              e.currentTarget.style.backgroundColor = '#6B3410';
            }
          }}
          onMouseLeave={(e) => {
            if (historyIndex > 0) {
              e.currentTarget.style.backgroundColor = '#8B4513';
            }
          }}
        >
          撤销 (Ctrl+Z)
        </button>

        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          style={
            historyIndex >= history.length - 1
              ? disabledButtonStyle
              : actionButtonStyle
          }
          onMouseEnter={(e) => {
            if (historyIndex < history.length - 1) {
              e.currentTarget.style.backgroundColor = '#6B3410';
            }
          }}
          onMouseLeave={(e) => {
            if (historyIndex < history.length - 1) {
              e.currentTarget.style.backgroundColor = '#8B4513';
            }
          }}
        >
          重做 (Ctrl+Y)
        </button>
      </div>

      <div
        style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '8px',
          textAlign: 'center',
        }}
      >
        历史记录: {historyIndex + 1} / {history.length}
      </div>
    </div>
  );
}
