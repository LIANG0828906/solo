import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATTERNS, CoinPattern, CoinData } from '../types';

interface StepPanelProps {
  activeStep: number;
  onStepComplete: (stepIndex: number, data?: unknown) => void;
  completedSteps: boolean[];
  selectedPattern: CoinPattern | null;
  generateCoinData: () => CoinData[];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const StepPanel = ({
  activeStep,
  onStepComplete,
  completedSteps,
  selectedPattern,
  generateCoinData
}: StepPanelProps) => {
  const [selectedMold, setSelectedMold] = useState<CoinPattern | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [polishProgress, setPolishProgress] = useState(0);
  const [showPolishHint, setShowPolishHint] = useState(false);
  const [strungCoins, setStrungCoins] = useState<number[]>([]);
  const [isCasting, setIsCasting] = useState(false);
  const [showSteam, setShowSteam] = useState(false);
  const [coinRevealed, setCoinRevealed] = useState(false);
  
  const polishContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const coveredAnglesRef = useRef<Set<number>>(new Set());
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const spawnParticles = useCallback((x: number, y: number, count: number, color: string, speed: number = 3) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()),
        life: 1,
        color,
        size: 3 + Math.random() * 4
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;

    const animate = () => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1,
            life: p.life - 0.02
          }))
          .filter(p => p.life > 0)
      );
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles.length]);

  useEffect(() => {
    if (activeStep !== 0) {
      setSelectedMold(null);
      setIsAnimating(false);
    }
    if (activeStep !== 1) {
      setIsCasting(false);
      setShowSteam(false);
    }
    if (activeStep !== 2) {
      setCoinRevealed(false);
    }
    if (activeStep !== 3) {
      setPolishProgress(0);
      setShowPolishHint(false);
      coveredAnglesRef.current.clear();
      isDraggingRef.current = false;
    }
    if (activeStep !== 4) {
      setStrungCoins([]);
    }
  }, [activeStep]);

  const handleMoldClick = (patternId: CoinPattern) => {
    if (isAnimating || completedSteps[0]) return;
    setSelectedMold(patternId);
    setIsAnimating(true);

    setTimeout(() => {
      spawnParticles(150, 150, 12, '#ffd700', 4);
    }, 400);

    setTimeout(() => {
      onStepComplete(0, patternId);
    }, 1000);
  };

  const handleStartCasting = () => {
    if (isCasting || completedSteps[1]) return;
    setIsCasting(true);

    setTimeout(() => {
      setShowSteam(true);
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          spawnParticles(200 + Math.random() * 50, 250, 3, 'rgba(255,255,255,0.6)', 1.5);
        }, i * 300);
      }
    }, 800);

    setTimeout(() => {
      setShowSteam(false);
      onStepComplete(1);
    }, 2500);
  };

  const handleRevealCoin = () => {
    if (coinRevealed || completedSteps[2]) return;
    setCoinRevealed(true);

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        spawnParticles(
          100 + Math.random() * 100,
          180 + Math.random() * 40,
          5,
          '#8d6e63',
          2
        );
      }, i * 80);
    }

    setTimeout(() => {
      onStepComplete(2);
    }, 1200);
  };

  const getAngleFromPosition = (clientX: number, clientY: number): number => {
    if (!polishContainerRef.current) return 0;
    const rect = polishContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    const normalizedAngle = ((angle + Math.PI) / (Math.PI * 2)) * 360;
    return Math.floor(normalizedAngle / 10) * 10;
  };

  const handlePolishMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (completedSteps[3]) return;
    isDraggingRef.current = true;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const angle = getAngleFromPosition(clientX, clientY);
    coveredAnglesRef.current.add(angle);
    updatePolishProgress();
  };

  const handlePolishMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || completedSteps[3]) return;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const angle = getAngleFromPosition(clientX, clientY);
    coveredAnglesRef.current.add(angle);
    
    if (Math.random() < 0.3) {
      const rect = polishContainerRef.current?.getBoundingClientRect();
      if (rect) {
        spawnParticles(
          clientX - rect.left,
          clientY - rect.top,
          2,
          '#b87333',
          1.5
        );
      }
    }
    
    updatePolishProgress();
  };

  const handlePolishMouseUp = () => {
    isDraggingRef.current = false;
  };

  const updatePolishProgress = useCallback(() => {
    const progress = (coveredAnglesRef.current.size / 36) * 100;
    setPolishProgress(Math.min(progress, 100));

    if (progress >= 70 && !completedSteps[3]) {
      onStepComplete(3);
    } else if (progress < 70 && completedSteps[3] === false && polishProgress > 0) {
      setShowPolishHint(true);
      setTimeout(() => setShowPolishHint(false), 2000);
    }
  }, [onStepComplete, completedSteps, polishProgress]);

  const handleStartStringing = () => {
    if (strungCoins.length > 0 || completedSteps[4]) return;

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        setStrungCoins(prev => [...prev, i]);
      }, i * 300);
    }

    setTimeout(() => {
      const coinData = generateCoinData();
      onStepComplete(4, coinData);
    }, 1800);
  };

  const renderStep0 = () => (
    <div className="step-content">
      <div className="mold-selection">
        {PATTERNS.map(pattern => (
          <div
            key={pattern.id}
            className={`mold-option ${selectedMold === pattern.id ? 'selected' : ''}`}
            onClick={() => handleMoldClick(pattern.id)}
          >
            <div className="mold-pair">
              <motion.div
                className="mold-back"
                animate={selectedMold === pattern.id ? { x: 10, y: 5 } : {}}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {pattern.characters}
              </motion.div>
              <motion.div
                className="mold-front"
                animate={selectedMold === pattern.id ? { x: 10, y: -5 } : {}}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {pattern.characters}
              </motion.div>
            </div>
            <div className="mold-name">{pattern.name}</div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="particle"
            initial={{ opacity: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: p.life
            }}
            style={{
              backgroundColor: p.color,
              width: p.size,
              height: p.size
            }}
          />
        ))}
      </AnimatePresence>
      {!completedSteps[0] && (
        <p className="hint-text">请选择一种铜钱纹样，点击模具开始制范</p>
      )}
      {completedSteps[0] && (
        <p className="hint-text">模具已合拢，纹样压制完成</p>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <div className="crucible-container">
        <motion.div
          className="crucible"
          animate={isCasting ? { rotate: -45 } : { rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="molten-copper" />
        </motion.div>
        
        {isCasting && (
          <motion.div
            className="copper-stream"
            initial={{ height: 0 }}
            animate={{ height: 150 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        )}

        <div className="mold-casting" />

        <AnimatePresence>
          {showSteam && Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`steam-${i}`}
              className="steam-particle"
              initial={{ x: 180 + Math.random() * 40, y: 250, opacity: 0, scale: 0.5 }}
              animate={{ 
                y: 150 - Math.random() * 100, 
                opacity: [0, 0.6, 0],
                scale: [0.5, 1.5, 2]
              }}
              transition={{ 
                duration: 1.5, 
                delay: i * 0.2,
                ease: 'easeOut'
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {!completedSteps[1] && !isCasting && (
        <button className="btn-coin" onClick={handleStartCasting}>
          开始浇铸
        </button>
      )}
      {completedSteps[1] && (
        <p className="hint-text">铜液灌注完成，正在冷却成型</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <div className="sand-container">
        <div className="sand" />
        <motion.div
          className="coin-in-sand"
          animate={coinRevealed ? { y: -60 } : { y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="dust-particle"
              initial={{ opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: p.life
              }}
              style={{
                width: p.size,
                height: p.size
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {!completedSteps[2] && !coinRevealed && (
        <button className="btn-coin" onClick={handleRevealCoin}>
          取出铜钱
        </button>
      )}
      {completedSteps[2] && (
        <p className="hint-text">铜钱已从砂土中取出，表面尚有余温</p>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div
      className="step-content"
      ref={polishContainerRef}
      onMouseDown={handlePolishMouseDown}
      onMouseMove={handlePolishMouseMove}
      onMouseUp={handlePolishMouseUp}
      onMouseLeave={handlePolishMouseUp}
      onTouchStart={handlePolishMouseDown}
      onTouchMove={handlePolishMouseMove}
      onTouchEnd={handlePolishMouseUp}
    >
      <div className="polishing-container">
        <div className="coin-to-polish" />
        
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="particle"
              initial={{ opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: p.life
              }}
              style={{
                backgroundColor: p.color,
                width: p.size,
                height: p.size
              }}
            />
          ))}
        </AnimatePresence>

        <div className="polish-progress">
          <div 
            className="polish-progress-fill" 
            style={{ width: `${polishProgress}%` }}
          />
        </div>

        {showPolishHint && (
          <p className="polish-hint">边缘仍有毛刺，请继续打磨</p>
        )}
      </div>

      {!completedSteps[3] && (
        <p className="hint-text">按住鼠标在铜钱边缘拖拽打磨，覆盖度达到70%以上</p>
      )}
      {completedSteps[3] && (
        <p className="hint-text">打磨完成，铜钱边缘光滑圆润</p>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <div className="stringing-container">
        <div className="hemp-rope" />
        
        {[0, 1, 2, 3, 4].map(index => (
          <motion.div
            key={`coin-${index}`}
            className={`coin-on-rope ${index % 2 === 0 ? 'patina' : index % 3 === 0 ? 'worn' : ''}`}
            initial={{ y: -150, opacity: 0 }}
            animate={strungCoins.includes(index) ? { 
              y: 50 + index * 35, 
              opacity: 1,
              rotate: Math.random() * 10 - 5
            } : {}}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15 
            }}
          />
        ))}
      </div>

      {!completedSteps[4] && strungCoins.length === 0 && (
        <button className="btn-coin" onClick={handleStartStringing}>
          开始穿绳
        </button>
      )}
      {completedSteps[4] && (
        <p className="hint-text">穿绳完成，一串精美的铜钱已成</p>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return <>{renderStepContent()}</>;
};

export default StepPanel;
