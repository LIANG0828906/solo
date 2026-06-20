import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameMap from './components/GameMap';
import UIPanel from './components/UIPanel';
import {
  generateMap,
  checkCollision,
  getTileAtPosition,
  isDiggable,
  createOreParticles,
  playMiningSound,
  getUpgradeCost,
  canAfford,
  TileType,
  TILE_SIZE,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  Player,
  Inventory,
  OreParticle,
  MiningAnimation,
  OreType,
  ORE_TILE_MAP,
  ORE_TO_INGOT,
} from './utils/gameLogic';

const SMELT_DURATION = 5000;

const App: React.FC = () => {
  const [depth, setDepth] = useState(1);
  const [map, setMap] = useState<TileType[][]>(() => generateMap(1));
  const [player, setPlayer] = useState<Player>({
    x: TILE_SIZE * 1.5,
    y: TILE_SIZE * 1.5,
    speed: PLAYER_SPEED,
    pickaxeLevel: 1,
    lampLevel: 1,
    backpackLevel: 1,
  });
  const [inventory, setInventory] = useState<Inventory>({
    coal: 0,
    iron: 0,
    gold: 0,
    diamond: 0,
    steel: 0,
    ironIngot: 0,
    goldIngot: 0,
    diamondRaw: 0,
  });
  const [particles, setParticles] = useState<OreParticle[]>([]);
  const [miningAnimations, setMiningAnimations] = useState<MiningAnimation[]>([]);
  const [now, setNow] = useState(performance.now());
  const [playerOffset, setPlayerOffset] = useState({ x: 0, y: 0 });
  const [isSmelting, setIsSmelting] = useState(false);
  const [smeltProgress, setSmeltProgress] = useState(0);
  const [currentSmeltOre, setCurrentSmeltOre] = useState<OreType | null>(null);
  const [smeltStartTime, setSmeltStartTime] = useState(0);

  const keysRef = useRef<Set<string>>(new Set());
  const bounceRef = useRef<{ active: boolean; startTime: number; dx: number; dy: number }>({
    active: false,
    startTime: 0,
    dx: 0,
    dy: 0,
  });
  const lastTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);
  const playerRef = useRef(player);
  const mapRef = useRef(map);
  const keysLockedRef = useRef(false);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  const tryMine = useCallback(() => {
    const p = playerRef.current;
    const m = mapRef.current;

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 0 },
    ];

    for (const dir of directions) {
      const checkX = p.x + dir.dx * (PLAYER_RADIUS + 4);
      const checkY = p.y + dir.dy * (PLAYER_RADIUS + 4);
      const tile = getTileAtPosition(checkX, checkY, m);

      if (tile !== null && isDiggable(tile)) {
        const tileX = Math.floor(checkX / TILE_SIZE);
        const tileY = Math.floor(checkY / TILE_SIZE);
        const oreType = ORE_TILE_MAP[tile];
        const currentTime = performance.now();

        const anim: MiningAnimation = {
          id: `${currentTime}-${tileX}-${tileY}`,
          tileX,
          tileY,
          startTime: currentTime,
          duration: 300,
        };

        setMiningAnimations((prev) => [...prev, anim]);

        const newMap = m.map((row) => [...row]);
        newMap[tileY][tileX] = TileType.EMPTY;
        setMap(newMap);

        if (oreType) {
          const newParticles = createOreParticles(tileX, tileY, oreType, currentTime);
          setParticles((prev) => [...prev, ...newParticles]);
          playMiningSound(oreType);

          setTimeout(() => {
            setInventory((prev) => ({
              ...prev,
              [oreType]: prev[oreType] + 1,
            }));
          }, 600);
        }

        return;
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }
      if (key === ' ' && !keysLockedRef.current) {
        keysLockedRef.current = true;
        tryMine();
        setTimeout(() => {
          keysLockedRef.current = false;
        }, 300);
      }
      keysRef.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tryMine]);

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const keys = keysRef.current;
      const currentMap = mapRef.current;
      let { x, y } = playerRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;

      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
      }

      const speed = playerRef.current.speed;
      const newX = x + dx * speed * deltaTime;
      const newY = y + dy * speed * deltaTime;

      let finalX = x;
      let finalY = y;
      let bounced = false;
      let bounceDx = 0;
      let bounceDy = 0;

      if (!checkCollision(newX, y, currentMap)) {
        finalX = newX;
      } else if (dx !== 0) {
        bounced = true;
        bounceDx = dx * 4;
      }

      if (!checkCollision(finalX, newY, currentMap)) {
        finalY = newY;
      } else if (dy !== 0) {
        bounced = true;
        bounceDy = dy * 4;
      }

      if (bounced && !bounceRef.current.active) {
        bounceRef.current = {
          active: true,
          startTime: timestamp,
          dx: bounceDx,
          dy: bounceDy,
        };
      }

      if (bounceRef.current.active) {
        const bounceElapsed = timestamp - bounceRef.current.startTime;
        const bounceDuration = 100;
        if (bounceElapsed >= bounceDuration) {
          bounceRef.current.active = false;
          setPlayerOffset({ x: 0, y: 0 });
        } else {
          const t = bounceElapsed / bounceDuration;
          const bounceT = Math.sin(t * Math.PI);
          setPlayerOffset({
            x: bounceRef.current.dx * bounceT,
            y: bounceRef.current.dy * bounceT,
          });
        }
      }

      if (finalX !== x || finalY !== y) {
        setPlayer((prev) => ({ ...prev, x: finalX, y: finalY }));
      }

      setNow(timestamp);

      setMiningAnimations((prev) =>
        prev.filter((anim) => timestamp - anim.startTime < anim.duration)
      );

      setParticles((prev) => prev.filter((p) => timestamp - p.startTime < 600));

      if (isSmelting && currentSmeltOre) {
        const elapsed = timestamp - smeltStartTime;
        const progress = Math.min(elapsed / SMELT_DURATION, 1);
        setSmeltProgress(progress);
        if (progress >= 1) {
          const ingotType = ORE_TO_INGOT[currentSmeltOre];
          setInventory((prev) => ({
            ...prev,
            [ingotType]: prev[ingotType] + 1,
          }));
          setIsSmelting(false);
          setSmeltProgress(0);
          setCurrentSmeltOre(null);
        }
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isSmelting, currentSmeltOre, smeltStartTime]);

  const handleStartSmelt = useCallback((oreType: OreType) => {
    setInventory((prev) => {
      if (prev[oreType] <= 0) return prev;
      return { ...prev, [oreType]: prev[oreType] - 1 };
    });
    setCurrentSmeltOre(oreType);
    setIsSmelting(true);
    setSmeltStartTime(performance.now());
    setSmeltProgress(0);
  }, []);

  const deductCost = (inv: Inventory, cost: ReturnType<typeof getUpgradeCost>): Inventory => {
    return {
      ...inv,
      steel: inv.steel - cost.steel,
      ironIngot: inv.ironIngot - cost.ironIngot,
      goldIngot: inv.goldIngot - cost.goldIngot,
      diamondRaw: inv.diamondRaw - cost.diamondRaw,
    };
  };

  const handleUpgradePickaxe = useCallback(() => {
    const cost = getUpgradeCost(player.pickaxeLevel);
    if (canAfford(inventory, cost)) {
      setInventory((prev) => deductCost(prev, cost));
      setPlayer((prev) => ({
        ...prev,
        pickaxeLevel: prev.pickaxeLevel + 1,
        speed: PLAYER_SPEED + prev.pickaxeLevel * 10,
      }));
    }
  }, [player.pickaxeLevel, inventory]);

  const handleUpgradeLamp = useCallback(() => {
    const cost = getUpgradeCost(player.lampLevel);
    if (canAfford(inventory, cost)) {
      setInventory((prev) => deductCost(prev, cost));
      setPlayer((prev) => ({
        ...prev,
        lampLevel: prev.lampLevel + 1,
      }));
    }
  }, [player.lampLevel, inventory]);

  const handleUpgradeBackpack = useCallback(() => {
    const cost = getUpgradeCost(player.backpackLevel);
    if (canAfford(inventory, cost)) {
      setInventory((prev) => deductCost(prev, cost));
      setPlayer((prev) => ({
        ...prev,
        backpackLevel: prev.backpackLevel + 1,
      }));
    }
  }, [player.backpackLevel, inventory]);

  const handleChangeDepth = useCallback((delta: number) => {
    const newDepth = Math.max(1, depth + delta);
    if (newDepth !== depth) {
      setDepth(newDepth);
      setMap(generateMap(newDepth));
      setPlayer((prev) => ({
        ...prev,
        x: TILE_SIZE * 1.5,
        y: TILE_SIZE * 1.5,
      }));
      setParticles([]);
      setMiningAnimations([]);
    }
  }, [depth]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #212121 0%, #37474F 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          color: '#FFD54F',
          fontSize: 24,
          fontWeight: 700,
          margin: 0,
          textShadow: '0 2px 8px rgba(255,213,79,0.3)',
        }}
      >
        ⛏️ 地下矿工
      </h1>

      <UIPanel
        inventory={inventory}
        player={player}
        depth={depth}
        isSmelting={isSmelting}
        smeltProgress={smeltProgress}
        currentSmeltOre={currentSmeltOre}
        onStartSmelt={handleStartSmelt}
        onUpgradePickaxe={handleUpgradePickaxe}
        onUpgradeLamp={handleUpgradeLamp}
        onUpgradeBackpack={handleUpgradeBackpack}
        onChangeDepth={handleChangeDepth}
      />

      <GameMap
        map={map}
        player={player}
        particles={particles}
        miningAnimations={miningAnimations}
        now={now}
        playerOffset={playerOffset}
      />

      <div
        style={{
          color: '#78909C',
          fontSize: 12,
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        WASD / 方向键移动 · 空格键挖掘矿石 · 拖拽矿石到熔炉熔炼
      </div>
    </div>
  );
};

export default App;
