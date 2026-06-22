
import React, { useState, useEffect, useCallback, useRef } from 'react';
import BattleField from './components/BattleField';
import InfoPanel from './components/InfoPanel';
import type {
  BattleState,
  Unit,
  HexCoord,
  Skill,
  ActionRequest,
} from '../server/battleEngine';

const GRID_SIZE = 8;

const App: React.FC = () => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [reachableHexes, setReachableHexes] = useState<HexCoord[]>([]);
  const [skillTargetHexes, setSkillTargetHexes] = useState<HexCoord[]>([]);
  const [skillAreaHexes, setSkillAreaHexes] = useState<HexCoord[]>([]);
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initBattle = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/init');
      const data = await response.json();
      setBattleState(data);
      setSelectedUnitId(null);
      setSelectedSkill(null);
      setReachableHexes([]);
      setSkillTargetHexes([]);
      setSkillAreaHexes([]);
    } catch (error) {
      console.error('Failed to init battle:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initBattle();
  }, [initBattle]);

  const currentUnit = battleState?.units.find(
    u => u.id === battleState.turnOrder[battleState.currentTurnIndex]
  ) || null;

  const selectedUnit = battleState?.units.find(u => u.id === selectedUnitId) || null;

  const turnOrderUnits = battleState?.turnOrder
    .map(id => battleState.units.find(u => u.id === id))
    .filter(Boolean) as Unit[] || [];

  const hexDistance = (a: HexCoord, b: HexCoord): number => {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  };

  const getReachableHexes = useCallback((unit: Unit): HexCoord[] => {
    if (!battleState) return [];
    
    const reachable: HexCoord[] = [];
    const visited = new Map<string, number>();
    const queue: { hex: HexCoord; cost: number }[] = [{ hex: unit.position, cost: 0 }];
    
    const key = (h: HexCoord) => `${h.q},${h.r}`;
    visited.set(key(unit.position), 0);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.cost > 0) {
        reachable.push(current.hex);
      }
      
      if (current.cost >= unit.moveRange) continue;
      
      const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
      ];
      
      for (const dir of directions) {
        const neighbor = { q: current.hex.q + dir.q, r: current.hex.r + dir.r };
        
        if (neighbor.q < 0 || neighbor.q >= GRID_SIZE || 
            neighbor.r < 0 || neighbor.r >= GRID_SIZE) {
          continue;
        }
        
        const terrain = battleState.grid[neighbor.r][neighbor.q];
        const newCost = current.cost + terrain.moveCost;
        
        if (newCost <= unit.moveRange) {
          const k = key(neighbor);
          if (!visited.has(k) || visited.get(k)! > newCost) {
            visited.set(k, newCost);
            queue.push({ hex: neighbor, cost: newCost });
          }
        }
      }
    }
    
    return reachable.filter(h => {
      const hasUnit = battleState.units.some(u => 
        u.position.q === h.q && u.position.r === h.r && u.hp > 0
      );
      return !hasUnit;
    });
  }, [battleState]);

  const getSkillTargetHexes = useCallback((unit: Unit, skill: Skill): HexCoord[] => {
    const targets: HexCoord[] = [];
    
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let q = 0; q < GRID_SIZE; q++) {
        const hex = { q, r };
        const dist = hexDistance(unit.position, hex);
        if (dist <= skill.range && dist > 0) {
          targets.push(hex);
        }
      }
    }
    
    return targets;
  }, []);

  const getSkillAreaHexes = useCallback((center: HexCoord, skill: Skill): HexCoord[] => {
    if (skill.areaType === 'single') {
      return [center];
    }
    
    const area: HexCoord[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let q = 0; q < GRID_SIZE; q++) {
        const hex = { q, r };
        if (hexDistance(center, hex) <= skill.areaSize) {
          area.push(hex);
        }
      }
    }
    return area;
  }, []);

  const handleUnitClick = useCallback((unit: Unit) => {
    if (!battleState || battleState.gameOver) return;
    
    if (selectedSkill && currentUnit?.faction === 'player' && unit.faction === 'enemy') {
      const dist = hexDistance(currentUnit.position, unit.position);
      if (dist <= selectedSkill.range) {
        handleSkillUse(unit.position);
        return;
      }
    }
    
    setSelectedUnitId(unit.id);
    setSelectedSkill(null);
    setSkillTargetHexes([]);
    setSkillAreaHexes([]);
    
    if (unit.faction === 'player' && currentUnit?.id === unit.id && !unit.hasMoved) {
      setReachableHexes(getReachableHexes(unit));
    } else {
      setReachableHexes([]);
    }
  }, [battleState, selectedSkill, currentUnit, getReachableHexes]);

  const handleHexClick = useCallback((hex: HexCoord) => {
    if (!battleState || battleState.gameOver) return;
    
    if (selectedSkill && currentUnit?.faction === 'player') {
      const dist = hexDistance(currentUnit.position, hex);
      if (dist <= selectedSkill.range) {
        handleSkillUse(hex);
        return;
      }
    }
    
    if (currentUnit?.faction === 'player' && !currentUnit.hasMoved) {
      const isValidMove = reachableHexes.some(
        h => h.q === hex.q && h.r === hex.r
      );
      
      if (isValidMove) {
        handleMove(hex);
        return;
      }
    }
    
    setSelectedUnitId(null);
    setSelectedSkill(null);
    setReachableHexes([]);
    setSkillTargetHexes([]);
    setSkillAreaHexes([]);
  }, [battleState, selectedSkill, currentUnit, reachableHexes]);

  const handleMove = async (targetPosition: HexCoord) => {
    if (!battleState || !currentUnit) return;
    
    try {
      const action: ActionRequest = {
        unitId: currentUnit.id,
        actionType: 'move',
        targetPosition,
      };
      
      const response = await fetch('/api/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      
      const data = await response.json();
      setBattleState(data);
      setReachableHexes([]);
    } catch (error) {
      console.error('Failed to move:', error);
    }
  };

  const handleSkillUse = async (targetPosition: HexCoord) => {
    if (!battleState || !currentUnit || !selectedSkill) return;
    
    try {
      const action: ActionRequest = {
        unitId: currentUnit.id,
        actionType: 'skill',
        skillId: selectedSkill.id,
        targetPosition,
      };
      
      const response = await fetch('/api/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      
      const data = await response.json();
      setBattleState(data);
      setSelectedSkill(null);
      setReachableHexes([]);
      setSkillTargetHexes([]);
      setSkillAreaHexes([]);
      setSelectedUnitId(null);
    } catch (error) {
      console.error('Failed to use skill:', error);
    }
  };

  const handleSkillSelect = useCallback((skill: Skill | null) => {
    setSelectedSkill(skill);
    
    if (skill && currentUnit) {
      setSkillTargetHexes(getSkillTargetHexes(currentUnit, skill));
      setReachableHexes([]);
    } else {
      setSkillTargetHexes([]);
      setSkillAreaHexes([]);
      
      if (currentUnit && selectedUnitId === currentUnit.id && !currentUnit.hasMoved) {
        setReachableHexes(getReachableHexes(currentUnit));
      }
    }
  }, [currentUnit, selectedUnitId, getSkillTargetHexes, getReachableHexes]);

  const handleHexHover = useCallback((hex: HexCoord | null) => {
    setHoveredHex(hex);
    
    if (selectedSkill && hex) {
      setSkillAreaHexes(getSkillAreaHexes(hex, selectedSkill));
    } else if (!hex) {
      setSkillAreaHexes([]);
    }
  }, [selectedSkill, getSkillAreaHexes]);

  const handleEndTurn = async () => {
    if (!battleState || !currentUnit) return;
    
    try {
      const action: ActionRequest = {
        unitId: currentUnit.id,
        actionType: 'endTurn',
      };
      
      const response = await fetch('/api/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      
      const data = await response.json();
      setBattleState(data);
      setSelectedUnitId(null);
      setSelectedSkill(null);
      setReachableHexes([]);
      setSkillTargetHexes([]);
      setSkillAreaHexes([]);
    } catch (error) {
      console.error('Failed to end turn:', error);
    }
  };

  useEffect(() => {
    if (!battleState || battleState.gameOver) return;
    
    const currentUnit = battleState.units.find(
      u => u.id === battleState.turnOrder[battleState.currentTurnIndex]
    );
    
    if (currentUnit && currentUnit.faction === 'enemy' && currentUnit.hp > 0) {
      setIsAiThinking(true);
      
      aiTimeoutRef.current = setTimeout(async () => {
        try {
          let action: ActionRequest | null = null;
          
          const playerUnits = battleState.units.filter(u => u.faction === 'player' && u.hp > 0);
          
          if (playerUnits.length > 0) {
            let nearestTarget: Unit | null = null;
            let minDistance = Infinity;
            
            for (const target of playerUnits) {
              const dist = hexDistance(currentUnit.position, target.position);
              if (dist < minDistance) {
                minDistance = dist;
                nearestTarget = target;
              }
            }
            
            if (nearestTarget) {
              const availableSkills = currentUnit.skills.filter(s => s.currentCooldown === 0);
              
              for (const skill of [...availableSkills].sort((a, b) => b.power - a.power)) {
                if (minDistance <= skill.range) {
                  action = {
                    unitId: currentUnit.id,
                    actionType: 'skill',
                    skillId: skill.id,
                    targetPosition: nearestTarget.position,
                  };
                  break;
                }
              }
              
              if (!action && !currentUnit.hasMoved) {
                const reachable = getReachableHexes(currentUnit);
                
                let bestHex: HexCoord | null = null;
                let bestDistance = Infinity;
                
                for (const hex of reachable) {
                  const dist = hexDistance(hex, nearestTarget.position);
                  if (dist < bestDistance) {
                    bestDistance = dist;
                    bestHex = hex;
                  }
                }
                
                if (bestHex && bestDistance < minDistance) {
                  action = {
                    unitId: currentUnit.id,
                    actionType: 'move',
                    targetPosition: bestHex,
                  };
                }
              }
            }
          }
          
          if (!action) {
            action = {
              unitId: currentUnit.id,
              actionType: 'endTurn',
            };
          }
          
          const response = await fetch('/api/act', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action),
          });
          
          const data = await response.json();
          setBattleState(data);
          
          if (action.actionType === 'move') {
            setTimeout(() => {
              setIsAiThinking(false);
            }, 500);
          } else {
            setIsAiThinking(false);
          }
        } catch (error) {
          console.error('AI action failed:', error);
          setIsAiThinking(false);
        }
      }, 800);
    } else {
      setIsAiThinking(false);
    }
    
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [battleState?.currentTurnIndex, battleState?.gameOver, getReachableHexes]);

  const handleRestart = () => {
    initBattle();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚔️</div>
          <div className="text-2xl font-bold text-indigo-800">正在加载战斗场景...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-amber-600">
            ⚔️ 回合制战术战斗模拟器
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            点击己方单位选择移动或技能，点击敌方单位或地形执行
          </p>
        </header>

        <div className="flex gap-4">
          <div className="w-80 flex-shrink-0" style={{ height: 'calc(100vh - 120px)' }}>
            {battleState && (
              <InfoPanel
                selectedUnit={selectedUnit}
                currentUnit={currentUnit}
                logs={battleState.logs}
                round={battleState.round}
                turnOrder={turnOrderUnits}
                selectedSkill={selectedSkill}
                onSkillSelect={handleSkillSelect}
                onEndTurn={handleEndTurn}
                gameOver={battleState.gameOver}
                winner={battleState.winner}
                onRestart={handleRestart}
              />
            )}
          </div>

          <div className="flex-1 flex items-start justify-center">
            {battleState && (
              <div className="relative">
                <BattleField
                  grid={battleState.grid}
                  units={battleState.units}
                  currentUnitId={currentUnit?.id || null}
                  selectedUnitId={selectedUnitId}
                  selectedSkill={selectedSkill}
                  reachableHexes={reachableHexes}
                  skillTargetHexes={skillTargetHexes}
                  skillAreaHexes={skillAreaHexes}
                  gameOver={battleState.gameOver}
                  onUnitClick={handleUnitClick}
                  onHexClick={handleHexClick}
                  onHexHover={handleHexHover}
                  hoveredHex={hoveredHex}
                />
                
                {isAiThinking && (
                  <div className="absolute top-4 right-4 bg-red-600/90 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    敌方思考中...
                  </div>
                )}
                
                {battleState.gameOver && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center bg-black/70 rounded-2xl p-8 backdrop-blur-sm">
                      <div className="text-5xl mb-4">
                        {battleState.winner === 'player' ? '🏆' : '💀'}
                      </div>
                      <div className="text-3xl font-bold text-amber-400 mb-2">
                        战斗结束
                      </div>
                      <div className="text-xl text-white mb-4">
                        {battleState.winner === 'player' ? '🎉 我方获胜！' : '💔 敌方获胜！'}
                      </div>
                      <button
                        onClick={handleRestart}
                        className="pointer-events-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 
                          hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl 
                          transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-500/30"
                      >
                        重新开始
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-64 flex-shrink-0">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-4 shadow-xl border border-slate-600/30">
              <h3 className="text-lg font-bold text-amber-400 mb-3">🎮 操作说明</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">1.</span>
                  <span>点击<span className="text-blue-400 font-semibold">己方蓝色单位</span>查看详情</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">2.</span>
                  <span>当前行动单位可<span className="text-green-400 font-semibold">移动</span>（绿色高亮区域）</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">3.</span>
                  <span>选择技能后点击<span className="text-amber-400 font-semibold">目标位置</span>释放</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400">4.</span>
                  <span><span className="text-red-400 font-semibold">红色单位</span>由AI自动控制</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400">5.</span>
                  <span>行动完毕后点击<span className="text-purple-400 font-semibold">结束回合</span></span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-600/30">
                <h4 className="text-sm font-semibold text-amber-400 mb-2">🗺️ 地形说明</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-400" />
                    <span className="text-slate-300">平原 - 消耗1，无加成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-700" />
                    <span className="text-slate-300">树林 - 消耗2，+2防御</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-500" />
                    <span className="text-slate-300">岩石 - 消耗3，+3防御-1攻击</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-400" />
                    <span className="text-slate-300">河流 - 消耗2，-1防御</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-800" />
                    <span className="text-slate-300">沼泽 - 消耗3，-1攻击</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

