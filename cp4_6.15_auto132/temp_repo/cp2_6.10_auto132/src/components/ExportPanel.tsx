import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLampStore, getOrderedScreens } from '../store/lampStore';

export const ExportPanel: React.FC = () => {
  const { screens, screenOrder } = useLampStore();
  const orderedScreens = getOrderedScreens(screens, screenOrder);
  const [showPreview, setShowPreview] = useState(false);
  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateScrollImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const screenWidth = 150;
    const screenHeight = 200;
    const totalWidth = screenWidth * 6 + 60;
    const totalHeight = screenHeight + 80;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    const gradient = ctx.createLinearGradient(0, 0, 0, totalHeight);
    gradient.addColorStop(0, '#f5e6cc');
    gradient.addColorStop(0.5, '#ebe0cc');
    gradient.addColorStop(1, '#f5e6cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(0, 0, totalWidth, 25);
    ctx.fillRect(0, totalHeight - 25, totalWidth, 25);

    for (let i = 0; i < totalWidth; i += 8) {
      ctx.fillStyle = i % 16 === 0 ? '#6d4c41' : '#8b5e3c';
      ctx.fillRect(i, 0, 4, 25);
      ctx.fillRect(i, totalHeight - 25, 4, 25);
    }

    ctx.fillStyle = '#5d4037';
    ctx.fillRect(10, 30, 20, screenHeight + 20);
    ctx.fillRect(totalWidth - 30, 30, 20, screenHeight + 20);

    for (let i = 0; i < 6; i++) {
      const x = 40 + i * (screenWidth + 5);
      const y = 40;

      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, screenWidth + 4, screenHeight + 4);

      ctx.strokeStyle = '#8b5e3c';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, screenWidth, screenHeight);

      const screen = orderedScreens[i];
      if (screen) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = screenWidth;
        tempCanvas.height = screenHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          const silkGradient = tempCtx.createLinearGradient(0, 0, screenWidth, screenHeight);
          silkGradient.addColorStop(0, '#f5e6cc');
          silkGradient.addColorStop(0.5, '#e8d5b0');
          silkGradient.addColorStop(1, '#f5e6cc');
          tempCtx.fillStyle = silkGradient;
          tempCtx.fillRect(0, 0, screenWidth, screenHeight);

          const [c1, c2, _c3, _c4, _c5] = screen.colors;

          const drawPattern = () => {
            tempCtx.save();
            switch (screen.pattern) {
              case 'flowers-birds':
                tempCtx.fillStyle = c1;
                tempCtx.globalAlpha = 0.8;
                tempCtx.beginPath();
                tempCtx.ellipse(45, 130, 30, 20, 0, 0, Math.PI * 2);
                tempCtx.fill();
                tempCtx.fillStyle = c2;
                tempCtx.globalAlpha = 0.7;
                tempCtx.beginPath();
                tempCtx.ellipse(50, 125, 25, 15, 0, 0, Math.PI * 2);
                tempCtx.fill();
                tempCtx.globalAlpha = 1;
                break;
            }
            tempCtx.restore();
          };

          drawPattern();
          ctx.drawImage(tempCanvas, x, y);
        }

        ctx.fillStyle = '#3e2723';
        ctx.font = 'bold 12px "Ma Shan Zheng", serif';
        ctx.textAlign = 'center';
        ctx.fillText(screen.title, x + screenWidth / 2, y + screenHeight + 15);

        ctx.fillStyle = '#5d4037';
        ctx.font = '10px serif';
        ctx.fillText(`${screen.dynasty}·${screen.author}`, x + screenWidth / 2, y + screenHeight + 28);
      }
    }

    ctx.fillStyle = '#5d4037';
    ctx.font = 'bold 16px "Ma Shan Zheng", serif';
    ctx.textAlign = 'center';
    ctx.fillText('月华轩·走马灯六屏卷轴', totalWidth / 2, 18);

    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日制`;
    ctx.fillStyle = '#8b5e3c';
    ctx.font = '10px serif';
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, totalWidth - 15, totalHeight - 8);

    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.arc(30, totalHeight - 40, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px "Ma Shan Zheng", serif';
    ctx.textAlign = 'center';
    ctx.fillText('月', 30, totalHeight - 36);

    const dataUrl = canvas.toDataURL('image/png');
    setExportedImage(dataUrl);
    setShowPreview(true);
  }, [orderedScreens]);

  const handleExport = () => {
    generateScrollImage();
  };

  const handleDownload = () => {
    if (exportedImage) {
      const link = document.createElement('a');
      link.download = '月华轩走马灯六屏卷轴.png';
      link.href = exportedImage;
      link.click();
    }
  };

  return (
    <>
      <motion.button
        onClick={handleExport}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #c62828 0%, #8b0000 100%)',
          color: '#fff',
          border: '2px solid #5d4037',
          borderRadius: '6px',
          fontFamily: "'Ma Shan Zheng', cursive",
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(198, 40, 40, 0.4)',
          width: '100%',
          letterSpacing: '2px'
        }}
        whileHover={{ scale: 1.02, boxShadow: '0 6px 16px rgba(198, 40, 40, 0.5)' }}
        whileTap={{ scale: 0.98 }}
      >
        📜 导出六屏卷轴
      </motion.button>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <AnimatePresence>
        {showPreview && (
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
              padding: '20px'
            }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #f5e6cc 0%, #e8d5b0 100%)',
                borderRadius: '12px',
                padding: '24px',
                border: '4px solid #8b5e3c',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                maxWidth: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <h2
                style={{
                  fontFamily: "'Ma Shan Zheng', cursive",
                  color: '#5d4037',
                  fontSize: '28px',
                  margin: '0 0 16px 0',
                  textAlign: 'center'
                }}
              >
                六屏画卷轴预览
              </h2>

              <div
                style={{
                  overflow: 'auto',
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  border: '3px solid #5d4037',
                  borderRadius: '4px',
                  background: '#fff',
                  padding: '10px'
                }}
              >
                {exportedImage && (
                  <img
                    src={exportedImage}
                    alt="六屏卷轴"
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '20px'
                }}
              >
                <motion.button
                  onClick={handleDownload}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                    color: '#fff',
                    border: '2px solid #1b5e20',
                    borderRadius: '6px',
                    fontFamily: "'Ma Shan Zheng', cursive",
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.4)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💾 右键另存为 PNG
                </motion.button>

                <motion.button
                  onClick={() => setShowPreview(false)}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #757575 0%, #424242 100%)',
                    color: '#fff',
                    border: '2px solid #424242',
                    borderRadius: '6px',
                    fontFamily: "'Ma Shan Zheng', cursive",
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  关闭
                </motion.button>
              </div>

              <div
                style={{
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#6d4c41',
                  textAlign: 'center'
                }}
              >
                💡 提示：在图片上点击右键，选择「图片另存为」即可保存
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
