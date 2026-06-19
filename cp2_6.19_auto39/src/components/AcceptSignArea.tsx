import { useRef, useState, useEffect, useCallback } from 'react';
import { useContractStore } from '../store/useContractStore';
import type { Role } from '../types';
import './AcceptSignArea.css';

interface AcceptSignAreaProps {
  role: Role;
  onSigned?: () => void;
}

const AcceptSignArea = ({ role, onSigned }: AcceptSignAreaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState<'black' | 'blue'>('black');
  const [strokeWidth, setStrokeWidth] = useState<2 | 4>(2);
  const [hasSignature, setHasSignature] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const { saveSignature } = useContractStore();

  const roleLabel = role === 'initiator' ? '发起方' : '接收方';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    drawBackground(ctx, rect.width, rect.height);
  }, []);

  const drawBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(0.5, '#f1f3f5');
    gradient.addColorStop(1, '#f8f9fa');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const opacity = Math.random() * 0.04 + 0.01;
      const size = Math.random() * 1.5 + 0.5;
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.fillRect(x, y, size, size);
    }

    for (let i = 0; i < 500; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const opacity = Math.random() * 0.03 + 0.01;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    ctx.save();
    ctx.strokeStyle = '#c0c4cc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(192, 196, 204, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#909399';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('请在此区域签名', centerX, centerY + 5);
    ctx.restore();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isConfirmed) return;
    e.preventDefault();

    const point = getCoordinates(e);
    if (!point) return;

    setIsDrawing(true);
    lastPointRef.current = point;
    pointsRef.current = [point];
  };

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || isConfirmed) return;
      e.preventDefault();

      const point = getCoordinates(e);
      if (!point || !lastPointRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      pointsRef.current.push(point);

      const color = strokeColor === 'black' ? '#1a1a1a' : '#2980b9';

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      if (pointsRef.current.length >= 3) {
        const len = pointsRef.current.length;
        const xc = (pointsRef.current[len - 2].x + point.x) / 2;
        const yc = (pointsRef.current[len - 2].y + point.y) / 2;
        ctx.beginPath();
        ctx.moveTo(pointsRef.current[len - 3].x, pointsRef.current[len - 3].y);
        ctx.quadraticCurveTo(pointsRef.current[len - 2].x, pointsRef.current[len - 2].y, xc, yc);
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      lastPointRef.current = point;

      if (!hasSignature) {
        setHasSignature(true);
      }
    },
    [isDrawing, isConfirmed, strokeColor, strokeWidth, hasSignature]
  );

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
    pointsRef.current = [];
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.scale(dpr, dpr);
    drawBackground(ctx, rect.width, rect.height);

    setHasSignature(false);
    setIsConfirmed(false);
  };

  const confirmSignature = () => {
    if (!hasSignature) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    saveSignature(dataUrl, role);
    setIsConfirmed(true);

    onSigned?.();
  };

  return (
    <div className="sign-area">
      <div className="sign-header">
        <h3 className="sign-title">
          <span className={`role-badge role-${role}`}>{roleLabel}</span>
          签名区域
        </h3>
        {isConfirmed && <span className="sign-status signed">✓ 已签署</span>}
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className={`signature-canvas ${isConfirmed ? 'confirmed' : ''}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {!isConfirmed && (
        <div className="sign-controls">
          <div className="control-group">
            <span className="control-label">笔触颜色</span>
            <div className="color-options">
              <button
                className={`color-option black ${
                  strokeColor === 'black' ? 'active' : ''
                }`}
                onClick={() => setStrokeColor('black')}
                title="黑色"
              />
              <button
                className={`color-option blue ${
                  strokeColor === 'blue' ? 'active' : ''
                }`}
                onClick={() => setStrokeColor('blue')}
                title="蓝色"
              />
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">笔触粗细</span>
            <div className="width-options">
              <button
                className={`width-option ${strokeWidth === 2 ? 'active' : ''}`}
                onClick={() => setStrokeWidth(2)}
              >
                <span className="width-dot" style={{ width: 2, height: 2 }} />
                细
              </button>
              <button
                className={`width-option ${strokeWidth === 4 ? 'active' : ''}`}
                onClick={() => setStrokeWidth(4)}
              >
                <span className="width-dot" style={{ width: 4, height: 4 }} />
                粗
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-secondary btn-sm"
              onClick={clearCanvas}
              disabled={!hasSignature}
            >
              清除
            </button>
            <button
              className="btn btn-primary"
              onClick={confirmSignature}
              disabled={!hasSignature}
            >
              确认签名
            </button>
          </div>
        </div>
      )}

      {isConfirmed && (
        <div className="signed-footer">
          <button
            className="btn btn-secondary btn-sm"
            onClick={clearCanvas}
          >
            重新签名
          </button>
        </div>
      )}
    </div>
  );
};

export default AcceptSignArea;
