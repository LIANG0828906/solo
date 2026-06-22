import React, { useState } from 'react';
import { useBattlefieldStore, CommandType, Unit } from '../store';
import { Crosshair, Scatter, List, Play, Pause, RefreshCw, RotateCcw, ChevronDown } from 'lucide-react';

const commandLabels: Record<CommandType, string> = {
  surround: '包围阵型',
  disperse: '分散阵型',
  formation: '列阵阵型',
};

const commandIcons: Record<CommandType, React.ReactNode> = {
  surround: <Crosshair size={16} />,
  disperse: <Scatter size={16} />,
  formation: <List size={16} />,
};

export const CommandPanel: React.FC<{ mobileOpen: boolean; onCloseMobile: () => void }> = ({
  mobileOpen,
  onCloseMobile,
}) => {
  const store = useBattlefieldStore();
  const [activeTab, setActiveTab] = useState<'commands' | 'place'>('commands');

  const selectedUnits: Unit[] = store.units.filter((u) =>
    store.selectedUnitIds.includes(u.id)
  );

  const commandParamsContent = () => {
    switch (store.commandType) {
      case 'surround':
        return (
          <div className="param-group">
            <label>包围半径: {store.surroundRadius}px</label>
            <input
              type="range"
              min="50"
              max="250"
              value={store.surroundRadius}
              onChange={(e) => store.setSurroundRadius(Number(e.target.value))}
            />
          </div>
        );
      case 'disperse':
        return (
          <div className="param-group">
            <label>分散半径: {store.disperseRadius}px</label>
            <input
              type="range"
              min="40"
              max="200"
              value={store.disperseRadius}
              onChange={(e) => store.setDisperseRadius(Number(e.target.value))}
            />
          </div>
        );
      case 'formation':
        return (
          <>
            <div className="param-group">
              <label>阵型宽度: {store.formationWidth}px</label>
              <input
                type="range"
                min="80"
                max="500"
                value={store.formationWidth}
                onChange={(e) => store.setFormationWidth(Number(e.target.value))}
              />
            </div>
            <div className="param-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={store.formationArc}
                  onChange={(e) => store.setFormationArc(e.target.checked)}
                />
                弧形队列
              </label>
            </div>
          </>
        );
    }
  };

  const issueCommand = () => {
    if (store.selectedUnitIds.length === 0) return;
    store.setPendingTarget({ x: 0, y: 0 });
  };

  return (
    <>
      <aside className={`command-panel ${mobileOpen ? 'mobile-open' : ''}`}>
        {mobileOpen && (
          <button className="mobile-close" onClick={onCloseMobile}>
            ×
          </button>
        )}
        <div className="panel-header">
          <h2>战术指令</h2>
        </div>

        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'place' ? 'active' : ''}`}
            onClick={() => setActiveTab('place')}
          >
            部署
          </button>
          <button
            className={`tab-btn ${activeTab === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveTab('commands')}
          >
            指令
          </button>
        </div>

        <div className="panel-content">
          {activeTab === 'place' && (
            <div className="place-section">
              <h3>放置单位</h3>
              <p className="hint">选择阵营后在战场点击部署</p>
              <div className="place-buttons">
                <button
                  className={`place-btn red ${store.placingTeam === 'red' ? 'active' : ''}`}
                  onClick={() => store.setPlacingTeam(store.placingTeam === 'red' ? null : 'red')}
                >
                  <span className="shape red-shape"></span>
                  红方 (三角)
                </button>
                <button
                  className={`place-btn blue ${store.placingTeam === 'blue' ? 'active' : ''}`}
                  onClick={() => store.setPlacingTeam(store.placingTeam === 'blue' ? null : 'blue')}
                >
                  <span className="shape blue-shape"></span>
                  蓝方 (圆形)
                </button>
              </div>
              <button className="control-btn full" onClick={() => store.resetBattlefield()}>
                <RefreshCw size={14} /> 重置战场
              </button>
            </div>
          )}

          {activeTab === 'commands' && (
            <>
              <div className="command-types">
                {(Object.keys(commandLabels) as CommandType[]).map((type) => (
                  <button
                    key={type}
                    className={`cmd-type-btn ${store.commandType === type ? 'active' : ''}`}
                    onClick={() => store.setCommandType(type)}
                  >
                    {commandIcons[type]}
                    <span>{commandLabels[type]}</span>
                  </button>
                ))}
              </div>

              <div className="params-section">{commandParamsContent()}</div>

              <div className="selected-info">
                <h4>已选单位: {store.selectedUnitIds.length}</h4>
              </div>

              <button
                className="issue-btn"
                disabled={store.selectedUnitIds.length === 0}
                onClick={issueCommand}
              >
                {store.selectedUnitIds.length === 0
                  ? '请先选择单位'
                  : `点击战场指定目标 (${commandLabels[store.commandType]})`}
              </button>

              {store.selectedUnitIds.length > 0 && (
                <button
                  className="cancel-target-btn"
                  onClick={() => store.setPendingTarget(null)}
                >
                  取消目标
                </button>
              )}
            </>
          )}

          <div className="control-section">
            <h3>播放控制</h3>
            <div className="control-row">
              <button
                className="control-btn"
                onClick={() => store.setIsPlaying(!store.isPlaying)}
              >
                {store.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {store.isPlaying ? '暂停' : '播放'}
              </button>
              <button className="control-btn" onClick={() => store.clearSelection()}>
                <RotateCcw size={14} /> 清除选择
              </button>
            </div>
            <div className="replay-speed">
              <label>回放速度:</label>
              <div className="speed-btns">
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    className={`speed-btn ${store.replaySpeed === s ? 'active' : ''}`}
                    onClick={() => store.setReplaySpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedUnits.length > 0 && (
            <div className="unit-props">
              <h3>单位属性</h3>
              <div className="unit-list">
                {selectedUnits.slice(0, 4).map((u) => (
                  <div key={u.id} className="unit-prop-item">
                    <div className="unit-prop-header">
                      <span
                        className={`unit-dot ${u.team}`}
                      ></span>
                      <span className="unit-id">{u.id.slice(0, 6)}</span>
                      <span className={`unit-state ${u.state}`}>{u.state}</span>
                    </div>
                    <div className="unit-prop-row">
                      <span>HP:</span>
                      <div className="mini-hp-bar">
                        <div
                          className="mini-hp-fill"
                          style={{
                            width: `${(u.hp / u.maxHp) * 100}%`,
                            background:
                              u.hp / u.maxHp > 0.75
                                ? '#4caf50'
                                : u.hp / u.maxHp > 0.25
                                ? '#ffeb3b'
                                : '#f44336',
                          }}
                        ></div>
                      </div>
                      <span>{u.hp}/{u.maxHp}</span>
                    </div>
                    <div className="unit-prop-row small">
                      <span>速度: {u.speed.toFixed(1)}</span>
                      <span>攻击: {u.attack}</span>
                    </div>
                  </div>
                ))}
                {selectedUnits.length > 4 && (
                  <div className="more-units">
                    <ChevronDown size={14} /> +{selectedUnits.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
      {mobileOpen && <div className="mobile-overlay" onClick={onCloseMobile}></div>}
    </>
  );
};

export default CommandPanel;
