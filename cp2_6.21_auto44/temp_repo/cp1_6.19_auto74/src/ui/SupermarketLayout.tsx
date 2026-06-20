import { useEffect, useRef, memo } from 'react';
import { GameState, GRID_OBSTACLE } from '../engine/GameState';

interface Props {
  state: GameState;
  onShelfClick: (id: number) => void;
  onCashierClick: (id: number) => void;
  onSelfClick: (id: number) => void;
}

const CUSTOMER_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#DDA0DD', '#FFA07A', '#87CEEB', '#F0E68C'];

export const SupermarketLayout = memo(function SupermarketLayout({ state, onShelfClick, onCashierClick, onSelfClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const cell = state.cellSize;
  const width = state.gridWidth * cell;
  const height = state.gridHeight * cell;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      drawGrid(ctx, state);
      drawPaths(ctx, state);
      drawEntryExit(ctx, state);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, width, height]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = layoutRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);

    for (const shelf of state.shelves) {
      if (gx >= shelf.gridX && gx < shelf.gridX + shelf.width &&
          gy >= shelf.gridY && gy < shelf.gridY + shelf.height) {
        onShelfClick(shelf.id);
        return;
      }
    }
    for (const c of state.cashiers) {
      if (gx === c.gridX && gy === c.gridY) {
        onCashierClick(c.id);
        return;
      }
    }
    for (const s of state.selfCheckouts) {
      if (gx === s.gridX && gy === s.gridY) {
        onSelfClick(s.id);
        return;
      }
    }
  };

  return (
    <div className="supermarket-layout" ref={layoutRef} onClick={handleCanvasClick}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="layout-canvas"
      />

      {/* Shelves */}
      {state.shelves.map((shelf) => {
        const stockRatio = shelf.stock / 100;
        const baseColor = '#E0E0E0';
        const deepColor = '#A0A0A0';
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        const r2 = parseInt(deepColor.slice(1, 3), 16);
        const g2 = parseInt(deepColor.slice(3, 5), 16);
        const b2 = parseInt(deepColor.slice(5, 7), 16);
        const color = `rgb(${Math.round(r + (r2 - r) * (1 - stockRatio))}, ${Math.round(g + (g2 - g) * (1 - stockRatio))}, ${Math.round(b + (b2 - b) * (1 - stockRatio))})`;

        return (
          <div
            key={`shelf-${shelf.id}`}
            className="shelf-box"
            style={{
              left: `${(shelf.gridX * cell / width) * 100}%`,
              top: `${(shelf.gridY * cell / height) * 100}%`,
              width: `${(shelf.width * cell / width) * 100}%`,
              height: `${(shelf.height * cell / height) * 100}%`,
              backgroundColor: color,
            }}
          >
            <div className="shelf-stock-bar">
              <div
                className="shelf-stock-fill"
                style={{ width: `${shelf.stock}%`, transition: 'width 0.3s ease' }}
              />
            </div>
            {shelf.stock < 30 && !shelf.restocking && (
              <div className="shelf-warning">⚠️</div>
            )}
            {shelf.restocking && (
              <div className="shelf-restocking">🚚</div>
            )}
          </div>
        );
      })}

      {/* Cashiers */}
      {state.cashiers.map((c) => {
        const queueCount = c.queue.length + (c.currentCustomerId ? 1 : 0);
        return (
          <div
            key={`cashier-${c.id}`}
            className={`cashier-box ${c.open ? 'open' : 'closed'}`}
            style={{
              left: `${(c.gridX * cell / width) * 100}%`,
              top: `${(c.gridY * cell / height) * 100}%`,
              width: `${(cell / width) * 100}%`,
              height: `${(cell / height) * 100}%`,
            }}
          >
            {!c.open && <div className="closed-marker">✕</div>}
            <div className="cashier-info">
              <div className="cashier-queue">
                <span className="queue-icon">👥</span>
                <span className="queue-count">{queueCount}</span>
              </div>
              <div className="cashier-rate">{c.rate.toFixed(2)}/s</div>
            </div>
            {c.currentCustomerId && (
              <div
                className="checkout-progress"
                style={{ width: `${c.checkoutProgress * 100}%` }}
              />
            )}
          </div>
        );
      })}

      {/* Self-checkouts */}
      {state.selfCheckouts.map((s) => (
        <div
          key={`self-${s.id}`}
          className={`self-box ${s.enabled ? (s.inUse ? 'in-use' : 'enabled') : 'disabled'} ${s.enabled ? '' : 'blink-warning'}`}
          style={{
            left: `${(s.gridX * cell / width) * 100}%`,
            top: `${(s.gridY * cell / height) * 100}%`,
            width: `${(cell / width) * 100}%`,
            height: `${(cell / height) * 100}%`,
          }}
        >
          {!s.enabled && <div className="warn-marker">⚠️</div>}
          {s.currentCustomerId && (
            <div
              className="checkout-progress self-progress"
              style={{ width: `${s.checkoutProgress * 100}%` }}
            />
          )}
        </div>
      ))}

      {/* Warehouse */}
      <div
        className="warehouse-box"
        style={{
          left: `${(state.warehousePoint.x * cell / width) * 100}%`,
          top: `${(state.warehousePoint.y * cell / height) * 100}%`,
          width: `${(cell / width) * 100}%`,
          height: `${(cell / height) * 100}%`,
        }}
      >
        📦
      </div>

      {/* Customers */}
      {state.customers.map((cust) => {
        const color = CUSTOMER_COLORS[cust.id % CUSTOMER_COLORS.length];
        return (
          <div
            key={`cust-${cust.id}`}
            className={`customer ${cust.angry ? 'angry' : ''} state-${cust.state}`}
            style={{
              left: `${(cust.x / width) * 100}%`,
              top: `${(cust.y / height) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${cust.rotation}deg)`,
            }}
          >
            <div className="customer-body" style={{ backgroundColor: color }}>
              <div className="customer-arrow" />
            </div>
            <div className="customer-items" style={{ transform: `rotate(${-cust.rotation}deg)` }}>
              🛒{cust.items}
            </div>
            {cust.angry && (
              <div className="customer-emoji" style={{ transform: `rotate(${-cust.rotation}deg)` }}>
                😠
              </div>
            )}
          </div>
        );
      })}

      {/* Restockers */}
      {state.restockers.map((r) => (
        <div
          key={`rest-${r.id}`}
          className="restocker"
          style={{
            left: `${(r.x / width) * 100}%`,
            top: `${(r.y / height) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${r.rotation}deg)`,
          }}
        >
          <div className="restocker-body">🚶</div>
          <div className="restocker-cart" style={{ transform: `rotate(${-r.rotation}deg)` }}>🛒</div>
        </div>
      ))}

      {/* Float texts */}
      {state.floatTexts.filter(ft => ft.text).map((ft) => (
        <div
          key={`ft-${ft.id}`}
          className="float-text"
          style={{
            left: `${(ft.x / width) * 100}%`,
            top: `${(ft.y / height) * 100}%`,
            color: ft.color,
            opacity: Math.max(0, ft.life / ft.maxLife),
          }}
        >
          {ft.text}
        </div>
      ))}
    </div>
  );
});

