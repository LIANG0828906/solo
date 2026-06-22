import React, { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';
import { saveCard } from '../utils/storage';

interface CardProps {
  onSaveSuccess: () => void;
}

const COLORS = [
  '#FF4757', '#2ED573', '#1E90FF', '#FFA502',
  '#A29BFE', '#FD79A8', '#00D2D3', '#F8A5C2'
];

const BRUSH_SIZES = [
  { label: '小', size: 5 },
  { label: '中', size: 12 },
  { label: '大', size: 20 }
];

interface Position {
  x: number;
  y: number;
}

export default function Card({ onSaveSuccess }: CardProps) {
  const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
  const [challenge, setChallenge] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [lastPos, setLastPos] = useState<Position | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);
  const [mousePos, setMousePos] = useState<Position | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const fetchQuote = useCallback(async () => {
    try {
      const response = await fetch('/api/quotes');
      const data = await response.json();
      setQuote(data);
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 10);
    } catch (error) {
      console.error('获取名言失败:', error);
    }
  }, []);

  const fetchChallenge = useCallback(async () => {
    try {
      const response = await fetch('/api/challenges');
      const data = await response.json();
      setChallenge(data.challenge);
    } catch (error) {
      console.error('获取挑战失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
    fetchChallenge();
  }, [fetchQuote, fetchChallenge]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    setLastPos(coords);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCanvasCoords(e);

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lastPos) {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }

    setLastPos(coords);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const handleSave = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imageData = canvas.toDataURL('image/png');
      const id = uuidv4();
      await saveCard(id, imageData);
      showToastMessage('卡片已保存到画廊！');
      onSaveSuccess();
    } catch (error) {
      console.error('保存失败:', error);
      showToastMessage('保存失败，请重试');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    draw(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    draw(e);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  const dayLetter = dateStr.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <div
        ref={cardRef}
        className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-[90vw] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        <div className="p-8 flex items-center gap-4">
          <div
            className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: '#FF6B35' }}
          >
            {dayLetter}
          </div>
          <div className="text-gray-600 text-sm">
            <div className="font-medium">{today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div>
          </div>
        </div>

        <div className={`px-8 transition-all duration-600 ease-out ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {quote && (
            <div className="mb-6">
              <p className="text-[#333] serif text-2xl leading-relaxed mb-2">
                "{quote.quote}"
              </p>
              <p className="text-gray-500 text-right text-sm">— {quote.author}</p>
            </div>
          )}
        </div>

        <div className="px-8 mb-6">
          <div className="inline-block">
            <p className="text-[#FF6B35] sans-serif text-base relative">
              {challenge}
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#FF6B35] opacity-30" style={{
                background: 'linear-gradient(90deg, transparent, #FF6B35 20%, #FF6B35 80%, transparent)',
                backgroundSize: '200% 100%',
                animation: 'wave 2s linear infinite'
              }}></span>
            </p>
          </div>
        </div>

        <div className="px-8 mb-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width="400"
              height="300"
              className="w-full border-2 border-gray-200 rounded-lg cursor-crosshair touch-none"
              style={{ maxHeight: '300px' }}
              onMouseDown={startDrawing}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={handleTouchMove}
              onTouchEnd={stopDrawing}
            />
            {mousePos && !isDrawing && (
              <div
                className="absolute pointer-events-none rounded-full"
                style={{
                  left: mousePos.x - brushSize.size / 2,
                  top: mousePos.y - brushSize.size / 2,
                  width: brushSize.size,
                  height: brushSize.size,
                  border: `2px solid ${currentColor}`,
                  backgroundColor: 'transparent'
                }}
              />
            )}
          </div>
        </div>

        <div className="px-8 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${currentColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size.label}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    brushSize.label === size.label
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setBrushSize(size)}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 flex gap-4 flex-wrap">
          <button
            className="flex-1 min-w-[120px] px-6 py-3 rounded-xl text-white font-medium transition-all hover:scale-105 active:scale-95 relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            onClick={() => {
              fetchQuote();
              fetchChallenge();
            }}
          >
            <span className="relative z-10">换一张</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>

          <button
            className="flex-1 min-w-[120px] px-6 py-3 rounded-xl text-white font-medium transition-all hover:scale-105 active:scale-95 hover:bg-[#1ABC9C]"
            style={{ backgroundColor: '#2ED573' }}
            onClick={handleSave}
          >
            保存到画廊
          </button>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up z-50">
          {toastMessage}
        </div>
      )}

      <style>{`
        @keyframes wave {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .serif {
          font-family: Georgia, 'Times New Roman', serif;
        }
        
        .sans-serif {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }
        
        @media (max-width: 768px) {
          canvas {
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
}
