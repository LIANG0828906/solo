import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import { FinishedDish, getDonenessColor } from '../CookingEngine';

interface DishPlateProps {
  dish: FinishedDish | null;
  onClose: () => void;
}

const DishPlate: React.FC<DishPlateProps> = ({ dish, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dish || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 400;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      200
    );
    gradient.addColorStop(0, 'rgba(78, 52, 46, 0.9)');
    gradient.addColorStop(1, 'rgba(30, 20, 18, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const plateX = width / 2;
    const plateY = height / 2 + 20;
    const plateRadius = 150;

    ctx.beginPath();
    ctx.ellipse(plateX, plateY + 10, plateRadius, plateRadius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const offset = i * 5;
      ctx.beginPath();
      ctx.ellipse(plateX, plateY, plateRadius - offset, plateRadius * 0.35 - offset * 0.2, 0, 0, Math.PI * 2);
      if (i === 0) {
        const plateGradient = ctx.createLinearGradient(0, plateY - 50, 0, plateY + 50);
        plateGradient.addColorStop(0, '#e3f2fd');
        plateGradient.addColorStop(0.3, '#bbdefb');
        plateGradient.addColorStop(0.7, '#90caf9');
        plateGradient.addColorStop(1, '#64b5f6');
        ctx.fillStyle = plateGradient;
        ctx.fill();
      } else if (i === 1) {
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = '#0d47a1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    ctx.beginPath();
    ctx.ellipse(plateX, plateY, plateRadius - 20, plateRadius * 0.3 - 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e3f2fd';
    ctx.fill();

    const layers = Math.min(dish.foods.length * 2, 6);
    for (let layer = 0; layer < layers; layer++) {
      const layerY = plateY - layer * 12;
      const layerScale = 1 - layer * 0.12;
      const foodIndex = layer % dish.foods.length;
      const food = dish.foods[foodIndex];
      const color = getDonenessColor(food.doneness, food.ingredient.color);

      const pieces = 5 - Math.floor(layer / 2);
      for (let i = 0; i < pieces; i++) {
        const angle = (i / pieces) * Math.PI * 2 + layer * 0.3;
        const radius = (50 - layer * 5) * layerScale;
        const x = plateX + Math.cos(angle) * radius * 1.5;
        const y = layerY + Math.sin(angle) * radius * 0.5;
        const size = (12 + Math.random() * 8) * layerScale;

        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, angle, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(x - size * 0.2, y - size * 0.2, size * 0.3, size * 0.15, angle, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
      }
    }

    if (dish.foods.length > 0) {
      const topColor = getDonenessColor(
        dish.foods[0].doneness,
        dish.foods[0].ingredient.color
      );
      ctx.beginPath();
      ctx.ellipse(plateX, plateY - layers * 12, 25, 10, 0, 0, Math.PI * 2);
      const topGradient = ctx.createRadialGradient(
        plateX,
        plateY - layers * 12,
        0,
        plateX,
        plateY - layers * 12,
        25
      );
      topGradient.addColorStop(0, topColor);
      topGradient.addColorStop(1, adjustColor(topColor, -30));
      ctx.fillStyle = topGradient;
      ctx.fill();
    }

    ctx.save();
    ctx.translate(plateX - 40, 35);
    ctx.fillStyle = '#0d47a1';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(80, 0);
    ctx.quadraticCurveTo(85, 0, 85, 5);
    ctx.lineTo(85, 20);
    ctx.quadraticCurveTo(85, 25, 80, 25);
    ctx.lineTo(0, 25);
    ctx.quadraticCurveTo(-5, 25, -5, 20);
    ctx.lineTo(-5, 5);
    ctx.quadraticCurveTo(-5, 0, 0, 0);
    ctx.fill();
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '14px "Ma Shan Zheng", cursive';
    ctx.textAlign = 'center';
    ctx.fillText(dish.evaluation.rating, 40, 18);
    ctx.restore();

    ctx.save();
    ctx.translate(plateX - 60, height - 50);
    ctx.fillStyle = 'rgba(62, 39, 35, 0.9)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 120, 35, 8);
    ctx.fill();
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`品质: ${dish.evaluation.quality}/100`, 60, 24);
    ctx.restore();

    ctx.fillStyle = '#d4a373';
    ctx.font = '20px "Ma Shan Zheng", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('宋氏庖厨', plateX, 60);
  }, [dish]);

  const adjustColor = (color: string, amount: number): string => {
    const hex = (c: string) => parseInt(c, 16);
    const r = Math.max(0, Math.min(255, hex(color.slice(1, 3)) + amount));
    const g = Math.max(0, Math.min(255, hex(color.slice(3, 5)) + amount));
    const b = Math.max(0, Math.min(255, hex(color.slice(5, 7)) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `庖厨佳肴_${Date.now()}.png`);
        }
      });
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (!dish) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, type: 'spring', bounce: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(180deg, #5d4037 0%, #3e2723 100%)',
            borderRadius: 20,
            padding: 30,
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <h2
            style={{
              color: '#d4a373',
              fontSize: 28,
              margin: 0,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            菜肴成品
          </h2>

          <motion.div
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              perspective: 1000,
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </motion.div>

          <div
            style={{
              width: '100%',
              background: 'rgba(62, 39, 35, 0.8)',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 32,
                color:
                  dish.evaluation.rating === '绝味'
                    ? '#ffd700'
                    : dish.evaluation.rating === '刚好'
                    ? '#81c784'
                    : dish.evaluation.rating === '焦糊'
                    ? '#e57373'
                    : '#ffb74d',
                marginBottom: 8,
                textShadow: `0 0 20px currentColor`,
              }}
            >
              {dish.evaluation.rating}
            </div>
            <p
              style={{
                color: '#d7ccc8',
                fontSize: 14,
                lineHeight: 1.6,
                margin: 0,
                fontFamily: 'system-ui',
              }}
            >
              {dish.evaluation.comment}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              width: '100%',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: '14px 20px',
                fontSize: 16,
                background: 'linear-gradient(135deg, #8d6e63 0%, #5d4037 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {saving ? '保存中...' : '保存图片'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={handleCopyToClipboard}
              style={{
                flex: 1,
                padding: '14px 20px',
                fontSize: 16,
                background: copied
                  ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)'
                  : 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {copied ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  复制图片
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                padding: '14px 20px',
                fontSize: 16,
                background: 'linear-gradient(135deg, #757575 0%, #424242 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              关闭
            </motion.button>
          </div>

          <div
            style={{
              color: '#8d6e63',
              fontSize: 12,
              fontFamily: 'system-ui',
            }}
          >
            提示：右键点击图片可另存为
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DishPlate;
