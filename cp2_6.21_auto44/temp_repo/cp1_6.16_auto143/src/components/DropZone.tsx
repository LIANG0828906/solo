import { useRef, useState, useEffect } from 'react';
import type { Spice } from '../types';
import { useStore, calculateCosineSimilarity } from '../store';

function createRipple(event: React.MouseEvent<HTMLButtonElement>) {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const existingRipple = button.getElementsByClassName('ripple')[0];
  if (existingRipple) {
    existingRipple.remove();
  }

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

export default function DropZone() {
  const dropZoneSpices = useStore((s) => s.dropZoneSpices);
  const setDropZoneSpice = useStore((s) => s.setDropZoneSpice);
  const clearDropZone = useStore((s) => s.clearDropZone);
  const addFavorite = useStore((s) => s.addFavorite);
  const selectedCulture = useStore((s) => s.selectedCulture);
  const [isDragOver, setIsDragOver] = useState(false);
  const slot0Ref = useRef<HTMLDivElement>(null);
  const slot1Ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const spice1 = dropZoneSpices[0];
  const spice2 = dropZoneSpices[1];
  const similarity = spice1 && spice2 ? Math.round(calculateCosineSimilarity(spice1.flavor, spice2.flavor) * 100) : null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, slotIndex?: 0 | 1) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const spiceData: Spice & { cultureName: string } = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (slotIndex !== undefined) {
        setDropZoneSpice(slotIndex, spiceData);
      } else {
        if (!dropZoneSpices[0]) {
          setDropZoneSpice(0, spiceData);
        } else if (!dropZoneSpices[1]) {
          setDropZoneSpice(1, spiceData);
        } else {
          setDropZoneSpice(0, spiceData);
        }
      }
    } catch (err) {
      console.error('Failed to parse spice data');
    }
  };

  const handleSaveFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    if (spice1 && spice2 && similarity !== null && selectedCulture) {
      addFavorite([spice1, spice2], selectedCulture.name, similarity);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !slot0Ref.current || !slot1Ref.current || !spice1 || !spice2) return;

    const svg = svgRef.current;
    const svgRect = svg.getBoundingClientRect();
    const slot1Rect = slot0Ref.current.getBoundingClientRect();
    const slot2Rect = slot1Ref.current.getBoundingClientRect();

    const x1 = slot1Rect.left + slot1Rect.width / 2 - svgRect.left;
    const y1 = slot1Rect.top + slot1Rect.height / 2 - svgRect.top;
    const x2 = slot2Rect.left + slot2Rect.width / 2 - svgRect.left;
    const y2 = slot2Rect.top + slot2Rect.height / 2 - svgRect.top;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 30;

    const path = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

    const gradientId = 'connection-gradient';
    const existingDefs = svg.querySelector('defs');
    if (existingDefs) existingDefs.remove();

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', spice1.color);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', spice2.color);

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    let pathEl = svg.querySelector('path');
    if (!pathEl) {
      pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(pathEl);
    }

    pathEl.setAttribute('d', path);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', `url(#${gradientId})`);
    pathEl.setAttribute('stroke-width', '3');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('opacity', '0.8');
  }, [spice1, spice2]);

  useEffect(() => {
    if (!spice1 || !spice2) {
      if (svgRef.current) {
        svgRef.current.innerHTML = '';
      }
    }
  }, [spice1, spice2]);

  return (
    <div className="dropzone-wrapper">
      <div
        className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
      >
        <div className="dropzone-title">香料融合分析</div>
        <div className="dropzone-subtitle">拖拽香料卡片至下方插槽</div>

        <div className="similarity-display">
          {similarity !== null ? (
            <>
              <div className="similarity-value">{similarity}%</div>
              <div className="similarity-label">风味相似度 · Similarity</div>
            </>
          ) : (
            <>
              <div className="similarity-value" style={{ fontSize: 18, background: 'none', WebkitTextFillColor: '#999', color: '#999' }}>
                {spice1 || spice2 ? '再添加一种香料' : '等待香料组合...'}
              </div>
            </>
          )}
        </div>

        <div className="spice-slots">
          <svg ref={svgRef} className="connection-line-svg" />
          
          <div
            ref={slot0Ref}
            className={`spice-slot ${spice1 ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 0)}
          >
            {spice1 ? (
              <>
                <button className="slot-remove-btn" onClick={() => setDropZoneSpice(0, null)}>×</button>
                <div className="slot-spice">
                  <div className="slot-spice-color" style={{ background: spice1.color }} />
                  <div className="slot-spice-name">{spice1.name}</div>
                </div>
              </>
            ) : (
              <div className="slot-placeholder">
                <div className="slot-icon">🌶️</div>
                拖入香料 A
              </div>
            )}
          </div>

          <div
            ref={slot1Ref}
            className={`spice-slot ${spice2 ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 1)}
          >
            {spice2 ? (
              <>
                <button className="slot-remove-btn" onClick={() => setDropZoneSpice(1, null)}>×</button>
                <div className="slot-spice">
                  <div className="slot-spice-color" style={{ background: spice2.color }} />
                  <div className="slot-spice-name">{spice2.name}</div>
                </div>
              </>
            ) : (
              <div className="slot-placeholder">
                <div className="slot-icon">🧂</div>
                拖入香料 B
              </div>
            )}
          </div>
        </div>

        <button
          className="save-favorite-btn"
          disabled={!spice1 || !spice2}
          onClick={handleSaveFavorite}
        >
          💗 收藏此组合
        </button>

        {(spice1 || spice2) && (
          <button
            style={{
              marginTop: 8,
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #CCC',
              color: '#666',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 0.2s ease'
            }}
            onClick={clearDropZone}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#FF6B6B';
              e.currentTarget.style.color = '#FF6B6B';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#CCC';
              e.currentTarget.style.color = '#666';
            }}
          >
            清空
          </button>
        )}
      </div>
    </div>
  );
}
