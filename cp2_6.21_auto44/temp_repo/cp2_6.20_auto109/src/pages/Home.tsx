import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BTEditor, GridMap } from '@/components/Editor';
import { SimControl } from '@/components/Simulator';
import { TERRAIN_INFO, type TerrainType } from '@/modules/battle-engine';

const TERRAIN_TOOLS: TerrainType[] = ['grass', 'forest', 'rock', 'river'];

export default function Home() {
  const {
    behaviorTrees,
    currentTreeId,
    currentTab,
    selectedTerrainTool,
    showSidebar,
    setCurrentTree,
    createTree,
    deleteTree,
    setCurrentTab,
    setSelectedTerrainTool,
    setShowSidebar,
    units,
    assignBehaviorTree,
    isSimulating,
  } = useGameStore();

  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const treeOptions = useMemo(
    () => behaviorTrees.map((t) => ({ id: t.id, name: t.name })),
    [behaviorTrees]
  );

  const aliveUnits = useMemo(
    () => units.filter((u) => u.isAlive),
    [units]
  );

  const handleCreateTree = useCallback(() => {
    const name = `行为树 ${behaviorTrees.length + 1}`;
    createTree(name);
  }, [behaviorTrees.length, createTree]);

  const sidebarClass = isNarrow
    ? `sidebar${showSidebar ? ' open' : ''}`
    : 'sidebar';

  return (
    <div className="app-container">
      {isNarrow && (
        <button className="menu-btn" onClick={() => setShowSidebar(!showSidebar)}>
          ☰
        </button>
      )}

      {isNarrow && showSidebar && (
        <div className="overlay show" onClick={() => setShowSidebar(false)} />
      )}

      <div className={sidebarClass} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="sidebar-tabs">
          <div
            className={`sidebar-tab${currentTab === 'editor' ? ' active' : ''}`}
            onClick={() => setCurrentTab('editor')}
          >
            行为树
          </div>
          <div
            className={`sidebar-tab${currentTab === 'map' ? ' active' : ''}`}
            onClick={() => setCurrentTab('map')}
          >
            地图设置
          </div>
        </div>

        {currentTab === 'editor' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="tree-selector">
              <select
                value={currentTreeId || ''}
                onChange={(e) => setCurrentTree(e.target.value || null)}
              >
                {treeOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button onClick={handleCreateTree}>新建</button>
              {currentTreeId && (
                <button
                  onClick={() => deleteTree(currentTreeId)}
                  style={{ backgroundColor: '#5c1a1a' }}
                >
                  删除
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <BTEditor />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div className="terrain-toolbar">
              <span style={{ color: '#a0a0a0', fontSize: '12px', marginRight: 8 }}>地形画笔:</span>
              {TERRAIN_TOOLS.map((t) => (
                <button
                  key={t}
                  className={`terrain-btn${selectedTerrainTool === t ? ' active' : ''}`}
                  onClick={() => setSelectedTerrainTool(selectedTerrainTool === t ? null : t)}
                >
                  {TERRAIN_INFO[t].icon} {t === 'grass' ? '草地(消耗1)' : t === 'forest' ? '树林(消耗2)' : t === 'rock' ? '岩石(消耗3)' : '河流(不可通行)'}
                </button>
              ))}
              {selectedTerrainTool && (
                <button
                  className="terrain-btn"
                  onClick={() => setSelectedTerrainTool(null)}
                  style={{ borderColor: '#ff7875', color: '#ff7875' }}
                >
                  取消画笔
                </button>
              )}
            </div>

            <div className="unit-assign-panel">
              <h4>单位行为树分配</h4>
              {aliveUnits.map((unit) => (
                <div key={unit.id} className="unit-assign-item">
                  <div
                    className="unit-color"
                    style={{
                      backgroundColor:
                        unit.team === 'red'
                          ? '#ff4d4f'
                          : '#1890ff',
                    }}
                  />
                  <span style={{ flex: '0 0 auto', minWidth: 80 }}>{unit.name}</span>
                  <select
                    value={unit.behaviorTreeId}
                    onChange={(e) => assignBehaviorTree(unit.id, e.target.value)}
                    disabled={isSimulating}
                  >
                    {treeOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, color: '#666', fontSize: '12px' }}>
              <p>点击地图格子修改地形</p>
              <p>草地消耗1移动力 | 树林消耗2 | 岩石消耗3 | 河流不可通行</p>
            </div>
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="header-bar">
          <h1>AI战棋编辑器</h1>
          {useGameStore.getState().battleResult && (
            <div className={`battle-result ${useGameStore.getState().battleResult}`}>
              {useGameStore.getState().battleResult === 'red' ? '红方胜利' : '蓝方胜利'}
            </div>
          )}
        </div>

        <GridMap />

        <SimControl />
      </div>
    </div>
  );
}
