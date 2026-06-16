import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ShipBuild, WeaponType, ShieldType, EngineType, PartLevel } from '../types';
import {
  WEAPON_CONFIG,
  SHIELD_CONFIG,
  ENGINE_CONFIG,
  WEAPON_NAMES,
  SHIELD_NAMES,
  ENGINE_NAMES,
} from '../utils/constants';
import {
  getShipBuilds,
  saveShipBuild,
  getCurrentBuildId,
  setCurrentBuildId,
  getCredits,
  spendCredits,
  addCredits,
} from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

const ShipCustomizer: React.FC = () => {
  const {
    currentBuild,
    setCurrentBuild,
    setBuilds,
    builds,
    setScene,
    credits,
    setCredits,
    unlockAchievement,
  } = useGameStore();

  const [selectedPart, setSelectedPart] = useState<'weapon' | 'shield' | 'engine' | null>(null);
  const [buildName, setBuildName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedBuilds = await getShipBuilds();
    const currentId = await getCurrentBuildId();
    const current = loadedBuilds.find(b => b.id === currentId) || loadedBuilds[0];
    setBuilds(loadedBuilds);
    if (current) setCurrentBuild(current);
    const creds = await getCredits();
    setCredits(creds);
  };

  const handleUpgrade = async (part: 'weapon' | 'shield' | 'engine') => {
    if (!currentBuild) return;

    const config = part === 'weapon'
      ? WEAPON_CONFIG[currentBuild.weapon.type]
      : part === 'shield'
      ? SHIELD_CONFIG[currentBuild.shield.type]
      : ENGINE_CONFIG[currentBuild.engine.type];

    const currentLevel = part === 'weapon'
      ? currentBuild.weapon.level
      : part === 'shield'
      ? currentBuild.shield.level
      : currentBuild.engine.level;

    if (currentLevel >= 3) return;

    const nextLevel = (currentLevel + 1) as PartLevel;
    const cost = config[nextLevel].cost;

    const success = await spendCredits(cost);
    if (!success) {
      alert('积分不足！');
      return;
    }

    const newCredits = await getCredits();
    setCredits(newCredits);

    const updatedBuild: ShipBuild = { ...currentBuild };
    if (part === 'weapon') {
      updatedBuild.weapon = { ...updatedBuild.weapon, level: nextLevel };
    } else if (part === 'shield') {
      updatedBuild.shield = { ...updatedBuild.shield, level: nextLevel };
    } else {
      updatedBuild.engine = { ...updatedBuild.engine, level: nextLevel };
    }

    await saveShipBuild(updatedBuild);
    setCurrentBuild(updatedBuild);

    checkMasterAchievement(updatedBuild);
  };

  const handleTypeChange = async (part: 'weapon' | 'shield' | 'engine', type: string) => {
    if (!currentBuild) return;

    const updatedBuild: ShipBuild = { ...currentBuild };
    if (part === 'weapon') {
      updatedBuild.weapon = { type: type as WeaponType, level: 1 };
    } else if (part === 'shield') {
      updatedBuild.shield = { type: type as ShieldType, level: 1 };
    } else {
      updatedBuild.engine = { type: type as EngineType, level: 1 };
    }

    await saveShipBuild(updatedBuild);
    setCurrentBuild(updatedBuild);
  };

  const checkMasterAchievement = (build: ShipBuild) => {
    if (build.weapon.level === 3 && build.shield.level === 3 && build.engine.level === 3) {
      unlockAchievement('custom_master');
    }
  };

  const handleNewBuild = () => {
    setShowNameInput(true);
  };

  const createNewBuild = async () => {
    if (!buildName.trim()) return;

    const newBuild: ShipBuild = {
      id: uuidv4(),
      name: buildName.trim(),
      weapon: { type: 'laser', level: 1 },
      shield: { type: 'damage', level: 1 },
      engine: { type: 'speed', level: 1 },
    };

    await saveShipBuild(newBuild);
    await setCurrentBuildId(newBuild.id);
    setCurrentBuild(newBuild);
    
    const loadedBuilds = await getShipBuilds();
    setBuilds(loadedBuilds);
    
    setBuildName('');
    setShowNameInput(false);
  };

  const switchBuild = async (build: ShipBuild) => {
    await setCurrentBuildId(build.id);
    setCurrentBuild(build);
  };

  if (!currentBuild) return null;

  const weaponStats = WEAPON_CONFIG[currentBuild.weapon.type][currentBuild.weapon.level];
  const shieldStats = SHIELD_CONFIG[currentBuild.shield.type][currentBuild.shield.level];
  const engineStats = ENGINE_CONFIG[currentBuild.engine.type][currentBuild.engine.level];

  const nextWeaponLevel = currentBuild.weapon.level < 3
    ? WEAPON_CONFIG[currentBuild.weapon.type][(currentBuild.weapon.level + 1) as PartLevel]
    : null;
  const nextShieldLevel = currentBuild.shield.level < 3
    ? SHIELD_CONFIG[currentBuild.shield.type][(currentBuild.shield.level + 1) as PartLevel]
    : null;
  const nextEngineLevel = currentBuild.engine.level < 3
    ? ENGINE_CONFIG[currentBuild.engine.type][(currentBuild.engine.level + 1) as PartLevel]
    : null;

  return (
    <div className="w-full h-full flex flex-col p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-yellow-400">战舰改装</h2>
        <div className="flex items-center gap-4">
          <span className="text-green-400">积分: {credits}</span>
          <button className="btn" onClick={() => setScene('menu')}>
            返回
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {builds.map(build => (
          <button
            key={build.id}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              build.id === currentBuild.id
                ? 'bg-yellow-500 text-black font-bold'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => switchBuild(build)}
          >
            {build.name}
          </button>
        ))}
        <button
          className="px-4 py-2 rounded-lg bg-green-500/30 hover:bg-green-500/50 text-green-300"
          onClick={handleNewBuild}
        >
          + 新方案
        </button>
      </div>

      {showNameInput && (
        <div className="modal-overlay" onClick={() => setShowNameInput(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">新改装方案</h3>
            <input
              type="text"
              value={buildName}
              onChange={e => setBuildName(e.target.value)}
              placeholder="输入方案名称"
              className="w-full px-4 py-2 mb-4 bg-white/10 border border-white/20 rounded-lg text-white"
              maxLength={12}
              autoFocus
            />
            <div className="flex gap-2">
              <button className="btn flex-1" onClick={() => setShowNameInput(false)}>
                取消
              </button>
              <button className="btn btn-primary flex-1" onClick={createNewBuild}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto scrollable">
          <div
            className={`card p-4 cursor-pointer transition-all border-2 ${
              selectedPart === 'weapon' ? 'scale-105' : ''
            }`}
            style={{ borderColor: '#FF4757' }}
            onClick={() => setSelectedPart(selectedPart === 'weapon' ? null : 'weapon')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold" style={{ color: '#FF4757' }}>
                主武器
              </h3>
              <span className="text-sm text-gray-400">
                Lv.{currentBuild.weapon.level}/3
              </span>
            </div>
            <p className="text-lg font-medium mb-2">
              {WEAPON_NAMES[currentBuild.weapon.type]}
            </p>
            <div className="progress-bar mb-2">
              <div
                className="progress-fill"
                style={{
                  width: `${(currentBuild.weapon.level / 3) * 100}%`,
                  background: '#FF4757',
                }}
              />
            </div>
            <p className="text-sm text-gray-400">
              伤害: {weaponStats.damage} · 射速: {Math.round(1000 / weaponStats.fireRate)}/秒
            </p>

            {selectedPart === 'weapon' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['laser', 'scatter', 'rapid'] as WeaponType[]).map(type => (
                    <button
                      key={type}
                      className={`p-2 rounded text-xs ${
                        currentBuild.weapon.type === type
                          ? 'bg-red-500/30 border border-red-500'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      onClick={e => {
                        e.stopPropagation();
                        handleTypeChange('weapon', type);
                      }}
                    >
                      {WEAPON_NAMES[type]}
                    </button>
                  ))}
                </div>

                {nextWeaponLevel ? (
                  <button
                    className="btn btn-primary w-full text-sm py-2"
                    onClick={e => {
                      e.stopPropagation();
                      handleUpgrade('weapon');
                    }}
                    disabled={credits < nextWeaponLevel.cost}
                  >
                    升级 ({nextWeaponLevel.cost} 积分)
                  </button>
                ) : (
                  <p className="text-center text-yellow-400 text-sm">已满级</p>
                )}
              </div>
            )}
          </div>

          <div
            className={`card p-4 cursor-pointer transition-all border-2 ${
              selectedPart === 'shield' ? 'scale-105' : ''
            }`}
            style={{ borderColor: '#3742FA' }}
            onClick={() => setSelectedPart(selectedPart === 'shield' ? null : 'shield')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold" style={{ color: '#3742FA' }}>
                护盾
              </h3>
              <span className="text-sm text-gray-400">
                Lv.{currentBuild.shield.level}/3
              </span>
            </div>
            <p className="text-lg font-medium mb-2">
              {SHIELD_NAMES[currentBuild.shield.type]}
            </p>
            <div className="progress-bar mb-2">
              <div
                className="progress-fill"
                style={{
                  width: `${(currentBuild.shield.level / 3) * 100}%`,
                  background: '#3742FA',
                }}
              />
            </div>
            <p className="text-sm text-gray-400">
              减伤: {Math.round(shieldStats.damageReduction * 100)}% · 反弹: {Math.round(shieldStats.reflectChance * 100)}%
            </p>

            {selectedPart === 'shield' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['damage', 'reflect', 'armor'] as ShieldType[]).map(type => (
                    <button
                      key={type}
                      className={`p-2 rounded text-xs ${
                        currentBuild.shield.type === type
                          ? 'bg-blue-500/30 border border-blue-500'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      onClick={e => {
                        e.stopPropagation();
                        handleTypeChange('shield', type);
                      }}
                    >
                      {SHIELD_NAMES[type]}
                    </button>
                  ))}
                </div>

                {nextShieldLevel ? (
                  <button
                    className="btn w-full text-sm py-2"
                    style={{ background: 'linear-gradient(135deg, #3742FA 0%, #5B6DFF 100%)' }}
                    onClick={e => {
                      e.stopPropagation();
                      handleUpgrade('shield');
                    }}
                    disabled={credits < nextShieldLevel.cost}
                  >
                    升级 ({nextShieldLevel.cost} 积分)
                  </button>
                ) : (
                  <p className="text-center text-yellow-400 text-sm">已满级</p>
                )}
              </div>
            )}
          </div>

          <div
            className={`card p-4 cursor-pointer transition-all border-2 ${
              selectedPart === 'engine' ? 'scale-105' : ''
            }`}
            style={{ borderColor: '#2ED573' }}
            onClick={() => setSelectedPart(selectedPart === 'engine' ? null : 'engine')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold" style={{ color: '#2ED573' }}>
                引擎
              </h3>
              <span className="text-sm text-gray-400">
                Lv.{currentBuild.engine.level}/3
              </span>
            </div>
            <p className="text-lg font-medium mb-2">
              {ENGINE_NAMES[currentBuild.engine.type]}
            </p>
            <div className="progress-bar mb-2">
              <div
                className="progress-fill"
                style={{
                  width: `${(currentBuild.engine.level / 3) * 100}%`,
                  background: '#2ED573',
                }}
              />
            </div>
            <p className="text-sm text-gray-400">
              速度: {engineStats.speed} · 闪避: {Math.round(engineStats.dodgeChance * 100)}%
            </p>

            {selectedPart === 'engine' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['speed', 'dodge', 'boost'] as EngineType[]).map(type => (
                    <button
                      key={type}
                      className={`p-2 rounded text-xs ${
                        currentBuild.engine.type === type
                          ? 'bg-green-500/30 border border-green-500'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      onClick={e => {
                        e.stopPropagation();
                        handleTypeChange('engine', type);
                      }}
                    >
                      {ENGINE_NAMES[type]}
                    </button>
                  ))}
                </div>

                {nextEngineLevel ? (
                  <button
                    className="btn btn-secondary w-full text-sm py-2"
                    onClick={e => {
                      e.stopPropagation();
                      handleUpgrade('engine');
                    }}
                    disabled={credits < nextEngineLevel.cost}
                  >
                    升级 ({nextEngineLevel.cost} 积分)
                  </button>
                ) : (
                  <p className="text-center text-yellow-400 text-sm">已满级</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-72 flex-shrink-0">
          <div className="card p-4 h-full flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold mb-4 text-gray-300">飞船预览</h3>
            <div className="ship-preview">
              <div
                className="shield-effect"
                style={{
                  borderColor: shieldStats.color,
                  opacity: currentBuild.shield.level > 0 ? 0.4 : 0,
                  width: 100 + currentBuild.shield.level * 15,
                  height: 100 + currentBuild.shield.level * 15,
                }}
              />
              <div className="ship-body">
                <div className="ship-main" />
                <div className="ship-cockpit" />
                <div className="ship-wing-left" />
                <div className="ship-wing-right" />
                <div
                  className="ship-engine"
                  style={{
                    width: 15 + currentBuild.engine.level * 5,
                    height: 20 + currentBuild.engine.level * 15,
                  }}
                />

                {currentBuild.weapon.level >= 2 && (
                  <>
                    <div
                      className="absolute left-[-18px] top-[20px] w-2 h-8 rounded"
                      style={{ background: '#FFD700' }}
                    />
                    <div
                      className="absolute right-[-18px] top-[20px] w-2 h-8 rounded"
                      style={{ background: '#FFD700' }}
                    />
                  </>
                )}
                {currentBuild.weapon.level >= 3 && (
                  <div
                    className="absolute left-1/2 top-[-8px] w-2 h-4 -translate-x-1/2 rounded"
                    style={{ background: '#FF6B6B' }}
                  />
                )}
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-400">{currentBuild.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipCustomizer;
