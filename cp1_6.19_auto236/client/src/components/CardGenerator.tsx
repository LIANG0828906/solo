import React, { useRef, useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';

interface CardGeneratorProps {
  title: string;
  author: string;
  shareUrl: string;
  waveformData: number[];
  width?: number;
  height?: number;
}

const CardGenerator: React.FC<CardGeneratorProps> = ({
  title,
  author,
  shareUrl,
  waveformData,
  width = 600,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation] = useState(() => (Math.random() * 4 - 2));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#1E1E24',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [shareUrl]);

  const extractPrimaryColor = useCallback((): string => {
    if (waveformData.length === 0) return '#6A5ACD';
    const avg = waveformData.reduce((a, b) => a + b, 0) / waveformData.length;
    if (avg > 0.6) return '#FF6347';
    if (avg > 0.35) return '#9370DB';
    return '#6A5ACD';
  }, [waveformData]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const primary = extractPrimaryColor();
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, primary);
    gradient.addColorStop(0.5, shadeColor(primary, -15));
    gradient.addColorStop(1, '#1E1E24');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 3 + 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Space Grotesk, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.fillText(title || '未命名混音', 32, 32);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '16px Space Grotesk, sans-serif';
    ctx.fillText(author || '匿名创作者', 32, 72);

    const waveArea = { x: 32, y: 140, w: width - 64, h: 120 };
    const centerY = waveArea.y + waveArea.h / 2;
    const maxH = waveArea.h * 0.45;
    const barW = 3;
    const barGap = 2;
    const totalBars = Math.floor(waveArea.w / (barW + barGap));
    const step = waveformData.length / Math.max(totalBars, 1);

    for (let i = 0; i < totalBars; i++) {
      const idx = Math.floor(i * step);
      const amp = waveformData[idx] || 0;
      const bh = Math.max(2, amp * maxH * 2);
      const t = i / Math.max(totalBars - 1, 1);
      const grd = ctx.createLinearGradient(0, waveArea.y, 0, waveArea.y + waveArea.h);
      grd.addColorStop(0, `rgba(255,255,255,${0.95 - t * 0.3})`);
      grd.addColorStop(1, `rgba(255,255,255,${0.5 - t * 0.2})`);
      ctx.fillStyle = grd;
      const x = waveArea.x + i * (barW + barGap);
      ctx.fillRect(x, centerY - bh / 2, barW, bh);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(waveArea.x, centerY);
    ctx.lineTo(waveArea.x + waveArea.w, centerY);
    ctx.stroke();

    if (qrDataUrl) {
      const img = new Image();
      img.onload = () => {
        const qrSize = 90;
        const qrX = width - qrSize - 32;
        const qrY = height - qrSize - 32;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);

        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('WaveMix', width - 32, height - 16);
      };
      img.src = qrDataUrl;
    }
  }, [title, author, waveformData, qrDataUrl, width, height, extractPrimaryColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }, [draw, width, height]);

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob is null'))), 'image/png');
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    } catch (e) {
      const link = document.createElement('a');
      link.download = 'wavemix-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      return false;
    }
  };

  (CardGenerator as any).copyToClipboard = copyToClipboard;
  (CardGenerator as any).exportPNG = () => canvasRef.current?.toDataURL('image/png');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.3s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(106,90,205,0.2)',
        }}
      />
    </div>
  );
};

function shadeColor(color: string, percent: number): string {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);
  R = parseInt(((R * (100 + percent)) / 100).toString());
  G = parseInt(((G * (100 + percent)) / 100).toString());
  B = parseInt(((B * (100 + percent)) / 100).toString());
  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;
  const RR = R.toString(16).padStart(2, '0');
  const GG = G.toString(16).padStart(2, '0');
  const BB = B.toString(16).padStart(2, '0');
  return `#${RR}${GG}${BB}`;
}

export default CardGenerator;
