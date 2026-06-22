import React, { useEffect, useRef } from 'react';

interface TimeLineProps {
  currentIndex: number;
  totalImages: number;
  onIndexChange: (index: number) => void;
  currentImage: Float32Array | null;
  labels: number[];
  onChangeCommitted: (index: number) => void;
}

const TimeLine: React.FC<TimeLineProps> = ({
  currentIndex,
  totalImages,
  onIndexChange,
  currentImage,
  labels,
  onChangeCommitted
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const S = 28;
    const scale = 2;
    canvas.width = S * scale;
    canvas.height = S * scale;
    const imgData = ctx.createImageData(S * scale, S * scale);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const v = Math.floor(currentImage[y * S + x] * 255);
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = ((y * scale + sy) * S * scale + (x * scale + sx)) * 4;
            imgData.data[px] = v;
            imgData.data[px + 1] = v;
            imgData.data[px + 2] = v;
            imgData.data[px + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [currentImage]);

  useEffect(() => {
    const updatePos = () => {
      if (!thumbRef.current || !trackRef.current) return;
      const pct = currentIndex / (totalImages - 1);
      const trackW = trackRef.current.clientWidth;
      const thumbSize = 18;
      thumbRef.current.style.left = `${pct * (trackW - thumbSize)}px`;
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    return () => window.removeEventListener('resize', updatePos);
  }, [currentIndex, totalImages]);

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    computeIndexFromEvent(e);
  };

  const computeIndexFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    const idx = Math.round(pct * (totalImages - 1));
    if (idx !== currentIndex) {
      onIndexChange(idx);
    }
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    computeIndexFromEvent(e);
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      computeIndexFromEvent(e);
      onChangeCommitted(currentIndex);
    }
  };

  const progressPct = (currentIndex / (totalImages - 1)) * 100;

  return (
    <div style={timelineStyle}>
      <div style={leftSectionStyle}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#8080A0',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '4px'
        }}>
          图片索引
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '28px',
          fontWeight: 700,
          color: '#E94560',
          lineHeight: 1
        }}>
          {String(currentIndex).padStart(2, '0')}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#8080A0',
          fontFamily: "'JetBrains Mono', monospace",
          marginTop: '2px'
        }}>
          / {String(totalImages - 1).padStart(2, '0')}
        </div>
      </div>

      <div style={sliderSectionStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          padding: '0 2px'
        }}>
          {Array.from({ length: totalImages }, (_, i) => (
            <div
              key={i}
              onClick={() => {
                onIndexChange(i);
                onChangeCommitted(i);
              }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: i === currentIndex ? '#E94560' : i <= currentIndex ? '#0F3460' : '#2A2A4E',
                border: `1.5px solid ${i === currentIndex ? '#FF6B88' : '#3A3A5E'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: i === currentIndex ? '0 0 8px rgba(233,69,96,0.5)' : 'none'
              }}
              title={`图片 ${i}（标签：${labels[i]}）`}
            />
          ))}
        </div>

        <div
          ref={trackRef}
          style={trackContainerStyle}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
        >
          <div style={trackBgStyle} />
          <div
            style={{
              ...trackFillStyle,
              width: `${progressPct}%`,
              transition: isDragging.current ? 'none' : 'width 0.2s ease-out'
            }}
          />
          <div
            ref={thumbRef}
            style={thumbStyle}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          padding: '0 2px'
        }}>
          {Array.from({ length: totalImages }, (_, i) => (
            <div
              key={i}
              style={{
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                color: i === currentIndex ? '#E94560' : '#505070',
                fontWeight: i === currentIndex ? 700 : 400,
                transition: 'color 0.2s',
                width: '16px',
                textAlign: 'center'
              }}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      <div style={rightSectionStyle}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#8080A0',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '4px',
          textAlign: 'right'
        }}>
          预览图
        </div>
        <div style={thumbPreviewStyle}>
          <canvas
            ref={canvasRef}
            width={56}
            height={56}
            style={{
              display: 'block',
              imageRendering: 'pixelated',
              borderRadius: '2px'
            }}
          />
        </div>
        <div style={{
          fontSize: '10px',
          color: '#8080A0',
          textAlign: 'center',
          marginTop: '4px',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          28×28 灰度图 · Lbl: <span style={{ color: '#4FC3F7', fontWeight: 600 }}>{labels[currentIndex]}</span>
        </div>
      </div>
    </div>
  );
};

const timelineStyle: React.CSSProperties = {
  height: '80px',
  minHeight: '80px',
  background: '#16213E',
  borderTop: '2px solid #2A2A4E',
  display: 'flex',
  alignItems: 'center',
  padding: '0 24px',
  boxSizing: 'border-box',
  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
  color: '#E0E0E0',
  fontFamily: "'Segoe UI', 'JetBrains Mono', sans-serif",
  gap: '20px'
};

const leftSectionStyle: React.CSSProperties = {
  width: '68px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column'
};

const sliderSectionStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '4px 12px',
  minWidth: 0
};

const rightSectionStyle: React.CSSProperties = {
  width: '96px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end'
};

const trackContainerStyle: React.CSSProperties = {
  position: 'relative',
  height: '14px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  touchAction: 'none'
};

const trackBgStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '4px',
  background: '#0A1225',
  borderRadius: '2px',
  border: '1px solid #2A2A4E'
};

const trackFillStyle: React.CSSProperties = {
  position: 'absolute',
  height: '4px',
  background: 'linear-gradient(90deg, #0F3460, #E94560)',
  borderRadius: '2px',
  zIndex: 1
};

const thumbStyle: React.CSSProperties = {
  position: 'absolute',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: 'radial-gradient(circle at 30% 30%, #FF6B88, #E94560)',
  border: '2px solid #16213E',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  boxShadow: '0 0 10px rgba(233, 69, 96, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
  cursor: 'grab',
  zIndex: 2,
  transition: 'box-shadow 0.2s',
  minWidth: '18px',
  minHeight: '18px'
};

const thumbPreviewStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  background: '#0A1225',
  border: '1.5px solid #2A2A4E',
  borderRadius: '4px',
  padding: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
};

export default TimeLine;
