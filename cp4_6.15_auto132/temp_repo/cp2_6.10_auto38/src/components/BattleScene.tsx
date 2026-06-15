import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattleState, EnemyShip, ReedBoat as ReedBoatType } from '../hooks/useBattleState';
import { TowerShip, EnemyShipComponent, ReedBoat, ParticleComponent } from './Ship';

interface PaiganState {
  id: string;
  position: 'left-1' | 'left-2' | 'center' | 'right-1' | 'right-2';
  angle: number;
  isDragging: boolean;
  isSwinging: boolean;
  power: number;
  startX: number;
  startY: number;
}

const BattleScene: React.FC = () => {
  const {
    enemies,
    particles,
    reedBoats,
    score,
    combo,
    morale,
    battleTime,
    playerShipAngle,
    isPlayerHit,
    addScore,
    addCombo,
    setMorale,
    addEnemy,
    removeEnemy,
    updateEnemy,
    addParticle,
    removeParticle,
    addReedBoat,
    removeReedBoat,
    setPlayerShipAngle,
    setIsPlayerHit,
    updateBattleTime,
    updateComboTimer,
  } = useBattleState();

  const [paigans, setPaigans] = useState<PaiganState[]>([
    { id: 'p1', position: 'left-1', angle: 0, isDragging: false, isSwinging: false, power: 0, startX: 0, startY: 0 },
    { id: 'p2', position: 'left-2', angle: 0, isDragging: false, isSwinging: false, power: 0, startX: 0, startY: 0 },
    { id: 'p3', position: 'center', angle: 0, isDragging: false, isSwinging: false, power: 0, startX: 0, startY: 0 },
    { id: 'p4', position: 'right-1', angle: 0, isDragging: false, isSwinging: false, power: 0, startX: 0, startY: 0 },
    { id: 'p5', position: 'right-2', angle: 0, isDragging: false, isSwinging: false, power: 0, startX: 0, startY: 0 },
  ]);

  const [helmAngle, setHelmAngle] = useState(0);
  const [isDraggingHelm, setIsDraggingHelm] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const battleRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const spawnTimerRef = useRef<number>(0);
  const reedSpawnTimerRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  const getPaiganBaseX = useCallback((position: string): number => {
    if (!battleRef.current) return window.innerWidth / 2;
    const shipCenterX = window.innerWidth / 2;
    const offsets: Record<string, number> = {
      'left-1': -65,
      'left-2': -35,
      'center': 0,
      'right-1': 35,
      'right-2': 65,
    };
    return shipCenterX + offsets[position];
  }, []);

  const getPaiganBaseY = useCallback((): number => {
    return window.innerHeight * 0.55;
  }, []);

  const handlePaiganMouseDown = useCallback((e: React.MouseEvent, paiganId: string) => {
    e.preventDefault();
    setShowHint(false);
    setPaigans(prev => prev.map(p => {
      if (p.id === paiganId && !p.isSwinging) {
        return {
          ...p,
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
        };
      }
      return p;
    }));
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPaigans(prev => prev.map(p => {
      if (p.isDragging) {
        const baseX = getPaiganBaseX(p.position);
        const baseY = getPaiganBaseY();
        const dx = e.clientX - baseX;
        const dy = e.clientY - baseY;
        let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
        angle = Math.max(-60, Math.min(60, angle));
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(1, distance / 150);
        return { ...p, angle, power };
      }
      return p;
    }));

    if (isDraggingHelm) {
      const helmCenterX = window.innerWidth / 2;
      const helmCenterY = window.innerHeight - 50;
      const dx = e.clientX - helmCenterX;
      const dy = e.clientY - helmCenterY;
      const newAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      setHelmAngle(newAngle);
      const shipAngle = Math.max(-30, Math.min(30, newAngle * 0.5));
      setPlayerShipAngle(shipAngle);
    }
  }, [isDraggingHelm, getPaiganBaseX, getPaiganBaseY, setPlayerShipAngle]);

  const handleMouseUp = useCallback(() => {
    setPaigans(prev => prev.map(p => {
      if (p.isDragging && p.power > 0.1) {
        const baseX = getPaiganBaseX(p.position);
        const baseY = getPaiganBaseY();
        const stoneX = baseX + Math.sin(p.angle * Math.PI / 180) * 90;
        const stoneY = baseY - Math.cos(p.angle * Math.PI / 180) * 90;
        const vx = Math.sin(p.angle * Math.PI / 180) * p.power * 15;
        const vy = -Math.cos(p.angle * Math.PI / 180) * p.power * 15;
        checkCollision(stoneX, stoneY, vx, vy, p.power);
        return {
          ...p,
          isDragging: false,
          isSwinging: true,
          angle: p.angle * 1.5,
        };
      }
      return { ...p, isDragging: false, power: 0 };
    }));

    setTimeout(() => {
      setPaigans(prev => prev.map(p => ({
        ...p,
        isSwinging: false,
        angle: 0,
      })));
    }, 500);

    setIsDraggingHelm(false);
  }, [getPaiganBaseX, getPaiganBaseY]);

  const checkCollision = useCallback((stoneX: number, stoneY: number, vx: number, vy: number, power: number) => {
    const damage = Math.floor(power * 60) + 20;
    enemies.forEach(enemy => {
      if (enemy.isSinking) return;
      const enemyWidth = enemy.type === 'mengchong' ? 100 : 130;
      const enemyHeight = enemy.type === 'mengchong' ? 50 : 60;
      const enemyBottom = window.innerHeight * 0.18;
      const enemyTop = enemyBottom + enemyHeight;
      if (
        stoneX >= enemy.x &&
        stoneX <= enemy.x + enemyWidth &&
        stoneY >= window.innerHeight - enemyTop &&
        stoneY <= window.innerHeight - enemyBottom
      ) {
        for (let i = 0; i < 8; i++) {
          addParticle({
            id: '',
            x: stoneX,
            y: stoneY,
            vx: (Math.random() - 0.5) * 10 + vx * 0.5,
            vy: (Math.random() - 0.5) * 10 + vy * 0.5,
            life: 1,
          });
        }
        const newHp = enemy.hp - damage;
        if (newHp <= 0) {
          updateEnemy(enemy.id, { hp: 0, isSinking: true });
          addScore(enemy.type === 'mengchong' ? 100 : 150);
          addCombo();
          setMorale(Math.min(100, morale + 5));
          setTimeout(() => removeEnemy(enemy.id), 2000);
        } else {
          updateEnemy(enemy.id, { hp: newHp });
        }
      }
    });
  }, [enemies, addParticle, updateEnemy, addScore, addCombo, setMorale, morale, removeEnemy]);

  const handleHelmMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingHelm(true);
    setShowHint(false);
  }, []);

  const spawnEnemy = useCallback(() => {
    if (enemies.filter(e => !e.isSinking).length >= 5) return;
    const type: 'mengchong' | 'doujian' = Math.random() > 0.6 ? 'doujian' : 'mengchong';
    const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    const newEnemy: EnemyShip = {
      id: '',
      type,
      x: direction === 1 ? -150 : window.innerWidth + 50,
      y: window.innerHeight * 0.18,
      hp: type === 'mengchong' ? 80 : 120,
      maxHp: type === 'mengchong' ? 80 : 120,
      speed: (type === 'mengchong' ? 1.5 : 1) * direction,
      direction,
      isSinking: false,
      isGrappling: false,
    };
    addEnemy(newEnemy);
  }, [enemies, addEnemy]);

  const spawnReedBoat = useCallback(() => {
    if (reedBoats.length >= 3) return;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const newBoat: ReedBoatType = {
      id: '',
      x: direction === 1 ? -100 : window.innerWidth + 50,
      speed: direction * 0.5,
    };
    addReedBoat(newBoat);
  }, [reedBoats.length, addReedBoat]);

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      updateBattleTime(deltaTime);
      updateComboTimer(deltaTime);
      spawnTimerRef.current += deltaTime;
      if (spawnTimerRef.current > 2.5) {
        spawnEnemy();
        spawnTimerRef.current = 0;
      }
      reedSpawnTimerRef.current += deltaTime;
      if (reedSpawnTimerRef.current > 8) {
        spawnReedBoat();
        reedSpawnTimerRef.current = 0;
      }
      enemies.forEach(enemy => {
        if (enemy.isSinking) return;
        const shipCenter = window.innerWidth / 2;
        const distanceToShip = enemy.x - shipCenter;
        if (Math.abs(distanceToShip) < 120 && !enemy.isGrappling) {
          updateEnemy(enemy.id, { isGrappling: true, speed: 0 });
          setIsPlayerHit(true);
          setMorale(morale - 10);
          addScore(-20);
          setTimeout(() => setIsPlayerHit(false), 300);
          setTimeout(() => {
            updateEnemy(enemy.id, { isGrappling: false, speed: enemy.type === 'mengchong' ? 1.5 * enemy.direction : 1 * enemy.direction });
          }, 1500);
        } else if (!enemy.isGrappling) {
          updateEnemy(enemy.id, { x: enemy.x + enemy.speed });
        }
      });
      const activeEnemies = enemies.filter(e => !e.isSinking);
      activeEnemies.forEach(enemy => {
        if (enemy.x < -200 || enemy.x > window.innerWidth + 200) {
          removeEnemy(enemy.id);
        }
      });
      reedBoats.forEach(boat => {
        const newX = boat.x + boat.speed;
        if (newX < -100 || newX > window.innerWidth + 100) {
          removeReedBoat(boat.id);
        } else {
          addReedBoat({ ...boat, x: newX });
          removeReedBoat(boat.id);
        }
      });
      particles.forEach(particle => {
        const newLife = particle.life - deltaTime * 1.5;
        if (newLife <= 0) {
          removeParticle(particle.id);
        }
      });
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enemies, particles, reedBoats, morale, updateBattleTime, updateComboTimer, spawnEnemy, spawnReedBoat, updateEnemy, removeEnemy, addReedBoat, removeReedBoat, removeParticle, addScore, setMorale, setIsPlayerHit]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clouds = [
    { top: '10%', width: 150, height: 40, delay: 0 },
    { top: '25%', width: 200, height: 50, delay: -20 },
    { top: '40%', width: 120, height: 35, delay: -40 },
  ];

  return (
    <div ref={battleRef} className="battle-container">
      <div className="sky">
        {clouds.map((cloud, i) => (
          <div
            key={i}
            className="cloud"
            style={{
              top: cloud.top,
              width: cloud.width,
              height: cloud.height,
              animationDelay: `${cloud.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="water-surface">
        <div className="wave" />
        <div className="wave" />
      </div>

      <div className="ui-panel morale-panel">
        <div className="morale-label">士气值</div>
        <div className="morale-bar">
          <motion.div
            className="morale-fill"
            initial={{ width: '100%' }}
            animate={{ width: `${morale}%` }}
          />
        </div>
      </div>

      <div className="ui-panel score-panel">
        <div className="score-label">战功积分</div>
        <div className="score-value">{score}</div>
        <AnimatePresence>
          {combo > 0 && (
            <motion.div
              className="combo-text"
              key={combo}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {combo >= 3 ? '旗开得胜！' : ''} 连击 x{combo}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ui-panel time-panel">
        战斗时长：{formatTime(battleTime)}
      </div>

      {reedBoats.map(boat => (
        <ReedBoat key={boat.id} x={boat.x} />
      ))}

      <TowerShip angle={playerShipAngle} isHit={isPlayerHit}>
        <div className="paigan-group">
          {paigans.map(paigan => (
            <motion.div
              key={paigan.id}
              className={`paigan paigan-${paigan.position} ${paigan.isDragging ? 'dragging' : ''}`}
              animate={{
                rotate: paigan.angle,
              }}
              transition={{
                type: paigan.isSwinging ? 'spring' : 'tween',
                stiffness: paigan.isSwinging ? 300 : 100,
                damping: paigan.isSwinging ? 10 : 20,
              }}
              onMouseDown={(e) => handlePaiganMouseDown(e, paigan.id)}
            >
              <div className="paigan-stone" />
            </motion.div>
          ))}
        </div>
      </TowerShip>

      {enemies.map(enemy => (
        <EnemyShipComponent key={enemy.id} ship={enemy} />
      ))}

      {particles.map(particle => (
        <ParticleComponent
          key={particle.id}
          x={particle.x}
          y={particle.y}
          vx={particle.vx}
          vy={particle.vy}
          life={particle.life}
        />
      ))}

      <div
        className="helm"
        onMouseDown={handleHelmMouseDown}
      >
        <motion.div
          className="helm-wheel"
          animate={{ rotate: helmAngle }}
          transition={{ type: 'spring', stiffness: 100, damping: 30 }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="helm-spoke"
              style={{ transform: `rotate(${i * 45}deg) translateY(-17px)` }}
            />
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {showHint && (
          <motion.div
            className="hint-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 1 }}
          >
            <div style={{ marginBottom: 10 }}>👆 拖拽拍竿（木柱）甩动巨石攻击敌船</div>
            <div>👇 转动船舵调整楼船方向</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleScene;
