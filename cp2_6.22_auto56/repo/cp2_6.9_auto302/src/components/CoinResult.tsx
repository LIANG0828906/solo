import { useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import { CoinData } from '../types';

interface CoinResultProps {
  coinData: CoinData[];
  patternName: string;
  castingText: string;
  onImageGenerated: (dataUrl: string) => void;
  onRestart: () => void;
  finalImageData: string;
}

const CoinResult = ({
  coinData,
  patternName,
  castingText,
  onImageGenerated,
  onRestart,
  finalImageData
}: CoinResultProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  const generateCoinGradient = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    wearLevel: number,
    patinaLevel: number
  ) => {
    const gradient = ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      0,
      x,
      y,
      radius
    );

    const baseColor = { r: 184, g: 115, b: 51 };
    const patinaColor = { r: 74, g: 124, b: 89 };
    const wornColor = { r: 139, g: 69, b: 19 };

    const mixColor = (c1: typeof baseColor, c2: typeof baseColor, t: number) => ({
      r: Math.round(c1.r + (c2.r - c1.r) * t),
      g: Math.round(c1.g + (c2.g - c1.g) * t),
      b: Math.round(c1.b + (c2.b - c1.b) * t)
    });

    let finalColor = baseColor;
    if (patinaLevel > 0.3) {
      finalColor = mixColor(finalColor, patinaColor, patinaLevel * 0.5);
    }
    if (wearLevel > 0.3) {
      finalColor = mixColor(finalColor, wornColor, wearLevel * 0.3);
    }

    const highlightColor = mixColor(finalColor, { r: 255, g: 248, b: 225 }, 0.3);
    const shadowColor = mixColor(finalColor, { r: 62, g: 39, b: 35 }, 0.4);

    gradient.addColorStop(0, `rgb(${highlightColor.r}, ${highlightColor.g}, ${highlightColor.b})`);
    gradient.addColorStop(0.5, `rgb(${finalColor.r}, ${finalColor.g}, ${finalColor.b})`);
    gradient.addColorStop(1, `rgb(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b})`);

    return gradient;
  };

  const drawCoin = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    rotation: number,
    wearLevel: number,
    patinaLevel: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-x, -y);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = generateCoinGradient(ctx, x, y, radius, wearLevel, patinaLevel);
    ctx.fill();

    ctx.strokeStyle = 'rgba(62, 39, 35, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const edgeGradient = ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius);
    edgeGradient.addColorStop(0, 'transparent');
    edgeGradient.addColorStop(1, `rgba(74, 124, 89, ${patinaLevel * 0.5})`);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = edgeGradient;
    ctx.fill();

    const holeSize = radius * 0.25;
    ctx.fillStyle = '#2c1810';
    ctx.fillRect(x - holeSize / 2, y - holeSize / 2, holeSize, holeSize);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - holeSize / 2, y - holeSize / 2, holeSize, holeSize);

    for (let i = 0; i < 3; i++) {
      const wearX = x + (Math.random() - 0.5) * radius * 1.2;
      const wearY = y + (Math.random() - 0.5) * radius * 1.2;
      const wearRadius = radius * (0.05 + Math.random() * 0.05);
      const wearGradient = ctx.createRadialGradient(wearX, wearY, 0, wearX, wearY, wearRadius);
      wearGradient.addColorStop(0, `rgba(0, 0, 0, ${wearLevel * 0.3})`);
      wearGradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(wearX, wearY, wearRadius, 0, Math.PI * 2);
      ctx.fillStyle = wearGradient;
      ctx.fill();
    }

    ctx.restore();
  };

  const generateCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 600;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#3e2723');
    bgGradient.addColorStop(1, '#2c1810');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(50, height / 2);
    ctx.lineTo(width - 50, height / 2);
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width - 100; i += 8) {
      const x1 = 50 + i;
      const y1 = height / 2 - 4;
      const x2 = 50 + i - 6;
      const y2 = height / 2 + 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const coinRadius = 35;
    const spacing = 85;
    const startX = width / 2 - (coinData.length - 1) * spacing / 2;

    coinData.forEach((coin, index) => {
      const x = startX + index * spacing;
      const y = height / 2;
      drawCoin(ctx, x, y, coinRadius, coin.rotation, coin.wearLevel, coin.patinaLevel);
    });

    const titleGradient = ctx.createLinearGradient(0, 30, 0, 60);
    titleGradient.addColorStop(0, '#d4a373');
    titleGradient.addColorStop(1, '#b87333');
    ctx.fillStyle = titleGradient;
    ctx.font = 'bold 24px "Liu Jian Mao Cao", cursive';
    ctx.textAlign = 'center';
    ctx.fillText(`${patternName} · 一串五枚`, width / 2, 45);

    ctx.fillStyle = '#d7ccc8';
    ctx.font = '16px "Liu Jian Mao Cao", cursive';
    ctx.fillText('铸于大宋 · 匠人亲制', width / 2, height - 25);

    const dataUrl = canvas.toDataURL('image/png');
    onImageGenerated(dataUrl);
  };

  useEffect(() => {
    if (coinData.length > 0) {
      const timer = setTimeout(() => {
        generateCanvasImage();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [coinData]);

  const handleDownload = () => {
    if (finalImageData) {
      saveAs(finalImageData, `${patternName}_铜钱串.png`);
    } else if (canvasRef.current) {
      generateCanvasImage();
      setTimeout(() => {
        if (finalImageData) {
          saveAs(finalImageData, `${patternName}_铜钱串.png`);
        }
      }, 200);
    }
  };

  const getCoinStyle = (coin: CoinData) => {
    const baseColor = `linear-gradient(145deg, 
      rgb(${Math.round(184 - coin.wearLevel * 50)}, ${Math.round(115 - coin.wearLevel * 40)}, ${Math.round(51 - coin.wearLevel * 30)}) 0%, 
      rgba(${Math.round(74 + coin.patinaLevel * 30)}, ${Math.round(124 + coin.patinaLevel * 40)}, ${Math.round(89 + coin.patinaLevel * 30)}, ${coin.patinaLevel * 0.8}) 30%,
      rgb(${Math.round(139 + coin.wearLevel * 20)}, ${Math.round(90 + coin.wearLevel * 20)}, ${Math.round(43 + coin.wearLevel * 15)}) 100%)`;

    return {
      background: baseColor,
      transform: `rotate(${coin.rotation}deg) rotateY(15deg)`,
      opacity: 1 - coin.wearLevel * 0.1
    };
  };

  return (
    <div className="coin-result-container">
      <h2 className="step-title" style={{ fontSize: '32px', marginBottom: '20px' }}>
        铸钱完成
      </h2>

      <div className="coin-string-display" ref={displayRef}>
        <div className="hemp-rope-horizontal" />
        {coinData.map((coin, index) => (
          <div
            key={coin.id}
            className="coin-string-coin"
            style={getCoinStyle(coin)}
          />
        ))}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="casting-record">
        <h3>铸钱纪事</h3>
        <p>{castingText}</p>
      </div>

      <div className="download-section">
        <button className="btn-coin" onClick={handleDownload}>
          保存图片
        </button>
        <button className="btn-coin" onClick={onRestart}>
          再铸一串
        </button>
      </div>
    </div>
  );
};

export default CoinResult;
