import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SymbolDetector } from '../symbols/SymbolDetector';

interface SymbolInfo {
  symbolId: number;
  symbolName: string;
  completedAt: number;
}

interface SymbolContent {
  name: string;
  era: string;
  description: string;
}

const SYMBOL_CONTENTS: SymbolContent[] = [
  {
    name: '螺旋纹',
    era: '约公元前5000年 - 新石器时代仰韶文化',
    description: '螺旋纹是仰韶文化彩陶中最具代表性的装饰纹样之一，常见于盆、钵、壶等器物的腹部。学者认为其象征水涡或生命轮回的观念，反映了先民对自然现象的观察与抽象表达。螺旋的循环形态可能与太阳运行、季节更替以及生命繁衍的哲学思考有关。'
  },
  {
    name: '三角纹',
    era: '约公元前2500年 - 龙山文化晚期',
    description: '三角纹在龙山文化晚期大量出现，多以倒三角或正三角的连续排列形式装饰器物。考古学界普遍认为其代表山川地貌，也有观点认为是男性崇拜的符号表达。三角的稳定结构象征着先民对天地宇宙的初步认知，是父系氏族社会确立后的典型艺术表现。'
  },
  {
    name: '圆圈纹',
    era: '约公元前3300年 - 马家窑文化',
    description: '马家窑文化的圆圈纹构图饱满，常与涡纹、网纹组合使用。圆圈通常象征太阳或月亮，部分内部填充十字纹或点纹，可能代表日月星辰的运行轨迹。这种装饰纹样反映了先民发达的天文观测能力和对天体崇拜的宗教观念。'
  },
  {
    name: '波浪纹',
    era: '约公元前5000年 - 河姆渡文化',
    description: '波浪纹是河姆渡文化陶器的主要装饰纹样，以连续起伏的曲线表现河流或水神。因河姆渡遗址毗邻江海，水波纹样体现了水居民族对水环境的依赖与敬畏。部分学者认为波浪纹也可能是蛇纹的抽象化，与南方百越民族的龙蛇崇拜有渊源关系。'
  },
  {
    name: '太阳纹',
    era: '约公元前4300年 - 大汶口文化',
    description: '大汶口文化的太阳纹多刻划于大口尊的腹部，由圆形日轮和放射状芒线组成，是太阳神崇拜的直接体现。这类符号被认为是中国最早的象形文字雏形之一，可能与祭祀日月的宗教活动密切相关。太阳纹的出现标志着先民已经形成了系统的自然神祇信仰体系。'
  },
  {
    name: '兽面纹',
    era: '约公元前2000年 - 新石器时代晚期',
    description: '兽面纹以对称的双目、口鼻为核心构图，是青铜时代饕餮纹的前身。研究者认为其源于先民对动物神灵的敬畏与崇拜，具有通天地、协上下的巫术功能。兽面纹的演化序列清晰地展示了从新石器时代到青铜时代礼仪制度的传承与变革。'
  },
  {
    name: '编织纹',
    era: '约公元前4000年 - 仰韶文化晚期',
    description: '编织纹模拟竹、藤、草编的肌理效果，包括席纹、篮纹、绳纹等多种类型。这类纹样不仅是装饰，更反映了史前编织工艺的发达程度。学者通过对编织纹的分析，可以复原先民的纺织技术水平和日常器用的形态特征。'
  },
  {
    name: '神人纹',
    era: '约公元前3000年 - 良渚文化',
    description: '良渚文化的神人纹刻划精细，通常表现为头戴羽冠、身披兽皮的巫师形象，被认为是神权与王权合一的象征。这类纹样常见于玉琮等礼器上，反映了良渚社会复杂的宗教信仰体系和等级制度。神人纹的发现为研究中国早期国家形态提供了重要的实物资料。'
  }
];

const SYMBOL_COLORS: string[] = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dfe6e9',
  '#fd79a8',
  '#a29bfe'
];

const ERA_MAP: string[] = [
  '约公元前5000年 - 新石器时代仰韶文化',
  '约公元前2500年 - 龙山文化晚期',
  '约公元前3300年 - 马家窑文化',
  '约公元前5000年 - 河姆渡文化',
  '约公元前4300年 - 大汶口文化',
  '约公元前2000年 - 新石器时代晚期',
  '约公元前4000年 - 仰韶文化晚期',
  '约公元前3000年 - 良渚文化'
];

