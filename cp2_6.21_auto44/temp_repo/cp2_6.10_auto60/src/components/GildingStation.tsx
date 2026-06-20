import { useState, useRef } from 'react';
import { useGameStore, MOLD_PATTERNS } from '../store/gameStore';
import { motion } from 'framer-motion';
import type { InkBatch } from '../types';

const MOLD_ICONS: Record<string, string> = {
  dragon: '🐉',
  phoenix: '🐦',
  pineCrane: '🦢',
  fiveFu: '福',
  longevity: '壽',
  doubleCoin: '🪙'
};

function GildingStation() {
  const { inventory, setGildingCoverage, completeGilding, triggerSweep, playSound } = useGameStore();
  const [selectedBatch, setSelectedBatch] = useState<InkBatch | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brushPos = useRef({ x: 0, y: 0 });

  const readyBatches = inventory.filter(b => b.isDried && !b.isGilded);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selectedBatch || !canvasRef.current) return;
    setIsDrawing(true);
    updateBrushPos(e);
    draw(e);
  };

  const updateBrushPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    brushPos.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !selectedBatch || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    updateBrushPos(e);
    
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(brushPos.current.x, brushPos.current.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let goldPixels = 0;
    const totalPixels = canvas.width * canvas.height;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] > 0) {
        goldPixels++;
      }
    }
    
    const coverage = Math.min(100, Math.round((goldPixels / totalPixels) * 100 * 2.5));
    setGildingCoverage(selectedBatch.id, coverage);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleComplete = () => {
    if (!selectedBatch) return;
    completeGilding(selectedBatch.id);
    triggerSweep();
    playSound('guzheng');
    setSelectedBatch(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const selectBatch = (batch: InkBatch) => {
    setSelectedBatch(batch);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div>
      {readyBatches.length > 0 ? (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ color: '#6b4e3a', marginBottom: '0.5rem' }}>待描金墨锭：</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {readyBatches.map(batch => (
                <motion.div
                  key={batch.id}
                  className={`ink-item ${selectedBatch?.id === batch.id ? 'selected' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    borderColor: selectedBatch?.id === batch.id ? '#d4af37' : undefined
                  }}
                  onClick={() => selectBatch(batch)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ink-item-icon">
                    {MOLD_ICONS[batch.pattern]}
                  </div>
                  <div className="ink-item-info">
                    <div className="ink-item-name">
                      {MOLD_PATTERNS[batch.pattern]}墨
                    </div>
                    <div className="ink-item-details">
                      硬度{batch.hardness}级 · 描金{batch.gildingCoverage}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {selectedBatch && (
            <>
              <div 
                className="gilding-area"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              >
                <div className="ink-cake">
                  <span style={{ 
                    opacity: 0.3, 
                    fontSize: '3rem',
                    color: '#d4af37'
                  }}>
                    {MOLD_ICONS[selectedBatch.pattern]}
                  </span>
                  <canvas
                    ref={canvasRef}
                    width={120}
                    height={180}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              <div className="gilding-progress">
                <div className="gilding-progress-value">
                  {selectedBatch.gildingCoverage}%
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b4e3a' }}>
                  金粉覆盖率
                  {selectedBatch.gildingCoverage >= 80 && (
                    <span style={{ color: '#4a7c59', marginLeft: '0.5rem' }}>
                      ✓ 可达上品
                    </span>
                  )}
                </div>
              </div>

              <div className="press-progress">
                <div 
                  className="press-progress-bar" 
                  style={{ width: `${selectedBatch.gildingCoverage}%` }}
                />
              </div>

              <div className="controls-row">
                <button 
                  className="btn-bronze btn-large"
                  onClick={handleComplete}
                >
                  完成
                </button>
              </div>

              <p style={{ textAlign: 'center', color: '#6b4e3a', fontSize: '0.85rem', marginTop: '1rem' }}>
                按住鼠标在墨锭图案上涂抹金粉，覆盖率80%以上评为上品
              </p>
            </>
          )}
        </>
      ) : (
        <div className="drying-timer">
          <div className="drying-timer-title">描金室</div>
          <div style={{ color: '#6b4e3a', fontSize: '0.9rem' }}>
            暂无待描金的墨锭
          </div>
          <div style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.8rem', 
            color: '#8b6f5a' 
          }}>
            墨锭晾干后可在此进行描金
          </div>
        </div>
      )}
    </div>
  );
}

export default GildingStation;
