import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StarField } from '../game/StarField';
import { MinerAI, Ship } from '../game/MinerAI';
import { BuildingManager, BuildingType, BUILDING_CONFIGS } from '../game/Building';
import { MeteorEvent } from '../game/MeteorEvent';
import { Mineral } from '../game/types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const GRID_SIZE = 8;
const BASE_X = 400;
const BASE_Y = 400;

const GameUI: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const starFieldRef = useRef<StarField | null>(null);
  const minerAIRef = useRef<MinerAI | null>(null);
  const buildingManagerRef = useRef<BuildingManager | null>(null);
  const meteorEventRef = useRef<MeteorEvent | null>(null);

  const [resources, setResources] = useState({ gold: 200, iron: 50, crystal: 30 });
  const [ships, setShips] = useState<Ship[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [saveButtonSuccess, setSaveButtonSuccess] = useState(false);
  const [resourceBounce, setResourceBounce] = useState<{ [key: string]: boolean }>({});
  const [buildCooldowns, setBuildCooldowns] = useState<{ [key: string]: boolean }>({});
  const [storageInfo, setStorageInfo] = useState({ current: 0, capacity: 50 });

  const initGame = useCallback(() => {
    const starField = new StarField(CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE);
    const minerAI = new MinerAI(starField, BASE_X, BASE_Y);
    const buildingManager = new BuildingManager(BASE_X, BASE_Y);
    const meteorEvent = new MeteorEvent(CANVAS_WIDTH, CANVAS_HEIGHT);

    starFieldRef.current = starField;
    minerAIRef.current = minerAI;
    buildingManagerRef.current = buildingManager;
    meteorEventRef.current = meteorEvent;

    minerAI.setOnResourcesCollected((collected) => {
      buildingManager.addResources(collected);
      Object.keys(collected).forEach(key => {
        if (collected[key as keyof typeof collected] > 0) {
          triggerResourceBounce(key);
        }
      });
    });

    buildingManager.setOnResourcesChanged((newResources) => {
      setResources({ ...newResources });
      setStorageInfo({
        current: buildingManager.getState().currentStorage,
        capacity: buildingManager.getState().storageCapacity
      });
    });

    meteorEvent.setOnShipHit((shipId, damage) => {
      minerAI.damageShip(shipId, damage);
    });

    setShips(minerAI.getShips());
    setBuildings(buildingManager.getBuildings());
    setResources(buildingManager.getResources());
    setStorageInfo({
      current: buildingManager.getState().currentStorage,
      capacity: buildingManager.getState().storageCapacity
    });
  }, []);

  const triggerResourceBounce = (resourceType: string) => {
    setResourceBounce(prev => ({ ...prev, [resourceType]: true }));
    setTimeout(() => {
      setResourceBounce(prev => ({ ...prev, [resourceType]: false }));
    }, 100);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const timeDelta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;
      frameCount++;

      if (minerAIRef.current && starFieldRef.current) {
        minerAIRef.current.update(timeDelta);
        
        const currentShips = minerAIRef.current.getShips();
        const shipInterfaces = currentShips.map(s => ({ id: s.id, x: s.x, y: s.y }));
        
        if (buildingManagerRef.current && meteorEventRef.current) {
          const turrets = buildingManagerRef.current.getTurretPositions();
          meteorEventRef.current.setTurrets(turrets);
          meteorEventRef.current.update(timeDelta, shipInterfaces);
          
          const miningSpeed = buildingManagerRef.current.getMiningSpeedBonus();
          minerAIRef.current.setMiningSpeedMultiplier(miningSpeed);
        }

        if (frameCount % 3 === 0) {
          setShips([...currentShips]);
        }
      }

      render(ctx, timestamp);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  const render = (ctx: CanvasRenderingContext2D, timestamp: number) => {
    if (!starFieldRef.current || !minerAIRef.current) return;

    const starField = starFieldRef.current;
    const minerAI = minerAIRef.current;

    ctx.fillStyle = '#0b0e1c';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const stars = starField.getStars();
    for (const star of stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(timestamp / 1000 * star.twinkleSpeed + star.twinkleOffset);
      ctx.globalAlpha = star.opacity * twinkle;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const cellWidth = CANVAS_WIDTH / GRID_SIZE;
    const cellHeight = CANVAS_HEIGHT / GRID_SIZE;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(CANVAS_WIDTH, i * cellHeight);
      ctx.stroke();
    }

    const minerals = starField.getAllMinerals();
    for (const mineral of minerals) {
      if (mineral.opacity <= 0) continue;
      
      ctx.globalAlpha = mineral.opacity;
      const scale = mineral.collecting ? Math.max(0, 1 - (timestamp % 300) / 300) : 1;
      const size = mineral.size * scale;
      
      const gradient = ctx.createRadialGradient(
        mineral.x, mineral.y, 0,
        mineral.x, mineral.y, size
      );
      
      if (mineral.type === 'gold') {
        gradient.addColorStop(0, '#f39c12');
        gradient.addColorStop(1, '#d68910');
      } else if (mineral.type === 'iron') {
        gradient.addColorStop(0, '#95a5a6');
        gradient.addColorStop(1, '#7f8c8d');
      } else {
        gradient.addColorStop(0, '#9b59b6');
        gradient.addColorStop(1, '#8e44ad');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mineral.x, mineral.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (buildingManagerRef.current) {
      const buildingList = buildingManagerRef.current.getBuildings();
      for (const building of buildingList) {
        ctx.fillStyle = '#34495e';
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 2;
        
        if (building.type === 'miningStation') {
          ctx.fillRect(building.x - 12, building.y - 12, 24, 24);
          ctx.strokeRect(building.x - 12, building.y - 12, 24, 24);
        } else if (building.type === 'warehouse') {
          ctx.fillRect(building.x - 15, building.y - 10, 30, 20);
          ctx.strokeRect(building.x - 15, building.y - 10, 30, 20);
        } else if (building.type === 'turret') {
          ctx.beginPath();
          ctx.arc(building.x, building.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.strokeStyle = 'rgba(52, 152, 219, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(building.x, building.y, 100, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = '#1a1a3e';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(BASE_X, BASE_Y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('基', BASE_X, BASE_Y);

    if (meteorEventRef.current) {
      const projectiles = meteorEventRef.current.getProjectiles();
      for (const p of projectiles) {
        ctx.fillStyle = '#3498db';
        ctx.shadowColor = '#3498db';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    const shipList = minerAI.getShips();
    for (const ship of shipList) {
      if (ship.trail.length > 0) {
        for (let i = 0; i < ship.trail.length; i++) {
          const trail = ship.trail[i];
          const alpha = 0.3 * (1 - trail.age);
          if (alpha <= 0) continue;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#3498db';
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      const dx = ship.targetX - ship.x;
      const dy = ship.targetY - ship.y;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(angle);

      if (ship.id === selectedShipId) {
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      const flashColor = ship.flashTimer > 0 ? '#ffffff' : '#3498db';
      ctx.fillStyle = flashColor;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      const healthBarWidth = 40;
      const healthBarHeight = 4;
      const healthPercent = ship.health / ship.maxHealth;
      
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(ship.x - healthBarWidth / 2, ship.y + 18, healthBarWidth, healthBarHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f1c40f' : '#e74c3c';
      ctx.fillRect(ship.x - healthBarWidth / 2, ship.y + 18, healthBarWidth * healthPercent, healthBarHeight);
    }

    if (meteorEventRef.current) {
      const meteors = meteorEventRef.current.getMeteors();
      for (const meteor of meteors) {
        ctx.globalAlpha = meteor.opacity;
        const size = meteor.size * meteor.scale;
        
        const gradient = ctx.createRadialGradient(
          meteor.x - size * 0.3, meteor.y - size * 0.3, 0,
          meteor.x, meteor.y, size
        );
        gradient.addColorStop(0, '#e74c3c');
        gradient.addColorStop(0.7, '#c0392b');
        gradient.addColorStop(1, '#922b21');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.beginPath();
        ctx.moveTo(meteor.x - size * 0.5, meteor.y);
        ctx.lineTo(meteor.x - size * 2, meteor.y - size * 0.8);
        ctx.lineTo(meteor.x - size * 2.5, meteor.y);
        ctx.lineTo(meteor.x - size * 2, meteor.y + size * 0.8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const explosions = meteorEventRef.current.getExplosions();
      for (const explosion of explosions) {
        const progress = explosion.age / explosion.duration;
        const alpha = 1 - progress;
        
        for (const particle of explosion.particles) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#f39c12';
          ctx.beginPath();
          ctx.arc(
            explosion.x + particle.x,
            explosion.y + particle.y,
            particle.size * (1 - progress * 0.5),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !starFieldRef.current || !minerAIRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const shipList = minerAIRef.current.getShips();
    for (const ship of shipList) {
      const dx = ship.x - x;
      const dy = ship.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        if (ship.status === 'idle') {
          setSelectedShipId(ship.id);
        }
        return;
      }
    }

    if (selectedShipId && starFieldRef.current) {
      const { gridX, gridY } = starFieldRef.current.pixelToGrid(x, y);
      const cellMinerals = starFieldRef.current.getGridCell(gridX, gridY);
      
      if (cellMinerals.length > 0) {
        const success = minerAIRef.current.sendShipToMine(selectedShipId, gridX, gridY);
        if (success) {
          setSelectedShipId(null);
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !starFieldRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { gridX, gridY } = starFieldRef.current.pixelToGrid(x, y);
    const cellMinerals = starFieldRef.current.getGridCell(gridX, gridY);

    if (cellMinerals.length > 0) {
      const content = `矿物: ${cellMinerals.length}块`;
      setTooltip({
        visible: true,
        x: e.clientX + 15,
        y: e.clientY + 15,
        content
      });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleCanvasMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleBuild = (type: BuildingType) => {
    if (!buildingManagerRef.current) return;
    if (buildCooldowns[type]) return;

    const success = buildingManagerRef.current.build(type);
    if (success) {
      setBuildings([...buildingManagerRef.current.getBuildings()]);
      
      setBuildCooldowns(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setBuildCooldowns(prev => ({ ...prev, [type]: false }));
      }, 1000);
    }
  };

  const handleSave = async () => {
    if (!starFieldRef.current || !minerAIRef.current || !buildingManagerRef.current) return;

    const saveData = {
      starField: {
        minerals: starFieldRef.current.getAllMinerals()
      },
      ships: minerAIRef.current.getShips(),
      buildings: buildingManagerRef.current.getState()
    };

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'default',
          data: saveData
        })
      });

      if (response.ok) {
        setSaveButtonSuccess(true);
        showToastMessage('保存成功！');
        setTimeout(() => setSaveButtonSuccess(false), 500);
      }
    } catch (error) {
      showToastMessage('保存失败');
    }
  };

  const handleLoad = async () => {
    try {
      const response = await fetch('/api/load?id=default');
      const result = await response.json();

      if (result.success && result.data) {
        const { starField, ships, buildings } = result.data;

        if (starFieldRef.current && starField.minerals) {
          starFieldRef.current.setMinerals(starField.minerals);
        }

        if (minerAIRef.current && ships) {
          minerAIRef.current.setShips(ships);
          setShips([...ships]);
        }

        if (buildingManagerRef.current && buildings) {
          buildingManagerRef.current.setState(buildings);
          setBuildings(buildingManagerRef.current.getBuildings());
          setResources(buildingManagerRef.current.getResources());
        }

        showToastMessage('存档已恢复');
      }
    } catch (error) {
      showToastMessage('加载失败');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle': return '空闲';
      case 'moving': return '移动中';
      case 'mining': return '采集中';
      case 'returning': return '返回中';
      default: return status;
    }
  };

  const getBuildingLevel = (type: BuildingType) => {
    if (!buildingManagerRef.current) return 0;
    return buildingManagerRef.current.getMaxLevel(type);
  };

  const getBuildCost = (type: BuildingType) => {
    if (!buildingManagerRef.current) return { gold: 0, iron: 0, crystal: 0 };
    const level = buildingManagerRef.current.getMaxLevel(type);
    return buildingManagerRef.current.getBuildCost(type, level);
  };

  const canBuild = (type: BuildingType) => {
    if (!buildingManagerRef.current) return false;
    const cost = getBuildCost(type);
    return buildingManagerRef.current.canAfford(cost);
  };

  return (
    <div className="game-container">
      <div className="game-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />

        <div
          className={`grid-tooltip ${tooltip.visible ? 'visible' : ''}`}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>

        <div className="top-buttons">
          <button
            className={`top-button ${saveButtonSuccess ? 'success' : ''}`}
            onClick={handleSave}
            title="保存游戏"
          >
            {saveButtonSuccess ? '✓' : '💾'}
          </button>
          <button
            className="top-button"
            onClick={handleLoad}
            title="加载游戏"
          >
            📁
          </button>
        </div>

        <div className="base-panel">
          <div className="base-title">基地建设</div>
          
          {(Object.keys(BUILDING_CONFIGS) as BuildingType[]).map((type) => {
            const config = BUILDING_CONFIGS[type];
            const level = getBuildingLevel(type);
            const cost = getBuildCost(type);
            const affordable = canBuild(type);
            const onCooldown = buildCooldowns[type];

            return (
              <div key={type} className="building-item">
                <div className="building-name">{config.name}</div>
                <div className="building-level">等级: {level}</div>
                <div className="building-cost">
                  {cost.gold > 0 && (
                    <span className="build-cost-item" style={{ color: '#e67e22' }}>
                      💰 {cost.gold}
                    </span>
                  )}
                  {cost.iron > 0 && (
                    <span className="build-cost-item" style={{ color: '#7f8c8d' }}>
                      ⚙️ {cost.iron}
                    </span>
                  )}
                  {cost.crystal > 0 && (
                    <span className="build-cost-item" style={{ color: '#9b59b6' }}>
                      💎 {cost.crystal}
                    </span>
                  )}
                </div>
                <button
                  className={`build-button ${onCooldown ? 'bounce' : ''}`}
                  onClick={() => handleBuild(type)}
                  disabled={!affordable || onCooldown}
                >
                  {level === 0 ? '建造' : '升级'}
                </button>
              </div>
            );
          })}

          <div className="storage-info">
            仓库容量: {storageInfo.current}/{storageInfo.capacity}
            <div className="storage-bar">
              <div
                className="storage-fill"
                style={{ width: `${(storageInfo.current / storageInfo.capacity) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="resources-section">
          <div className="resources-title">资源</div>
          
          <div className="resource-item">
            <div className="resource-icon gold">💰</div>
            <div className="resource-name">金币</div>
            <div className={`resource-amount ${resourceBounce.gold ? 'bounce' : ''}`}>
              {resources.gold}
            </div>
          </div>

          <div className="resource-item">
            <div className="resource-icon iron">⚙️</div>
            <div className="resource-name">铁矿</div>
            <div className={`resource-amount ${resourceBounce.iron ? 'bounce' : ''}`}>
              {resources.iron}
            </div>
          </div>

          <div className="resource-item">
            <div className="resource-icon crystal">💎</div>
            <div className="resource-name">水晶</div>
            <div className={`resource-amount ${resourceBounce.crystal ? 'bounce' : ''}`}>
              {resources.crystal}
            </div>
          </div>
        </div>

        <div className="ships-section">
          <div className="ships-title">矿船列表</div>
          
          {ships.map((ship) => (
            <div
              key={ship.id}
              className={`ship-item ${selectedShipId === ship.id ? 'selected' : ''}`}
              onClick={() => ship.status === 'idle' && setSelectedShipId(ship.id)}
            >
              <div className="ship-name">{ship.name}</div>
              <div className={`ship-status ${ship.status}`}>
                {getStatusText(ship.status)}
              </div>
              <div className="ship-health-bar">
                <div
                  className="ship-health-fill"
                  style={{ width: `${(ship.health / ship.maxHealth) * 100}%` }}
                />
              </div>
              <div className="ship-cargo">
                货物: {ship.currentCargo}/{ship.cargoCapacity}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`toast ${showToast ? 'visible' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
};

export default GameUI;
