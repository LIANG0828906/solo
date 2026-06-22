import React, { useState, useEffect, useCallback } from 'react';
import {
  ElementType,
  NodeData,
  GameState,
  EnemyTarget,
  DamageNumber,
  Particle,
  ShockwaveState,
  ColorShakeState,
  ELEMENT_COLORS,
  COMBO_SPELL_COLORS,
  ComboSpellType,
} from './types';
import CircleGrid from './CircleGrid';
import ElementPanel from './ElementPanel';
import StatusPanel from './StatusPanel';
import ParticleEffect from './ParticleEffect';
import { detectComboSpell, calculateDamage } from './SpellCombo';

let particleIdCounter = 0;
let damageIdCounter = 0;

const createInitialNodes = (gridSize: number, radius: number): NodeData[] => {
  const nodes: NodeData[] = [];
  const centerX = gridSize / 2;
  const centerY = gridSize / 2;

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
    nodes.push({
      id: i,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      element: null,
      isCharging: false,
      isActivated: false,
    });
  }
  return nodes;
};

const createInitialEnemies = (gridSize: number): EnemyTarget[] => {
  return [
    { id: 0, x: gridSize * 0.15, y: gridSize * 0.15 },
    { id: 1, x: gridSize * 0.85, y: gridSize * 0.2 },
    { id: 2, x: gridSize * 0.5, y: gridSize * 0.92 },
  ];
};

