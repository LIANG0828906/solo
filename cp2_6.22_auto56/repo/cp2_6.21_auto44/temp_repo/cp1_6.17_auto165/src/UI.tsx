import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from './gameStore';
import { getCargoUsed, getCargoFree } from './ShipState';
import { GameScene } from './GameScene';
import type { Commodity, Planet } from './types';

export const UI: React.FC = () => {
  const ship = useGameStore(s => s.ship);
  const currentPlanet = useGameStore(s => s.currentPlanet);
  const planets = useGameStore(s => s.planets);
  const eventLogs = useGameStore(s => s.eventLogs);
  const turn = useGameStore(s => s.turn);
  const activeEvent = useGameStore(s => s.activeEvent);
  const selectedCommodity = useGameStore(s => s.selectedCommodity);
  const tradeQuantity = useGameStore(s => s.tradeQuantity);
  const lastSaveTime = useGameStore(s => s.lastSaveTime);
  const isMoving = useGameStore(s => s.isMoving);

  const selectCommodity = useGameStore(s => s.selectCommodity);
  const setTradeQuantity = useGameStore(s => s.setTradeQuantity);
  const executeBuy = useGameStore(s => s.executeBuy);
  const executeSell = useGameStore(s => s.executeSell);
  const handleEventChoice = useGameStore(s => s.handleEventChoice);
  const doUpgradeCargo = useGameStore(s => s.doUpgradeCargo);
  const doUpgradeFuelTank = useGameStore(s => s.doUpgradeFuelTank);
  const saveGame = useGameStore(s => s.saveGame);
  const loadGame = useGameStore(s => s.loadGame);
  const initGame = useGameStore(s => s.initGame);

  const cargoUsed = getCargoUsed(ship);
  const cargoFree = getCargoFree(ship);
  const canUpgrade = ship.credits >= 1000 && ship.reputation > 60;

  useEffect(() => {
    initGame();
  }, []);

  return (
    <div style={containerStyle}>
      <div style={leftPanelStyle}>
        <div style={panelTitleStyle}>飞船状态</div>

        <StatusRow label="资金" value={`${ship.credits} ¢`} color="#66FCF1" />

        <div style={progressContainerStyle}>
          <div style={progressLabelStyle}>
            <span>燃料</span>
            <span style={{ color: '#4ADE80' }}>{ship.fuel}/{ship.maxFuel}</span>
          </div>
          <div style={progressBarBgStyle}>
            <div style={{
              ...progressBarFillStyle,
              width: `${(ship.fuel / ship.maxFuel) * 100}%`,
              background: '#4ADE80',
            }} />
          </div>
        </div>

        <div style={progressContainerStyle}>
          <div style={progressLabelStyle}>
            <span>信誉</span>
            <span style={{ color: '#FBBF24' }}>{ship.reputation}/100</span>
          </div>
          <div style={progressBarBgStyle}>
            <div style={{
              ...progressBarFillStyle,
              width: `${ship.reputation}%`,
              background: '#FBBF24',
            }} />
          </div>
        </div>

        <div style={progressContainerStyle}>
          <div style={progressLabelStyle}>
            <span>货舱</span>
            <span style={{ color: '#60A5FA' }}>{cargoUsed}/{ship.cargoCapacity}</span>
          </div>
          <div style={progressBarBgStyle}>
            <div style={{
              ...progressBarFillStyle,
              width: `${(cargoUsed / ship.cargoCapacity) * 100}%`,
              background: '#60A5FA',
            }} />
          </div>
        </div>

        <div style={{ marginTop: '12px', color: '#C5C6C7', fontSize: '11px', fontFamily: 'monospace' }}>
          回合: {turn}
        </div>

        <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '12px' }}>
          <div style={panelTitleStyle}>飞船升级</div>
          <button
            onClick={doUpgradeCargo}
            disabled={!canUpgrade || ship.credits < 500}
            style={canUpgrade && ship.credits >= 500 ? upgradeBtnStyle : disabledBtnStyle}
          >
            货舱扩容 (+5格) - 500¢
          </button>
          <button
            onClick={doUpgradeFuelTank}
            disabled={!canUpgrade || ship.credits < 300}
            style={canUpgrade && ship.credits >= 300 ? upgradeBtnStyle : disabledBtnStyle}
          >
            燃料舱升级 (+20) - 300¢
          </button>
          {!canUpgrade && (
            <div style={{ color: '#888', fontSize: '10px', fontFamily: 'monospace', marginTop: '4px' }}>
              需资金≥1000且信誉&gt;60
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '12px' }}>
          <div style={panelTitleStyle}>货舱物品</div>
          {ship.cargo.length === 0 && (
            <div style={{ color: '#666', fontSize: '11px', fontFamily: 'monospace' }}>空</div>
          )}
          {ship.cargo.map(item => (
            <div key={item.commodityId} style={cargoItemStyle}>
              <span style={{ color: '#C5C6C7' }}>{item.name}</span>
              <span style={{ color: '#66FCF1' }}>x{item.quantity}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '12px' }}>
          <div style={panelTitleStyle}>存档</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveGame} style={saveBtnStyle}>存档</button>
            <button onClick={loadGame} style={saveBtnStyle}>读档</button>
          </div>
          {lastSaveTime && (
            <div style={{ color: '#888', fontSize: '10px', fontFamily: 'monospace', marginTop: '4px' }}>
              最近存档: {new Date(lastSaveTime).toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      </div>

      <div style={centerPanelStyle}>
        <div style={topBarStyle}>
          <span style={{ color: '#66FCF1', fontFamily: 'monospace', fontSize: '14px' }}>
            ¢ {ship.credits}
          </span>
          <span style={{ color: '#4ADE80', fontFamily: 'monospace', fontSize: '14px' }}>
            ⛽ {ship.fuel}/{ship.maxFuel}
          </span>
          <span style={{ color: '#FBBF24', fontFamily: 'monospace', fontSize: '14px' }}>
            ★ {ship.reputation}
          </span>
          <span style={{ color: '#888', fontFamily: 'monospace', fontSize: '14px' }}>
            回合 {turn}
          </span>
        </div>

        <GameScene />

        {currentPlanet && (
          <div style={shopPanelStyle}>
            <div style={shopTitleStyle}>
              {currentPlanet.name} - 星球商店
              {currentPlanet.refusesTrade && (
                <span style={{ color: '#FF4444', marginLeft: '12px', fontSize: '12px' }}>
                  [此星球拒绝与您交易]
                </span>
              )}
            </div>
            <div style={commodityListStyle}>
              {currentPlanet.commodities.map(commodity => (
                <div
                  key={commodity.id}
                  onClick={() => selectCommodity(commodity)}
                  style={{
                    ...commodityRowStyle,
                    background: selectedCommodity?.id === commodity.id
                      ? '#1A3A3A'
                      : 'transparent',
                    borderLeft: selectedCommodity?.id === commodity.id
                      ? '3px solid #66FCF1'
                      : '3px solid transparent',
                  }}
                >
                  <span style={{ color: '#C5C6C7', flex: 1 }}>{commodity.name}</span>
                  <span style={{ color: '#66FCF1', fontFamily: 'monospace', minWidth: '70px', textAlign: 'right' }}>
                    {commodity.currentPrice}¢
                  </span>
                  <span style={{
                    color: commodity.currentPrice > commodity.basePrice ? '#FF6B6B' : '#4ADE80',
                    fontSize: '10px',
                    marginLeft: '8px',
                    minWidth: '40px',
                  }}>
                    {commodity.currentPrice > commodity.basePrice ? '↑' : '↓'}
                    {Math.abs(Math.round(((commodity.currentPrice - commodity.basePrice) / commodity.basePrice) * 100))}%
                  </span>
                </div>
              ))}
            </div>

            {selectedCommodity && (
              <div style={tradePanelStyle}>
                <div style={{ color: '#C5C6C7', fontFamily: 'monospace', fontSize: '12px', marginBottom: '8px' }}>
                  交易: {selectedCommodity.name} @ {selectedCommodity.currentPrice}¢
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#888', fontFamily: 'monospace', fontSize: '12px' }}>数量:</span>
                  <input
                    type="number"
                    min={1}
                    max={cargoFree}
                    value={tradeQuantity}
                    onChange={e => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={inputStyle}
                    disabled={currentPlanet.refusesTrade}
                  />
                  <button
                    onClick={executeBuy}
                    disabled={currentPlanet.refusesTrade || ship.credits < selectedCommodity.currentPrice * tradeQuantity || cargoFree < tradeQuantity}
                    style={
                      !currentPlanet.refusesTrade && ship.credits >= selectedCommodity.currentPrice * tradeQuantity && cargoFree >= tradeQuantity
                        ? buyBtnStyle
                        : disabledBtnStyle
                    }
                  >
                    购买
                  </button>
                  <button
                    onClick={executeSell}
                    disabled={currentPlanet.refusesTrade || !ship.cargo.find(c => c.commodityId === selectedCommodity.id)}
                    style={
                      !currentPlanet.refusesTrade && !!ship.cargo.find(c => c.commodityId === selectedCommodity.id)
                        ? sellBtnStyle
                        : disabledBtnStyle
                    }
                  >
                    出售
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={eventLogAreaStyle}>
          {eventLogs.map(log => (
            <div
              key={log.id}
              style={{
                ...eventLogItemStyle,
                background: log.isPositive ? '#2D4A2D' : '#4A2D2D',
                animation: 'slideIn 0.3s ease-out',
              }}
            >
              <span style={{
                color: log.isPositive ? '#4ADE80' : '#FF6B6B',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}>
                {log.isPositive ? '✓' : '✗'} {log.message}
              </span>
            </div>
          ))}
          {eventLogs.length === 0 && (
            <div style={{ color: '#555', fontFamily: 'monospace', fontSize: '12px', padding: '8px' }}>
              暂无事件日志
            </div>
          )}
        </div>
      </div>

      {activeEvent && (
        <div style={eventOverlayStyle}>
          <div style={eventPopupStyle}>
            <div style={{
              color: activeEvent.type === 'pirate' || activeEvent.type === 'fuel' ? '#FF6B6B' : '#66FCF1',
              fontFamily: 'monospace',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
            }}>
              ⚡ {activeEvent.name}
            </div>
            <div style={{
              color: '#C5C6C7',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              marginBottom: '16px',
            }}>
              {activeEvent.description}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {activeEvent.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEventChoice(idx)}
                  style={option.isPositive ? positiveEventBtnStyle : negativeEventBtnStyle}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  height: '100%',
  background: '#0B0C10',
  fontFamily: 'monospace',
  position: 'relative',
  overflow: 'hidden',
};

const leftPanelStyle: React.CSSProperties = {
  width: '280px',
  minWidth: '280px',
  background: '#1F2833',
  padding: '16px',
  overflowY: 'auto',
  borderRight: '1px solid #333',
  display: 'flex',
  flexDirection: 'column',
};

const centerPanelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  padding: '8px 16px',
  background: '#1F2833',
  borderBottom: '1px solid #333',
  alignItems: 'center',
};

const panelTitleStyle: React.CSSProperties = {
  color: '#66FCF1',
  fontSize: '13px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const StatusRow: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
  }}>
    <span style={{ color: '#888' }}>{label}</span>
    <span style={{ color }}>{value}</span>
  </div>
);

const progressContainerStyle: React.CSSProperties = {
  marginBottom: '8px',
};

const progressLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#888',
  marginBottom: '3px',
};

const progressBarBgStyle: React.CSSProperties = {
  width: '100%',
  height: '14px',
  background: '#0B0C10',
  borderRadius: '7px',
  overflow: 'hidden',
};

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '7px',
  transition: 'width 0.2s ease-out',
};

const shopPanelStyle: React.CSSProperties = {
  background: '#1F2833',
  borderRadius: '8px',
  padding: '12px',
  marginTop: '8px',
  border: '1px solid #333',
  maxHeight: '200px',
  overflowY: 'auto',
};

const shopTitleStyle: React.CSSProperties = {
  color: '#66FCF1',
  fontFamily: 'monospace',
  fontSize: '13px',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const commodityListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const commodityRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background 0.15s',
  fontSize: '12px',
  fontFamily: 'monospace',
};

const tradePanelStyle: React.CSSProperties = {
  marginTop: '10px',
  paddingTop: '10px',
  borderTop: '1px solid #333',
};

const inputStyle: React.CSSProperties = {
  width: '60px',
  background: '#0B0C10',
  border: '1px solid #45A29E',
  color: '#C5C6C7',
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '4px 8px',
  borderRadius: '4px',
  textAlign: 'center',
  outline: 'none',
};

const buyBtnStyle: React.CSSProperties = {
  background: '#45A29E',
  color: '#0B0C10',
  border: 'none',
  fontFamily: 'monospace',
  fontSize: '12px',
  fontWeight: 'bold',
  padding: '6px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const sellBtnStyle: React.CSSProperties = {
  background: '#2D4A2D',
  color: '#4ADE80',
  border: '1px solid #4ADE80',
  fontFamily: 'monospace',
  fontSize: '12px',
  fontWeight: 'bold',
  padding: '6px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const disabledBtnStyle: React.CSSProperties = {
  background: '#1A1A2E',
  color: '#555',
  border: '1px solid #333',
  fontFamily: 'monospace',
  fontSize: '11px',
  padding: '6px 12px',
  borderRadius: '4px',
  cursor: 'not-allowed',
  opacity: 0.5,
};

const upgradeBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: '#1F2833',
  color: '#66FCF1',
  border: '1px solid #45A29E',
  fontFamily: 'monospace',
  fontSize: '11px',
  padding: '6px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginBottom: '6px',
  transition: 'all 0.15s',
};

const saveBtnStyle: React.CSSProperties = {
  background: '#1F2833',
  color: '#C5C6C7',
  border: '1px solid #45A29E',
  fontFamily: 'monospace',
  fontSize: '11px',
  padding: '6px 14px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const eventLogAreaStyle: React.CSSProperties = {
  height: '100px',
  minHeight: '100px',
  background: '#0E1117',
  borderTop: '1px solid #333',
  overflowY: 'auto',
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const eventLogItemStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '6px',
  flexShrink: 0,
};

const eventOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

const eventPopupStyle: React.CSSProperties = {
  width: '320px',
  minHeight: '200px',
  background: '#451A1A',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #FF6B6B33',
  boxShadow: '0 0 30px rgba(255,107,107,0.2)',
};

const positiveEventBtnStyle: React.CSSProperties = {
  background: '#2D4A2D',
  color: '#4ADE80',
  border: '1px solid #4ADE80',
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const negativeEventBtnStyle: React.CSSProperties = {
  background: '#4A2D2D',
  color: '#FF6B6B',
  border: '1px solid #FF6B6B',
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const cargoItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '11px',
  fontFamily: 'monospace',
  padding: '2px 0',
};
