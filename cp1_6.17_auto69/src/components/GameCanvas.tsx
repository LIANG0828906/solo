import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerController } from '../game/PlayerControl';
import { generateAsteroids, renderAsteroid, splitAsteroid } from '../game/AsteroidField';
import { checkMiningRange, performMining, renderMiningBeam } from '../game/MiningSystem';
import { renderBullet, renderShield, checkBulletShipCollision, checkBulletShieldCollision } from '../game/CombatSystem';
import { ParticleEngine } from '../game/ParticleEngine';
import { SpatialHashGrid } from '../game/SpatialHash';
import { audioManager } from '../game/AudioManager';
import type { Ship, Asteroid, Bullet, Particle } from '../game/types';
import { UpgradePanel } from '../ui/UpgradePanel';

interface HasId {
  id: string;
}

interface ShipObj extends Ship, HasId {
  radius: number;
}
interface AsteroidObj extends Asteroid, HasId {
  radius: number;
}
interface BulletObj extends Bullet, HasId {
  radius: number;
}

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const playerCtrlRef = useRef<PlayerController>(new PlayerController());
  const particleEngineRef = useRef<ParticleEngine>(new ParticleEngine());
  const miningSoundTimersRef = useRef<Map<string, number>>(new Map());
  const prevBulletsRef = useRef<Set<string>>(new Set());
  const prevShieldsRef = useRef<Map<string, boolean>>(new Map());
  const prevKillsRef = useRef<Map<string, number>>(new Map());

  const [upgradeForShip, setUpgradeForShip] = useState<string | null>(null);

  const gameState = useGameStore((s) => s.gameState);
  const canvasWidth = useGameStore((s) => s.canvasWidth);
  const canvasHeight = useGameStore((s) => s.canvasHeight);
  const initGame = useGameStore((s) => s.initGame);
  const setCanvasSize = useGameStore((s) => s.setCanvasSize);
  const updateShip = useGameStore((s) => s.updateShip);
  const removeAsteroid = useGameStore((s) => s.removeAsteroid);
  const updateAsteroid = useGameStore((s) => s.updateAsteroid);
  const addBullet = useGameStore((s) => s.addBullet);
  const removeBullet = useGameStore((s) => s.removeBullet);
  const updateBullet = useGameStore((s) => s.updateBullet);
  const activateShield = useGameStore((s) => s.activateShield);
  const damageShip = useGameStore((s) => s.damageShip);
  const collectMinerals = useGameStore((s) => s.collectMinerals);
  const startMining = useGameStore((s) => s.startMining);
  const stopMining = useGameStore((s) => s.stopMining);
  const addKill = useGameStore((s) => s.addKill);
  const endGame = useGameStore((s) => s.endGame);
  const addParticle = useGameStore((s) => s.addParticle);
  const removeParticle = useGameStore((s) => s.removeParticle);
  const updateParticle = useGameStore((s) => s.updateParticle);

  const ships = useGameStore((s) => s.ships);
  const asteroids = useGameStore((s) => s.asteroids);
  const bullets = useGameStore((s) => s.bullets);
  const particles = useGameStore((s) => s.particles);
  const players = useGameStore((s) => s.players);
  const winnerId = useGameStore((s) => s.winnerId);

  const shipsRef = useRef(ships);
  const asteroidsRef = useRef(asteroids);
  const bulletsRef = useRef(bullets);
  const particlesRef = useRef(particles);
  const playersRef = useRef(players);
  const winnerRef = useRef(winnerId);
  const upgradeForShipRef = useRef(upgradeForShip);

  useEffect(() => { shipsRef.current = ships; }, [ships]);
  useEffect(() => { asteroidsRef.current = asteroids; }, [asteroids]);
  useEffect(() => { bulletsRef.current = bullets; }, [bullets]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { winnerRef.current = winnerId; }, [winnerId]);
  useEffect(() => { upgradeForShipRef.current = upgradeForShip; }, [upgradeForShip]);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setCanvasSize(w, h);
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCanvasSize]);

  useEffect(() => {
    const ctrl = playerCtrlRef.current;
    const onKeyDown = (e: KeyboardEvent) => {
      ctrl.handleKeyDown(e, 1);
      ctrl.handleKeyDown(e, 2);
      if (e.code === 'Digit1' && shipsRef.current[0] && shipsRef.current[0].minerals >= 50) {
        setUpgradeForShip(shipsRef.current[0].id);
      }
      if (e.code === 'Digit2' && shipsRef.current[1] && shipsRef.current[1].minerals >= 50) {
        setUpgradeForShip(shipsRef.current[1].id);
      }
      if (e.code === 'Escape') {
        setUpgradeForShip(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      ctrl.handleKeyUp(e, 1);
      ctrl.handleKeyUp(e, 2);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const gameLoop = useCallback((time: number) => {
    if (gameState !== 'playing' || upgradeForShipRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      lastTimeRef.current = time;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    let deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
    deltaTime = Math.min(deltaTime, 1 / 30);
    lastTimeRef.current = time;

    let curShips = shipsRef.current.map(s => ({ ...s, position: { ...s.position }, velocity: { ...s.velocity } }));
    let curAsteroids = asteroidsRef.current.map(a => ({ ...a, position: { ...a.position }, velocity: a.velocity ? { ...a.velocity } : { x: 0, y: 0 } }));
    let curBullets = bulletsRef.current.map(b => ({ ...b, position: { ...b.position }, velocity: { ...b.velocity }, trail: b.trail.map(t => ({ ...t, position: { ...t.position }, velocity: { ...t.velocity } })) }));
    let curParticles = particlesRef.current.map(p => ({ ...p, position: { ...p.position }, velocity: { ...p.velocity } }));

    const ctrl = playerCtrlRef.current;
    const storeProxy = {
      addBullet,
      activateShield,
      ships: curShips,
    };

    curShips.forEach((ship) => {
      ctrl.updateShip(ship, deltaTime, storeProxy);
      ship.position.x = Math.max(20, Math.min(cw - 20, ship.position.x));
      ship.position.y = Math.max(20, Math.min(ch - 20, ship.position.y));
      if (ship.upgradeFlash > 0) ship.upgradeFlash = Math.max(0, ship.upgradeFlash - deltaTime * 120);
    });

    const shipGrid = new SpatialHashGrid<ShipObj>(150, cw, ch);
    curShips.forEach(s => shipGrid.insert({ ...s, radius: 20 } as ShipObj));

    const astGrid = new SpatialHashGrid<AsteroidObj>(120, cw, ch);
    curAsteroids.forEach(a => astGrid.insert({ ...a } as AsteroidObj));

    for (let i = 0; i < curAsteroids.length; i++) {
      const a = curAsteroids[i];
      if (a.velocity) {
        a.position.x += a.velocity.x * deltaTime;
        a.position.y += a.velocity.y * deltaTime;
      }
      a.rotation += a.rotationSpeed;

      if (a.position.x < a.radius) { a.position.x = a.radius; if (a.velocity) a.velocity.x *= -1; }
      if (a.position.x > cw - a.radius) { a.position.x = cw - a.radius; if (a.velocity) a.velocity.x *= -1; }
      if (a.position.y < a.radius) { a.position.y = a.radius; if (a.velocity) a.velocity.y *= -1; }
      if (a.position.y > ch - a.radius) { a.position.y = ch - a.radius; if (a.velocity) a.velocity.y *= -1; }

      curShips.forEach((ship, shipIdx) => {
        const dx = ship.position.x - a.position.x;
        const dy = ship.position.y - a.position.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + 18;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / dist;
          ship.position.x += dx * overlap;
          ship.position.y += dy * overlap;
          ship.velocity.x *= 0.6;
          ship.velocity.y *= 0.6;
        }
        void shipIdx;
      });
    }

    curShips.forEach((ship) => {
      const nearbyAsts = astGrid.query(ship.position.x, ship.position.y, 150);
      let targetId: string | null = null;
      let minD = Infinity;
      for (const a of nearbyAsts) {
        if (a.minerals <= 0) continue;
        if (checkMiningRange(ship, a)) {
          const d = Math.hypot(ship.position.x - a.position.x, ship.position.y - a.position.y);
          if (d < minD) {
            minD = d;
            targetId = a.id;
          }
        }
      }
      if (targetId) {
        const targetAst = nearbyAsts.find(a => a.id === targetId);
        if (targetAst) {
          ship.isMining = true;
          ship.miningTarget = targetId;
          const mined = performMining(ship, targetAst, deltaTime, { ships: curShips, asteroids: curAsteroids });
          if (mined > 0) {
            ship.minerals = Math.round(ship.minerals * 100) / 100;
            const updatedAst = curAsteroids.find(aa => aa.id === targetAst!.id);
            if (updatedAst) updatedAst.minerals = Math.round(updatedAst.minerals * 100) / 100;
            const key = ship.id;
            const lastT = miningSoundTimersRef.current.get(key) ?? 0;
            if (time - lastT > 100) {
              audioManager.playMining();
              miningSoundTimersRef.current.set(key, time);
              if (Math.random() < 0.3) {
                particleEngineRef.current.createMiningEffect(
                  { x: (ship.position.x + targetAst.position.x) / 2, y: (ship.position.y + targetAst.position.y) / 2 },
                  (p) => { curParticles.push(p); }
                );
              }
            }
            if (ship.minerals >= 50 && Math.floor(ship.minerals - mined) < 50) {
              audioManager.playUpgrade();
            }
          }
        }
      } else {
        ship.isMining = false;
        ship.miningTarget = null;
      }
    });

    for (let i = curAsteroids.length - 1; i >= 0; i--) {
      if (curAsteroids[i].minerals <= 0 && curAsteroids[i].radius > 20) {
        const dead = curAsteroids[i];
        audioManager.playExplosion();
        particleEngineRef.current.createExplosion(dead.position, dead.color, 25, (p) => { curParticles.push(p); });
        const frags = splitAsteroid(dead);
        curAsteroids.splice(i, 1);
        for (const f of frags) curAsteroids.push(f);
      }
    }

    while (curParticles.length > 200) curParticles.shift();
    particleEngineRef.current.updateParticles(curParticles, deltaTime);

    const bulletsToRemove: string[] = [];
    for (let i = 0; i < curBullets.length; i++) {
      const b = curBullets[i];
      b.position.x += b.velocity.x * deltaTime;
      b.position.y += b.velocity.y * deltaTime;
      b.life -= deltaTime * 1000;

      if (b.trail) {
        b.trail.forEach((tp, ti) => {
          tp.life -= deltaTime;
          tp.position.x += tp.velocity.x * deltaTime;
          tp.position.y += tp.velocity.y * deltaTime;
          void ti;
        });
        b.trail = b.trail.filter(tp => tp.life > 0);
        const angle = Math.atan2(b.velocity.y, b.velocity.x);
        for (let k = b.trail.length; k < 4; k++) {
          const t = (k + 1) / 5;
          b.trail.push({
            id: `t-${b.id}-${k}-${Math.random()}`,
            position: {
              x: b.position.x - Math.cos(angle) * t * 6,
              y: b.position.y - Math.sin(angle) * t * 6,
            },
            velocity: { x: 0, y: 0 },
            color: b.color,
            size: Math.max(1, 2 - k * 0.4),
            life: 0.15,
            maxLife: 0.15,
            type: 'bulletTrail',
          });
        }
      }

      if (b.life <= 0 || b.position.x < -50 || b.position.x > cw + 50 || b.position.y < -50 || b.position.y > ch + 50) {
        bulletsToRemove.push(b.id);
        continue;
      }

      for (const ship of curShips) {
        if (checkBulletShieldCollision(b, ship)) {
          const absorbed = Math.min(ship.shieldHealth, b.damage);
          ship.shieldHealth -= absorbed;
          ship.shieldHp -= absorbed;
          if (ship.shieldHealth <= 0 || ship.shieldHp <= 0) {
            ship.isShieldActive = false;
            ship.shieldActive = false;
            particleEngineRef.current.createExplosion(ship.position, '#00D4FF', 15, (p) => { curParticles.push(p); });
            audioManager.playHit();
          } else {
            audioManager.playHit();
            particleEngineRef.current.createExplosion(b.position, '#00D4FF', 5, (p) => { curParticles.push(p); });
          }
          bulletsToRemove.push(b.id);
          break;
        }
      }

      if (bulletsToRemove.includes(b.id)) continue;

      for (const ship of curShips) {
        if (checkBulletShipCollision(b, ship)) {
          ship.health = Math.max(0, ship.health - b.damage);
          audioManager.playHit();
          particleEngineRef.current.createExplosion(b.position, ship.color, 8, (p) => { curParticles.push(p); });
          bulletsToRemove.push(b.id);
          break;
        }
      }
    }

    const currentBulletIds = new Set(curBullets.map(b => b.id));
    curBullets.forEach(b => {
      if (!prevBulletsRef.current.has(b.id) && !bulletsToRemove.includes(b.id)) {
        audioManager.playShoot(b.color);
      }
    });
    prevBulletsRef.current = currentBulletIds;

    curBullets = curBullets.filter(b => !bulletsToRemove.includes(b.id));

    for (let i = curShips.length - 1; i >= 0; i--) {
      const ship = curShips[i];
      const wasShield = prevShieldsRef.current.get(ship.id) ?? false;
      if (!wasShield && (ship.isShieldActive || ship.shieldActive)) {
        audioManager.playShield();
      }
      prevShieldsRef.current.set(ship.id, !!(ship.isShieldActive || ship.shieldActive));
    }

    for (let i = 0; i < curShips.length; i++) {
      const ship = curShips[i];
      if (ship.health <= 0 && !winnerRef.current) {
        const loserId = ship.playerId;
        const winner = playersRef.current.find(p => p.id !== loserId);
        if (winner) {
          audioManager.playGameOver(true);
          endGame(winner.id);
          winnerRef.current = winner.id;
          particleEngineRef.current.createExplosion(ship.position, ship.color, 40, (p) => { curParticles.push(p); });
          audioManager.playExplosion();
        }
      }
    }

    playersRef.current.forEach((p, idx) => {
      const prevK = prevKillsRef.current.get(p.id) ?? 0;
      if (p.kills > prevK) {
        prevKillsRef.current.set(p.id, p.kills);
      }
      void idx;
    });

    useGameStore.setState({
      ships: curShips,
      asteroids: curAsteroids,
      bullets: curBullets,
      particles: curParticles,
    });

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    ctx.fillStyle = '#0B0E1A';
    ctx.fillRect(0, 0, cw, ch);

    const starSeed = 42;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 180; i++) {
      const sx = ((starSeed * 9301 + i * 49297) % 233280) / 233280 * cw;
      const sy = ((starSeed * 7919 + i * 233) % 233280) / 233280 * ch;
      const sz = ((starSeed * 31 + i * 17) % 233280) / 233280 * 2 + 0.3;
      const tw = 0.5 + 0.5 * Math.sin(time / 1000 + i * 0.7);
      ctx.globalAlpha = 0.3 + 0.5 * tw;
      ctx.fillRect(sx, sy, sz, sz);
    }
    ctx.globalAlpha = 1;

    const vignette = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.3, cw / 2, ch / 2, Math.max(cw, ch) * 0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cw, ch);

    for (const a of curAsteroids) {
      renderAsteroid(ctx, a);
    }

    for (const ship of curShips) {
      if (ship.isMining && ship.miningTarget) {
        const target = curAsteroids.find(a => a.id === ship.miningTarget);
        if (target) {
          renderMiningBeam(ctx, ship, target, time / 1000);
        }
      }
    }

    for (const p of curParticles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    for (const b of curBullets) {
      renderBullet(ctx, b);
    }

    for (const ship of curShips) {
      ctrl.renderShip(ctx, ship, time);
      if (ship.isShieldActive || ship.shieldActive) {
        renderShield(ctx, ship, time / 1000);
      }
    }

    ctx.restore();

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, addBullet, activateShield, endGame, removeAsteroid, removeBullet, collectMinerals, startMining, stopMining, damageShip, addKill, addParticle, removeParticle, updateParticle, updateShip, updateAsteroid, updateBullet]);

  useEffect(() => {
    if (gameState === 'playing' && asteroids.length === 0 && ships.length > 0) {
      const count = Math.max(60, Math.min(80, Math.floor((canvasWidth * canvasHeight) / 40000)));
      const generated = generateAsteroids(count, canvasWidth, canvasHeight);
      useGameStore.setState({ asteroids: generated });
    }
  }, [gameState, asteroids.length, ships.length, canvasWidth, canvasHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
  }, [gameState, canvasWidth, canvasHeight]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'block',
          background: '#0B0E1A',
        }}
      />
      {upgradeForShip && (
        <UpgradePanel
          shipId={upgradeForShip}
          onClose={() => setUpgradeForShip(null)}
        />
      )}
    </>
  );
};
