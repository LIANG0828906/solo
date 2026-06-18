import React, { useCallback, useRef, useState } from 'react';
import { useGameStore, createDefaultCommand } from '../store/gameStore';
import {
  CommandType,
  COMMAND_COLORS,
  COMMAND_LABELS,
  COMMAND_GROUPS,
  DEFAULT_LEVEL,
} from '../game/levelConfig';
import type { Command } from '../game/levelConfig';

const CommandBlock: React.FC<{
  cmd: Command;
  isActive: boolean;
  inTrack: boolean;
  onRemove?: () => void;
  index?: number;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}> = ({ cmd, isActive, inTrack, onRemove, index, onDragStart, onDragOver, onDrop }) => {
  const color = COMMAND_COLORS[cmd.type];
  const label = COMMAND_LABELS[cmd.type];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('commandType', cmd.type);
    e.dataTransfer.setData('commandId', cmd.id);
    e.dataTransfer.effectAllowed = inTrack ? 'move' : 'copy';
    if (inTrack && index !== undefined && onDragStart) {
      onDragStart(e, index);
    }
  };

  return (
    <div
      draggable={!inTrack || !onRemove}
      onDragStart={handleDragStart}
      onDragOver={index !== undefined && onDragOver ? (e) => onDragOver(e, index) : undefined}
      onDrop={index !== undefined && onDrop ? (e) => onDrop(e, index) : undefined}
      style={{
        width: 90,
        height: 40,
        borderRadius: 8,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        cursor: 'grab',
        userSelect: 'none',
        boxShadow: isActive
          ? `0 0 8px #FFD700, 0 0 16px #FFD700`
          : '0 2px 4px rgba(0,0,0,0.3)',
        border: isActive ? '2px solid #FFD700' : 'none',
        position: 'relative',
        transition: inTrack ? 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s' : 'none',
        animation: inTrack ? 'springIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
      }}
    >
      {label}
      {inTrack && onRemove && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#F44336',
            color: '#fff',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            lineHeight: '16px',
          }}
        >
          ×
        </span>
      )}
    </div>
  );
};

const ContainerBlock: React.FC<{
  cmd: Command;
  isActive: boolean;
  onRemove: () => void;
}> = ({ cmd, isActive, onRemove }) => {
  const handleChildDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChildDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('commandType') as CommandType;
    if (!type) return;

    if ((cmd.children?.length || 0) >= DEFAULT_LEVEL.maxFunctionChildren) return;

    const newChild = createDefaultCommand(type);
    const updated: Command = {
      ...cmd,
      children: [...(cmd.children || []), newChild],
    };
    const store = useGameStore.getState();
    if (cmd.type === CommandType.FunctionDef) {
      useGameStore.setState({ functionDef: updated });
    } else {
      const newCommands = store.commands.map((c) => (c.id === cmd.id ? updated : c));
      useGameStore.setState({ commands: newCommands });
    }
  };

  const removeChild = (childId: string) => {
    const store = useGameStore.getState();
    if (cmd.type === CommandType.FunctionDef) {
      const updated = { ...cmd, children: cmd.children?.filter((ch) => ch.id !== childId) };
      useGameStore.setState({ functionDef: updated });
    } else {
      const newCommands = store.commands.map((c) => {
        if (c.id === cmd.id) {
          return { ...c, children: c.children?.filter((ch) => ch.id !== childId) };
        }
        return c;
      });
      useGameStore.setState({ commands: newCommands });
    }
  };

  const title = cmd.type === CommandType.Loop ? `循环 ×${cmd.loopCount || 3}` : '我的函数';

  return (
    <div
      style={{
        border: `2px solid ${isActive ? '#FFD700' : COMMAND_COLORS[cmd.type]}`,
        borderRadius: 8,
        padding: 6,
        backgroundColor: `${COMMAND_COLORS[cmd.type]}33`,
        boxShadow: isActive ? '0 0 8px #FFD700, 0 0 16px #FFD700' : '0 2px 4px rgba(0,0,0,0.3)',
        position: 'relative',
        width: 130,
      }}
    >
      <div style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 4, fontFamily: 'sans-serif' }}>
        {title}
      </div>
      <div
        onDragOver={handleChildDragOver}
        onDrop={handleChildDrop}
        style={{
          minHeight: 36,
          border: '1px dashed #FFFFFF40',
          borderRadius: 4,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {cmd.children?.map((child) => (
          <CommandBlock
            key={child.id}
            cmd={child}
            isActive={false}
            inTrack={true}
            onRemove={() => removeChild(child.id)}
          />
        ))}
        <div style={{ color: '#FFFFFF60', fontSize: 12, fontFamily: 'sans-serif' }}>拖入子指令</div>
      </div>
      <span
        onClick={onRemove}
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: '#F44336',
          color: '#fff',
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          lineHeight: '16px',
        }}
      >
        ×
      </span>
    </div>
  );
};

