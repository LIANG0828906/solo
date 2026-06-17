import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store';
import type { ShipType } from '../types';

const SHIP_NAMES: Record<ShipType, string> = {
  cruiser: '巡洋舰',
  frigate: '护卫舰',
  mothership: '母舰',
};

const NODE_TYPE_NAMES: Record<string, string> = {
  normal: '普通节点',
  resource: '资源点',
  mothership_player: '玩家基地',
  mothership_ai: '敌方母舰',
};

interface InfoPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ isOpen = true, onClose }) => {
  const nodes = useGameStore((state) => state.nodes);
  const fleets = useGameStore((state) => state.fleets);
  const selectedNodeId = useGameStore((state) => state.selectedNodeId);
  const selectedFleetId = useGameStore((state) => state.selectedFleetId);
  const turn = useGameStore((state) => state.turn);
  const currentPhase = useGameStore((state) => state.currentPhase);
  const combatLogs = useGameStore((state) => state.combatLogs);
  const winner = useGameStore((state) => state.winner);
  const endPlayerTurn = useGameStore((state) => state.endPlayerTurn);
  const initGame = useGameStore((state) => state.initGame);

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [combatLogs]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedFleet = fleets.find((f) => f.id === selectedFleetId);

  const fleetsAtSelectedNode = selectedNode
    ? fleets.filter((f) => f.nodeId === selectedNode.id && f.ships.length > 0)
    : [];

  const playerFleetsCount = fleets.filter(
    (f) => f.owner === 'player' && f.ships.length > 0
  ).length;

  const aiFleetsCount = fleets.filter(
    (f) => f.owner === 'ai' && f.ships.length > 0
  ).length;

  return (
    <div
      className={`
        info-panel
        flex flex-col
        bg-[#1E1E2E]
        rounded-2xl
        text-[#E0E0E0]
        transition-all duration-300 ease
        ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      style={{
        width: '320px',
        height: '100%',
        padding: '20px',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#4ECDC4] mb-2">星海棋局</h2>
        <div className="flex justify-between items-center text-sm">
          <span>第 {turn} 回合</span>
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${
              currentPhase === 'player'
                ? 'bg-[#6BCB77]/20 text-[#6BCB77]'
                : currentPhase === 'ai'
                ? 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {currentPhase === 'player'
              ? '玩家回合'
              : currentPhase === 'ai'
              ? 'AI回合'
              : '游戏结束'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="bg-[#2A2A44] rounded-lg p-2 text-center">
          <div className="text-[#6BCB77] font-bold text-lg">{playerFleetsCount}</div>
          <div className="text-gray-400">我方舰队</div>
        </div>
        <div className="bg-[#2A2A44] rounded-lg p-2 text-center">
          <div className="text-[#FF6B6B] font-bold text-lg">{aiFleetsCount}</div>
          <div className="text-gray-400">敌方舰队</div>
        </div>
      </div>

      {selectedNode && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#FFD700] mb-2">节点信息</h3>
          <div className="bg-[#2A2A44] rounded-lg p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">类型</span>
              <span>{NODE_TYPE_NAMES[selectedNode.type] || '普通节点'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">连接数</span>
              <span>{selectedNode.connections.length}</span>
            </div>

            {fleetsAtSelectedNode.length > 0 && (
              <div className="border-t border-[#3A3A5A] pt-2 mt-2">
                <div className="text-gray-400 mb-2">驻扎舰队</div>
                {fleetsAtSelectedNode.map((fleet) => (
                  <div
                    key={fleet.id}
                    className={`
                      mb-2 p-2 rounded
                      ${selectedFleetId === fleet.id ? 'bg-[#FFD700]/10 border border-[#FFD700]/50' : 'bg-[#1E1E2E]'}
                    `}
                  >
                    <div
                      className={`text-xs font-bold mb-1 ${
                        fleet.owner === 'player' ? 'text-[#6BCB77]' : 'text-[#FF6B6B]'
                      }`}
                    >
                      {fleet.owner === 'player' ? '我方' : '敌方'}舰队
                    </div>
                    {fleet.ships.map((ship) => (
                      <div key={ship.id} className="text-xs flex justify-between">
                        <span>{SHIP_NAMES[ship.type]}</span>
                        <span className="text-gray-400">
                          HP:{ship.hp}/{ship.maxHp} 攻:{ship.attack}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedNode && (
        <div className="mb-4 text-center text-gray-500 text-sm py-4">
          点击节点查看详情
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 mb-4">
        <h3 className="text-sm font-bold text-[#4ECDC4] mb-2">战斗日志</h3>
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto rounded-lg text-xs space-y-1"
          style={{ minHeight: '150px' }}
        >
          {combatLogs.map((log, index) => (
            <div
              key={index}
              className={`
                px-2 py-1 rounded
                ${index % 2 === 0 ? 'bg-[#2A2A44]' : 'bg-[#1E1E2E]'}
                ${log.startsWith('---') ? 'text-[#FFD700] font-bold text-center' : ''}
                ${log.includes('胜利') ? 'text-[#6BCB77] font-bold text-center' : ''}
                ${log.includes('失败') ? 'text-[#FF6B6B] font-bold text-center' : ''}
              `}
            >
              {log}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {currentPhase === 'player' && !winner && (
          <button
            onClick={endPlayerTurn}
            className="
              w-full py-3 rounded-lg
              bg-[#6BCB77] text-white font-bold
              hover:scale-105 hover:shadow-lg hover:shadow-[#6BCB77]/30
              active:scale-95
              transition-all duration-150 ease
            "
          >
            结束回合
          </button>
        )}
        {currentPhase === 'ai' && (
          <button
            disabled
            className="
              w-full py-3 rounded-lg
              bg-gray-600 text-gray-300 font-bold
              cursor-not-allowed
            "
          >
            AI思考中...
          </button>
        )}
        <button
          onClick={initGame}
          className="
            w-full py-2 rounded-lg
            bg-[#2D2D44] text-[#4ECDC4]
            border border-[#4ECDC4]/30
            hover:bg-[#3D3D54] hover:scale-105
            active:scale-95
            transition-all duration-150 ease
            text-sm
          "
        >
          重新开始
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;
