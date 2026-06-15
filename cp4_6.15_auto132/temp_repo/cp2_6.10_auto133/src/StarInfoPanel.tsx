import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStarStore } from './store';
import { magnitudeSizes, magnitudeColors } from './starsData';

interface StarInfoPanelProps {
  onClose: () => void;
}

export default function StarInfoPanel({ onClose }: StarInfoPanelProps) {
  const { selectedConstellation, addFavorite, favorites, removeFavorite } = useStarStore();
  
  const isFavorited = selectedConstellation ? favorites.includes(selectedConstellation.id) : false;

  const handleFavoriteClick = () => {
    if (!selectedConstellation) return;
    if (isFavorited) {
      removeFavorite(selectedConstellation.id);
    } else {
      addFavorite(selectedConstellation.id);
    }
  };

  const thumbnailCanvas = useMemo(() => {
    if (!selectedConstellation) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 240;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, 360, 240);
    
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#c4956a' : '#e5b584';
      ctx.fillRect(Math.random() * 360, Math.random() * 240, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
    
    ctx.save();
    ctx.translate(180, 120);
    ctx.rotate(-Math.PI / 6);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 20px SimSun, serif';
    ctx.textAlign = 'center';
    ctx.fillText('敦煌莫高窟第61窟', 0, 0);
    ctx.restore();
    
    const allStars = selectedConstellation.stars;
    const minTheta = Math.min(...allStars.map(s => s.theta));
    const maxTheta = Math.max(...allStars.map(s => s.theta));
    const minPhi = Math.min(...allStars.map(s => s.phi));
    const maxPhi = Math.max(...allStars.map(s => s.phi));
    
    const padding = 40;
    const thetaRange = Math.max(maxTheta - minTheta, 30);
    const phiRange = Math.max(maxPhi - minPhi, 20);
    
    allStars.forEach(star => {
      const x = padding + ((star.theta - minTheta) / thetaRange) * (360 - padding * 2);
      const y = padding + ((maxPhi - star.phi) / phiRange) * (240 - padding * 2);
      const size = magnitudeSizes[star.magnitude as keyof typeof magnitudeSizes] * 10;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, magnitudeColors[star.magnitude as keyof typeof magnitudeColors]);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.font = '11px SimSun, serif';
      ctx.textAlign = 'center';
      ctx.fillText(star.name, x, y + size * 2.5 + 12);
    });
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    selectedConstellation.connections.forEach(conn => {
      const s1 = allStars[conn[0]];
      const s2 = allStars[conn[1]];
      const x1 = padding + ((s1.theta - minTheta) / thetaRange) * (360 - padding * 2);
      const y1 = padding + ((maxPhi - s1.phi) / phiRange) * (240 - padding * 2);
      const x2 = padding + ((s2.theta - minTheta) / thetaRange) * (360 - padding * 2);
      const y2 = padding + ((maxPhi - s2.phi) / phiRange) * (240 - padding * 2);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    
    return canvas;
  }, [selectedConstellation]);

  const fieldParts = selectedConstellation?.field.match(/(.+?)[，,](.+)/) || [];
  const solarTermParts = selectedConstellation?.solarTerm.match(/(.+?)[，,](.+)/) || [];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#3e2723',
        color: '#f5f5dc',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '2px solid #ffd70060',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.5)'
      }}
    >
      <AnimatePresence mode="wait">
        {selectedConstellation ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #ffd70040',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontFamily: 'SimSun, serif',
                color: '#ffd700',
                margin: 0,
                letterSpacing: '4px'
              }}>
                {selectedConstellation.name}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid #ffd70060',
                  color: '#ffd700',
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffd70020';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#ffd70060 transparent'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {thumbnailCanvas && (
                  <div style={{
                    display: 'inline-block',
                    border: '2px solid #ffd700',
                    borderRadius: '4px',
                    padding: '4px',
                    background: '#5d4037',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}>
                    <img
                      src={thumbnailCanvas.toDataURL()}
                      alt={selectedConstellation.name}
                      style={{
                        width: '180px',
                        height: 'auto',
                        display: 'block',
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  color: '#ffd700',
                  margin: '0 0 10px 0',
                  fontFamily: 'SimSun, serif',
                  borderBottom: '1px solid #ffd70040',
                  paddingBottom: '6px'
                }}>
                  星官故事
                </h3>
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  textIndent: '2em',
                  margin: 0,
                  color: '#f5f5dccc'
                }}>
                  {selectedConstellation.story}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  color: '#ffd700',
                  margin: '0 0 10px 0',
                  fontFamily: 'SimSun, serif',
                  borderBottom: '1px solid #ffd70040',
                  paddingBottom: '6px'
                }}>
                  分野节气
                </h3>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ffd70020' }}>
                      <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ffd70040', color: '#ffd700' }}>星宿</th>
                      <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ffd70040', color: '#ffd700' }}>分野</th>
                      <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ffd70040', color: '#ffd700' }}>节气</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #ffd70040', color: '#f5f5dc' }}>{selectedConstellation.name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ffd70040', color: '#f5f5dc' }}>{fieldParts[2] || selectedConstellation.field}</td>
                      <td style={{ padding: '8px', border: '1px solid #ffd70040', color: '#f5f5dc' }}>{solarTermParts[2] || selectedConstellation.solarTerm}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  color: '#ffd700',
                  margin: '0 0 10px 0',
                  fontFamily: 'SimSun, serif',
                  borderBottom: '1px solid #ffd70040',
                  paddingBottom: '6px'
                }}>
                  星官明细
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {selectedConstellation.stars.map((star, idx) => (
                    <div key={star.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 10px',
                      backgroundColor: idx % 2 === 0 ? '#ffd70010' : 'transparent',
                      borderRadius: '3px',
                      fontSize: '13px'
                    }}>
                      <div style={{
                        width: magnitudeSizes[star.magnitude as keyof typeof magnitudeSizes] * 12,
                        height: magnitudeSizes[star.magnitude as keyof typeof magnitudeSizes] * 12,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, #ffffff 0%, ${magnitudeColors[star.magnitude as keyof typeof magnitudeColors]} 50%, transparent 100%)`,
                        boxShadow: `0 0 ${magnitudeSizes[star.magnitude as keyof typeof magnitudeSizes] * 4}px ${magnitudeColors[star.magnitude as keyof typeof magnitudeColors]}`
                      }} />
                      <span style={{ flex: 1, color: '#f5f5dc' }}>{star.name}</span>
                      <span style={{ color: '#ffd70099', fontSize: '12px' }}>{star.magnitude}等星</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFavoriteClick}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: isFavorited ? '#ffd70030' : 'transparent',
                  border: '2px solid #ffd700',
                  borderRadius: '4px',
                  color: '#ffd700',
                  fontSize: '16px',
                  fontFamily: 'SimSun, serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '2px'
                }}
                onMouseEnter={(e) => {
                  if (!isFavorited) {
                    e.currentTarget.style.backgroundColor = '#ffd70020';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isFavorited) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {isFavorited ? '★ 已收藏' : '☆ 收藏星宿'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              opacity: 0.5
            }}>
              ✦
            </div>
            <h3 style={{
              fontSize: '18px',
              color: '#ffd700',
              margin: '0 0 12px 0',
              fontFamily: 'SimSun, serif'
            }}>
              星官待察
            </h3>
            <p style={{
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#f5f5dc99',
              margin: 0
            }}>
              点击穹顶星图中的星官连线，<br />
              或在右下角查询框中输入星宿名称，<br />
              即可查看详细的天文知识与星官故事。
            </p>
            <div style={{
              marginTop: '30px',
              padding: '16px',
              backgroundColor: '#ffd70010',
              borderRadius: '4px',
              border: '1px dashed #ffd70040',
              fontSize: '12px',
              color: '#f5f5dc80'
            }}>
              <div style={{ marginBottom: '8px', color: '#ffd700' }}>操作指南</div>
              <div>• 鼠标拖拽：旋转穹顶视角</div>
              <div>• 鼠标滚轮：缩放视图</div>
              <div>• 悬停星点：查看星名</div>
              <div>• 点击连线：查看星官详情</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