export const CommandPool: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const isRunning = useGameStore((s) => s.isRunning);

  const handleDragStart = (e: React.DragEvent, type: CommandType) => {
    e.dataTransfer.setData('commandType', type);
    e.dataTransfer.setData('source', 'pool');
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="panel-sidebar"
      style={{
        width: collapsed ? 60 : 280,
        minWidth: collapsed ? 60 : 280,
        backgroundColor: '#1A1A2E',
        padding: collapsed ? 8 : 16,
        paddingTop: 50,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'width 0.3s, min-width 0.3s, padding 0.3s',
        height: '100%',
      }}
    >
      {!collapsed &&
        COMMAND_GROUPS.map((group) => (
          <div key={group.title}>
            <div
              style={{
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 'bold',
                marginBottom: 8,
                fontFamily: 'sans-serif',
              }}
            >
              {group.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {group.types.map((type) => (
                <div
                  key={type}
                  draggable={!isRunning}
                  onDragStart={(e) => handleDragStart(e, type)}
                  style={{ opacity: isRunning ? 0.5 : 1 }}
                >
                  <CommandBlock cmd={createDefaultCommand(type)} isActive={false} inTrack={false} />
                </div>
              ))}
            </div>
          </div>
        ))}

      {collapsed &&
        COMMAND_GROUPS.map((group) => (
          <div
            key={group.title}
            draggable={!isRunning}
            onDragStart={(e) => handleDragStart(e, group.types[0])}
            style={{ opacity: isRunning ? 0.5 : 1 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: COMMAND_COLORS[group.types[0]],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 11,
                fontWeight: 'bold',
                cursor: 'grab',
              }}
            >
              {COMMAND_LABELS[group.types[0]].slice(0, 2)}
            </div>
          </div>
        ))}
    </div>
  );
};

export const TrackEditor: React.FC = () => {
  const commands = useGameStore((s) => s.commands);
  const isRunning = useGameStore((s) => s.isRunning);
  const activeCommandId = useGameStore((s) => s.activeCommandId);
  const addCommand = useGameStore((s) => s.addCommand);
  const removeCommand = useGameStore((s) => s.removeCommand);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  const handleTrackDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleTrackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('commandType') as CommandType;
    const source = e.dataTransfer.getData('source');

    if (!type) return;

    if (source === 'track') {
      const fi = parseInt(e.dataTransfer.getData('fromIndex'), 10);
      if (!isNaN(fi) && dragOverIndex !== null) {
        useGameStore.getState().moveCommand(fi, dragOverIndex);
      }
    } else {
      const cmd = createDefaultCommand(type);
      addCommand(cmd);
    }
    setDragOverIndex(null);
    setDragFromIndex(null);
  };

  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('source', 'track');
    e.dataTransfer.setData('fromIndex', String(index));
    e.dataTransfer.setData('commandType', commands[index].type);
    setDragFromIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleItemDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('commandType') as CommandType;
    const source = e.dataTransfer.getData('source');

    if (source === 'track') {
      const fi = parseInt(e.dataTransfer.getData('fromIndex'), 10);
      if (!isNaN(fi)) {
        useGameStore.getState().moveCommand(fi, index);
      }
    } else if (type) {
      const cmd = createDefaultCommand(type);
      const newCmds = [...commands];
      newCmds.splice(index, 0, cmd);
      useGameStore.setState({ commands: newCmds });
    }
    setDragOverIndex(null);
    setDragFromIndex(null);
  };

  return (
    <div
      onDragOver={handleTrackDragOver}
      onDrop={handleTrackDrop}
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '8px 20px 20px',
      }}
    >
      <div
        style={{
          width: 140,
          minHeight: '100%',
          borderLeft: '2px dashed #FFFFFF40',
          borderRight: '2px dashed #FFFFFF40',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '8px 4px',
          position: 'relative',
        }}
      >
        {commands.length === 0 && (
          <div style={{ color: '#FFFFFF40', fontSize: 14, fontFamily: 'sans-serif', marginTop: 40 }}>
            拖拽指令到这里
          </div>
        )}
        {commands.map((cmd, i) => (
          <React.Fragment key={cmd.id}>
            {dragOverIndex === i && dragFromIndex !== i && (
              <div
                style={{
                  width: 90,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#FFD70040',
                  border: '2px dashed #FFD700',
                  marginBottom: 2,
                }}
              />
            )}
            {cmd.type === CommandType.Loop || cmd.type === CommandType.FunctionDef ? (
              <ContainerBlock
                cmd={cmd}
                isActive={activeCommandId === cmd.id}
                onRemove={() => removeCommand(cmd.id)}
              />
            ) : (
              <div
                draggable={!isRunning}
                onDragStart={(e) => handleItemDragStart(e, i)}
              >
                <CommandBlock
                  cmd={cmd}
                  isActive={activeCommandId === cmd.id}
                  inTrack={true}
                  onRemove={() => removeCommand(cmd.id)}
                  index={i}
                  onDragStart={handleItemDragStart}
                  onDragOver={handleItemDragOver}
                  onDrop={handleItemDrop}
                />
              </div>
            )}
          </React.Fragment>
        ))}
        {dragOverIndex !== null && dragOverIndex >= commands.length && (
          <div
            style={{
              width: 90,
              height: 40,
              borderRadius: 8,
              backgroundColor: '#FFD70040',
              border: '2px dashed #FFD700',
            }}
          />
        )}
      </div>
    </div>
  );
};

