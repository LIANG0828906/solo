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
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    const patternSize = 4;
    for (let x = 0; x < width; x += patternSize) {
      for (let y = 0; y < height; y += patternSize) {
        if ((x + y) % (patternSize * 2) === 0) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
          ctx.fillRect(x, y, patternSize / 2, patternSize / 2);
        }
      }
    }

    ctx.save();
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#c0c0c0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('请在此区域签名', width / 2, height / 2 + 4);
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