interface InfoPanelProps {
  symbolDetector: SymbolDetector | null;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ symbolDetector }) => {
  const [collectedSymbols, setCollectedSymbols] = useState<SymbolInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const parchmentCanvasRef = useRef<HTMLCanvasElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!symbolDetector) return;

    const handleSymbolCompleted = (event: {
      symbolId: number;
      symbolName: string;
      completedAt: number;
    }) => {
      setCollectedSymbols((prev) => {
        const exists = prev.some((s) => s.symbolId === event.symbolId);
        if (exists) return prev;
        const newSymbols = [
          ...prev,
          {
            symbolId: event.symbolId,
            symbolName: event.symbolName,
            completedAt: event.completedAt
          }
        ];
        setCurrentIndex(newSymbols.length - 1);
        setIsVisible(true);
        return newSymbols;
      });
    };

    symbolDetector.on('symbolCompleted', handleSymbolCompleted);

    return () => {
      symbolDetector.off('symbolCompleted', handleSymbolCompleted);
    };
  }, [symbolDetector]);

  useEffect(() => {
    const canvas = parchmentCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5;
      const alpha = Math.random() * 0.15;
      const hue = 30 + Math.random() * 20;
      ctx.fillStyle = `hsla(${hue}, 30%, ${20 + Math.random() * 20}%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = 20 + Math.random() * 80;
      const angle = Math.random() * Math.PI * 2;
      const alpha = Math.random() * 0.08;
      ctx.strokeStyle = `rgba(139, 119, 85, ${alpha})`;
      ctx.lineWidth = 0.5 + Math.random() * 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      );
      ctx.stroke();
    }

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width * 0.7
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(139, 119, 85, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, [isVisible]);

  useEffect(() => {
    const canvas = photoCanvasRef.current;
    if (!canvas || currentIndex < 0) return;

    const currentSymbol = collectedSymbols[currentIndex];
    if (!currentSymbol) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const symbolId = currentSymbol.symbolId;
    const baseColor = SYMBOL_COLORS[symbolId % SYMBOL_COLORS.length] || '#ff6b6b';

    ctx.fillStyle = '#faf0e6';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#d4c4a8';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    const cx = width / 2;
    const cy = height / 2;
    const patternType = symbolId % 5;

    ctx.save();
    ctx.translate(cx, cy);

    if (patternType === 0) {
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.3 + i * 0.15;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(40, -20, 0, -60);
        ctx.quadraticCurveTo(-40, -20, 0, 0);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      let r = 8;
      let angle = 0;
      ctx.beginPath();
      for (let j = 0; j < 80; j++) {
        angle += 0.3;
        r += 0.5;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    } else if (patternType === 1) {
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        const gradient = ctx.createLinearGradient(0, -50, 0, 0);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, adjustColor(baseColor, 40));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(-25, 0);
        ctx.lineTo(25, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = adjustColor(baseColor, -30);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (patternType === 2) {
      for (let i = 4; i > 0; i--) {
        const radius = i * 12;
        const alpha = 0.2 + (5 - i) * 0.15;
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const gradient = ctx.createLinearGradient(
          Math.cos(angle) * 15,
          Math.sin(angle) * 15,
          Math.cos(angle) * 45,
          Math.sin(angle) * 45
        );
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, adjustColor(baseColor, 30));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
        ctx.lineTo(Math.cos(angle - 0.15) * 50, Math.sin(angle - 0.15) * 50);
        ctx.lineTo(Math.cos(angle + 0.15) * 50, Math.sin(angle + 0.15) * 50);
        ctx.closePath();
        ctx.fill();
      }
    } else if (patternType === 3) {
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 3;
      for (let i = -3; i <= 3; i++) {
        const yOffset = i * 12;
        ctx.globalAlpha = 0.3 + Math.abs(i) * 0.1;
        ctx.beginPath();
        for (let x = -60; x <= 60; x += 5) {
          const y = Math.sin((x + currentIndex * 10) * 0.08) * 15 + yOffset;
          if (x === -60) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = adjustColor(baseColor, -20);
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const innerR = 30;
        const outerR = 55;
        const gradient = ctx.createLinearGradient(
          Math.cos(angle) * innerR,
          Math.sin(angle) * innerR,
          Math.cos(angle) * outerR,
          Math.sin(angle) * outerR
        );
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, adjustColor(baseColor, 50));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle - 0.1) * innerR, Math.sin(angle - 0.1) * innerR);
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        ctx.lineTo(Math.cos(angle + 0.1) * innerR, Math.sin(angle + 0.1) * innerR);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();

    ctx.fillStyle = 'rgba(139, 119, 85, 0.1)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 1, 1);
    }
  }, [currentIndex, collectedSymbols]);

  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.min(255, Math.max(0, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.min(255, Math.max(0, parseInt(hex.slice(4, 6), 16) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleClose = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setIsVisible(false);
    }, 300);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(collectedSymbols.length - 1, prev + 1));
  }, [collectedSymbols.length]);

  const currentSymbol = currentIndex >= 0 ? collectedSymbols[currentIndex] : null;
  const symbolContent = currentSymbol
    ? SYMBOL_CONTENTS[currentSymbol.symbolId % SYMBOL_CONTENTS.length]
    : null;

  if (!isVisible || !currentSymbol || !symbolContent) {
    return null;
  }

  const symbolId = currentSymbol.symbolId;
  const era = ERA_MAP[symbolId % ERA_MAP.length] || symbolContent.era;

  return (
    <div className="info-panel-wrapper" style={styles.wrapper}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(120%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(8px) rotate(1deg); }
        }

        .info-panel-card {
          animation: slideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .info-panel-card.shaking {
          animation: shake 0.3s ease-in-out forwards;
        }

        .nav-btn:hover {
          background: rgba(205, 127, 50, 0.3);
        }

        .nav-btn:active {
          transform: scale(0.95);
        }

        .close-btn:hover {
          background: rgba(205, 127, 50, 0.2);
        }

        .close-btn:active {
          transform: scale(0.9);
        }
      `}</style>

      <div
        className={`info-panel-card ${isShaking ? 'shaking' : ''}`}
        style={styles.card}
      >
        <canvas
          ref={parchmentCanvasRef}
          width={360}
          height={560}
          style={styles.parchmentCanvas}
        />

        <div style={styles.content}>
          <button
            className="close-btn"
            onClick={handleClose}
            style={styles.closeBtn}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div style={styles.header}>
            <h1 style={styles.title}>{symbolContent.name}</h1>
            <p style={styles.subtitle}>{era}</p>
          </div>

          <div style={styles.photoContainer}>
            <canvas
              ref={photoCanvasRef}
              width={280}
              height={180}
              style={styles.photoCanvas}
            />
            <p style={styles.photoCaption}>
              文物编号：SW-{String(symbolId).padStart(4, '0')}
            </p>
          </div>

          <div style={styles.descriptionContainer}>
            <p style={styles.description}>{symbolContent.description}</p>
          </div>

          <div style={styles.footer}>
            <div style={styles.progress}>
              {currentIndex + 1} / {collectedSymbols.length}
            </div>
            <div style={styles.navButtons}>
              <button
                className="nav-btn"
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                style={{
                  ...styles.navBtn,
                  opacity: currentIndex <= 0 ? 0.4 : 1,
                  cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                className="nav-btn"
                onClick={handleNext}
                disabled={currentIndex >= collectedSymbols.length - 1}
                style={{
                  ...styles.navBtn,
                  opacity: currentIndex >= collectedSymbols.length - 1 ? 0.4 : 1,
                  cursor: currentIndex >= collectedSymbols.length - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    zIndex: 1000,
    pointerEvents: 'none'
  },
  card: {
    position: 'relative',
    width: '360px',
    minHeight: '560px',
    borderRadius: '12px',
    border: '3px solid #CD7F32',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 60px rgba(139, 119, 85, 0.1)',
    overflow: 'hidden',
    pointerEvents: 'auto'
  },
  parchmentCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    borderRadius: '9px'
  },
  content: {
    position: 'relative',
    zIndex: 1,
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '560px'
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid rgba(205, 127, 50, 0.5)',
    background: 'rgba(245, 230, 200, 0.6)',
    color: '#3E2723',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    padding: 0
  },
  header: {
    marginBottom: '20px',
    paddingRight: '40px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#3E2723',
    margin: '0 0 8px 0',
    fontFamily: 'Georgia, "楷体", "KaiTi", serif',
    letterSpacing: '2px',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)'
  },
  subtitle: {
    fontSize: '14px',
    color: '#5D4037',
    margin: 0,
    fontFamily: 'Georgia, "楷体", "KaiTi", serif',
    fontStyle: 'italic',
    opacity: 0.9
  },
  photoContainer: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  photoCanvas: {
    width: '100%',
    height: '180px',
    borderRadius: '8px',
    border: '2px solid rgba(205, 127, 50, 0.4)',
    display: 'block'
  },
  photoCaption: {
    fontSize: '11px',
    color: '#6D4C41',
    margin: '8px 0 0 0',
    fontFamily: '"Courier New", monospace',
    opacity: 0.8
  },
  descriptionContainer: {
    flex: 1,
    marginBottom: '20px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  description: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#3E2723',
    margin: 0,
    fontFamily: 'Georgia, "宋体", "SimSun", serif',
    textAlign: 'justify',
    textIndent: '2em'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid rgba(205, 127, 50, 0.3)'
  },
  progress: {
    fontSize: '14px',
    color: '#5D4037',
    fontFamily: 'Georgia, serif',
    fontWeight: 600
  },
  navButtons: {
    display: 'flex',
    gap: '12px'
  },
  navBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid rgba(205, 127, 50, 0.6)',
    background: 'rgba(245, 230, 200, 0.8)',
    color: '#3E2723',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    padding: 0
  }
};

export default InfoPanel;