function drawGrid(ctx: CanvasRenderingContext2D, state: GameState) {
  const cell = state.cellSize;
  const w = state.gridWidth * cell;
  const h = state.gridHeight * cell;

  // Background
  ctx.fillStyle = '#F5DEB3';
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = '#D2B48C';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= state.gridWidth; x++) {
    ctx.moveTo(x * cell, 0);
    ctx.lineTo(x * cell, h);
  }
  for (let y = 0; y <= state.gridHeight; y++) {
    ctx.moveTo(0, y * cell);
    ctx.lineTo(w, y * cell);
  }
  ctx.stroke();

  // Obstacles debug (optional - not needed since we draw DOM elements)
}

function drawPaths(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.strokeStyle = 'rgba(200,200,200,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);

  for (const cust of state.customers) {
    if (cust.path.length <= 1 || cust.pathIndex >= cust.path.length) continue;
    ctx.beginPath();
    ctx.moveTo(cust.x, cust.y);
    for (let i = cust.pathIndex; i < cust.path.length; i++) {
      ctx.lineTo(cust.path[i].x, cust.path[i].y);
    }
    ctx.stroke();
  }

  for (const r of state.restockers) {
    if (r.path.length <= 1 || r.pathIndex >= r.path.length) continue;
    ctx.strokeStyle = 'rgba(100,149,237,0.6)';
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    for (let i = r.pathIndex; i < r.path.length; i++) {
      ctx.lineTo(r.path[i].x, r.path[i].y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,200,200,0.5)';
  }

  ctx.setLineDash([]);
}

function drawEntryExit(ctx: CanvasRenderingContext2D, state: GameState) {
  const cell = state.cellSize;
  const entry = state.entryPoint;
  const exitPt = state.exitPoint;

  // Entry arrow
  ctx.fillStyle = '#90EE90';
  ctx.font = `${cell * 0.7}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(entry.x * cell + cell / 2, entry.y * cell + cell / 2);
  ctx.fillText('➡️', 0, 0);
  ctx.font = `${cell * 0.25}px Arial`;
  ctx.fillStyle = '#2E7D32';
  ctx.fillText('入口', 0, cell * 0.55);
  ctx.restore();

  // Exit arrow
  ctx.fillStyle = '#90EE90';
  ctx.font = `${cell * 0.7}px Arial`;
  ctx.save();
  ctx.translate(exitPt.x * cell + cell / 2, exitPt.y * cell + cell / 2);
  ctx.fillText('➡️', 0, 0);
  ctx.font = `${cell * 0.25}px Arial`;
  ctx.fillStyle = '#2E7D32';
  ctx.fillText('出口', 0, cell * 0.55);
  ctx.restore();
}