export const CommandPanel: React.FC = () => {
  const commands = useGameStore((s) => s.commands);
  const isRunning = useGameStore((s) => s.isRunning);
  const showRecursionError = useGameStore((s) => s.showRecursionError);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const reset = useGameStore((s) => s.reset);
  const setShowRecursionError = useGameStore((s) => s.setShowRecursionError);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}
    >
      <style>{`
        @keyframes springIn {
          0% { transform: scale(0.8); }
          100% { transform: scale(1.0); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #aaa; border-radius: 3px; }
        @media (max-width: 767px) {
          .panel-sidebar { flex-direction: row !important; width: 100% !important; height: auto !important; overflow-x: auto !important; overflow-y: hidden !important; }
        }
      `}</style>

      <CommandPool collapsed={collapsed} />

      <div
        style={{
          flex: 1,
          background: 'linear-gradient(180deg, #16213E 0%, #0F3460 100%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: 16,
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: '#1A1A2E',
              color: '#fff',
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {collapsed ? '→' : '←'}
          </button>
          <button
            disabled={isRunning}
            onClick={() => {
              const event = new CustomEvent('game-run');
              window.dispatchEvent(event);
            }}
            style={{
              width: 120,
              height: 50,
              borderRadius: 10,
              backgroundColor: '#4CAF50',
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              border: 'none',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.6 : 1,
              fontFamily: 'sans-serif',
            }}
          >
            ▶ 运行
          </button>
          <button
            onClick={() => {
              reset();
              const event = new CustomEvent('game-reset');
              window.dispatchEvent(event);
            }}
            style={{
              width: 120,
              height: 50,
              borderRadius: 10,
              backgroundColor: '#F44336',
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'sans-serif',
            }}
          >
            ↺ 重置
          </button>
          <div style={{ color: '#FFFFFF80', fontSize: 14, fontFamily: 'sans-serif', marginLeft: 12 }}>
            指令: {commands.length}/30
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div
            id="phaser-container"
            style={{
              width: 420,
              height: 420,
              borderRadius: 12,
              overflow: 'hidden',
              margin: 16,
              flexShrink: 0,
            }}
          />
          <TrackEditor />
        </div>

        {showRecursionError && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#1A1A2E',
              border: '2px solid #F44336',
              borderRadius: 12,
              padding: '24px 32px',
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ marginBottom: 12 }}>{errorMessage || '递归太深啦！'}</div>
            <button
              onClick={() => setShowRecursionError(false)}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                backgroundColor: '#F44336',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'sans-serif',
              }}
            >
              知道了
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
