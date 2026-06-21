import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BlockData, BlockType, PlayerData } from './types';
import { SocketManager } from './SocketManager';
import { WorldRenderer } from './WorldRenderer';
import { Toolbar } from './components/Toolbar';
import { PlayerInfo } from './components/PlayerInfo';
import { OnlineList } from './components/OnlineList';

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockType>(BlockType.WOOD);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [currentNickname, setCurrentNickname] = useState<string>('');
  const [currentAvatarColor, setCurrentAvatarColor] = useState<string>('#888888');
  const [isConnected, setIsConnected] = useState(false);
  const socketManagerRef = useRef<SocketManager | null>(null);
  const blocksRef = useRef<Map<string, BlockData>>(new Map());

  useEffect(() => {
    const handleWorldData = (data: {
      blocks: BlockData[];
      players: PlayerData[];
      yourPlayerId: string;
      yourNickname: string;
      yourAvatarColor: string;
    }) => {
      console.log('🌍 收到世界数据，方块数量:', data.blocks.length);
      setBlocks(data.blocks);
      setPlayers(data.players);
      setCurrentPlayerId(data.yourPlayerId);
      setCurrentNickname(data.yourNickname);
      setCurrentAvatarColor(data.yourAvatarColor);
      setIsConnected(true);

      const map = new Map<string, BlockData>();
      data.blocks.forEach(b => map.set(`${b.x},${b.y},${b.z}`, b));
      blocksRef.current = map;
    };

    const handleBlockUpdate = (data: {
      x: number;
      y: number;
      z: number;
      blockType: BlockType | null;
      playerId: string;
      color?: string;
    }) => {
      const key = `${data.x},${data.y},${data.z}`;
      
      if (data.blockType !== null) {
        const newBlock: BlockData = {
          x: data.x,
          y: data.y,
          z: data.z,
          type: data.blockType,
          color: data.color
        };
        blocksRef.current.set(key, newBlock);
        setBlocks(prev => [...prev.filter(b => `${b.x},${b.y},${b.z}` !== key), newBlock]);
      } else {
        blocksRef.current.delete(key);
        setBlocks(prev => prev.filter(b => `${b.x},${b.y},${b.z}` !== key));
      }
    };

    const handlePlayerJoin = (data: { player: PlayerData }) => {
      setPlayers(prev => [...prev.filter(p => p.id !== data.player.id), data.player]);
    };

    const handlePlayerLeave = (data: { playerId: string }) => {
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    };

    const handlePlayerList = (data: { players: PlayerData[] }) => {
      setPlayers(data.players);
    };

    const handlePlayerMove = (data: { playerId: string; position: { x: number; y: number; z: number } }) => {
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId ? { ...p, position: data.position } : p
      ));
    };

    socketManagerRef.current = new SocketManager({
      onWorldData: handleWorldData,
      onBlockUpdate: handleBlockUpdate,
      onPlayerJoin: handlePlayerJoin,
      onPlayerLeave: handlePlayerLeave,
      onPlayerList: handlePlayerList,
      onPlayerMove: handlePlayerMove
    });

    socketManagerRef.current.connect();

    return () => {
      if (socketManagerRef.current) {
        socketManagerRef.current.disconnect();
      }
    };
  }, []);

  const handlePlaceBlock = useCallback((x: number, y: number, z: number) => {
    if (socketManagerRef.current && currentPlayerId) {
      socketManagerRef.current.placeBlock(x, y, z, selectedBlock, currentPlayerId);
    }
  }, [selectedBlock, currentPlayerId]);

  const handleRemoveBlock = useCallback((x: number, y: number, z: number) => {
    if (socketManagerRef.current && currentPlayerId) {
      socketManagerRef.current.removeBlock(x, y, z, currentPlayerId);
    }
  }, [currentPlayerId]);

  const handleSelectBlock = useCallback((type: BlockType) => {
    setSelectedBlock(type);
  }, []);

  if (!isConnected) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        color: '#E0E0E0',
        fontSize: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏗️</div>
          <div>正在连接积木小镇...</div>
          <div style={{ fontSize: '14px', color: 'rgba(224, 224, 224, 0.5)', marginTop: '8px' }}>
            请确保服务器已启动 (端口 3001)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <WorldRenderer
        blocks={blocks}
        selectedBlockType={selectedBlock}
        onPlaceBlock={handlePlaceBlock}
        onRemoveBlock={handleRemoveBlock}
      />
      
      <PlayerInfo
        nickname={currentNickname}
        onlineCount={players.length}
      />
      
      <OnlineList
        players={players}
        currentPlayerId={currentPlayerId}
      />
      
      <Toolbar
        selectedBlock={selectedBlock}
        onSelectBlock={handleSelectBlock}
      />

      <div style={{
        position: 'fixed',
        bottom: '110px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '12px',
        color: 'rgba(224, 224, 224, 0.5)',
        textAlign: 'center',
        zIndex: 100
      }}>
        <div>左键放置方块 | 右键拆除方块 | 拖拽旋转视角 | 滚轮缩放 | 中键平移</div>
      </div>
    </div>
  );
};

export default App;