const App: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 1024;

  const gridSize = isMobile ? 500 : 700;
  const radius = isMobile ? 180 : 250;

  const [draggedElement, setDraggedElement] = useState<ElementType | null>(null);
  const [nodes, setNodes] = useState<NodeData[]>(() => createInitialNodes(gridSize, radius));
  const [enemies, setEnemies] = useState<EnemyTarget[]>(() => createInitialEnemies(gridSize));

  const [gameState, setGameState] = useState<GameState>({
    chargeLevel: 0,
    spellCastCount: 0,
    elementInventory: {
      [ElementType.Fire]: 3,
      [ElementType.Ice]: 3,
      [ElementType.Lightning]: 3,
      [ElementType.Shadow]: 3,
    },
    activeCombo: null,
  });

  const [activeComboSpell, setActiveComboSpell] = useState<ComboSpellType | null>(null);
  const [chargingNodes, setChargingNodes] = useState<number[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [shockwave, setShockwave] = useState<ShockwaveState>({
    active: false,
    color: '#ffffff',
    startedAt: 0,
  });
  const [colorShake, setColorShake] = useState<ColorShakeState>({
    active: false,
    color: '#ffffff',
    startedAt: 0,
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setNodes(createInitialNodes(gridSize, radius));
    setEnemies(createInitialEnemies(gridSize));
  }, [gridSize, radius]);

  const handleDragStart = useCallback((element: ElementType) => {
    setDraggedElement(element);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedElement(null);
  }, []);

  const handleNodePlace = useCallback((nodeId: number) => {
    if (!draggedElement) return;
    if (gameState.elementInventory[draggedElement] <= 0) return;
    if (nodes[nodeId].element) return;
    if (activeComboSpell) return;

    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, element: draggedElement } : n))
    );

    setGameState((prev) => ({
      ...prev,
      elementInventory: {
        ...prev.elementInventory,
        [draggedElement]: prev.elementInventory[draggedElement] - 1,
      },
    }));

    setDraggedElement(null);
  }, [draggedElement, gameState.elementInventory, nodes, activeComboSpell]);

  useEffect(() => {
    if (activeComboSpell) return;

    const { comboSpell, activatedNodeIndices } = detectComboSpell(nodes);

    if (comboSpell && activatedNodeIndices.length > 0) {
      setChargingNodes([activatedNodeIndices[0]]);
      setGameState((prev) => ({
        ...prev,
        activeCombo: comboSpell.type,
      }));

      let currentIdx = 0;
      const animateCharge = () => {
        if (currentIdx < activatedNodeIndices.length - 1) {
          const fromNode = nodes[activatedNodeIndices[currentIdx]];
          const toNode = nodes[activatedNodeIndices[currentIdx + 1]];
          const fromColor = fromNode.element ? ELEMENT_COLORS[fromNode.element] : '#fff';
          const toColor = toNode.element ? ELEMENT_COLORS[toNode.element] : '#fff';

          for (let i = 0; i < 5; i++) {
            const particle: Particle = {
              id: ++particleIdCounter,
              startX: fromNode.x,
              startY: fromNode.y,
              endX: toNode.x,
              endY: toNode.y,
              color: i < 3 ? fromColor : toColor,
              createdAt: Date.now() + i * 40,
            };
            setParticles((prev) => [...prev, particle]);
          }

          currentIdx++;
          setTimeout(() => {
            setChargingNodes(activatedNodeIndices.slice(0, currentIdx + 1));
            animateCharge();
          }, 300);
        } else {
          setTimeout(() => {
            setActiveComboSpell(comboSpell.type);
          }, 200);
        }
      };

      setTimeout(animateCharge, 100);
    }
  }, [nodes, activeComboSpell]);

  const handleComboClick = useCallback(() => {
    if (!activeComboSpell) return;

    const color = COMBO_SPELL_COLORS[activeComboSpell];
    const now = Date.now();

    setColorShake({
      active: true,
      color,
      startedAt: now,
    });

    setShockwave({
      active: true,
      color,
      startedAt: now,
    });

    setTimeout(() => {
      const { comboSpell } = detectComboSpell(nodes);
      if (!comboSpell) return;

      const baseDamage = comboSpell.baseDamage;
      const damage = calculateDamage(baseDamage, gameState.chargeLevel);

      enemies.forEach((enemy, idx) => {
        setTimeout(() => {
          const dmg: DamageNumber = {
            id: ++damageIdCounter,
            x: enemy.x,
            y: enemy.y - 10,
            value: damage,
            createdAt: Date.now(),
          };
          setDamageNumbers((prev) => [...prev, dmg]);
        }, idx * 150);
      });

      setTimeout(() => {
        setNodes((prev) =>
          prev.map((n) => ({
            ...n,
            element: null,
            isCharging: false,
            isActivated: false,
          }))
        );
        setActiveComboSpell(null);
        setChargingNodes([]);
        setGameState((prev) => ({
          ...prev,
          chargeLevel: Math.min(prev.chargeLevel + 1, 5),
          spellCastCount: prev.spellCastCount + 1,
          activeCombo: null,
        }));
      }, 800);
    }, 300);
  }, [activeComboSpell, nodes, gameState.chargeLevel, enemies]);

  const handleParticleExpire = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleDamageExpire = useCallback((id: number) => {
    setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleShockwaveEnd = useCallback(() => {
    setShockwave({ active: false, color: '#ffffff', startedAt: 0 });
  }, []);

  const handleColorShakeEnd = useCallback(() => {
    setColorShake({ active: false, color: '#ffffff', startedAt: 0 });
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #0a0a2e 100%)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '20px' : '40px',
        padding: '20px',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#8888ff',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(136, 136, 255, 0.5)',
          letterSpacing: '4px',
          zIndex: 10,
        }}
      >
        ✦ 星轨法阵 ✦
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: isMobile ? '40px' : '60px',
        }}
      >
        <CircleGrid
          nodes={nodes}
          gridSize={gridSize}
          radius={radius}
          draggedElement={draggedElement}
          onNodePlace={handleNodePlace}
          comboSpell={activeComboSpell}
          onComboClick={handleComboClick}
          enemies={enemies}
          chargingNodes={chargingNodes}
        />
        <ParticleEffect
          particles={particles}
          shockwave={shockwave}
          colorShake={colorShake}
          damageNumbers={damageNumbers}
          gridSize={gridSize}
          onParticleExpire={handleParticleExpire}
          onDamageExpire={handleDamageExpire}
          onShockwaveEnd={handleShockwaveEnd}
          onColorShakeEnd={handleColorShakeEnd}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: isMobile ? 'center' : 'flex-start',
          marginTop: isMobile ? '0' : '60px',
        }}
      >
        <ElementPanel
          inventory={gameState.elementInventory}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggedElement={draggedElement}
        />
        <div style={{ width: '220px' }}>
          <StatusPanel gameState={gameState} />
        </div>
      </div>
    </div>
  );
};

export default App;
