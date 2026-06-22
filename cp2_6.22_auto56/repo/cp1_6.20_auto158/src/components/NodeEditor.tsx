import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LevelGenerator, RuleConfig, StartNodeConfig, DistributionNodeConfig, RewardNodeConfig } from '../core/LevelGenerator';
import { PathFinder, LevelData, PathResult } from '../core/PathFinder';

export interface Preset {
  id: string;
  name: string;
  config: RuleConfig;
  thumbnail: string;
}

export interface ValidationResult {
  results: { jumpPower: number; success: boolean; steps: number; coinsCollected: number; successRate: number }[];
  overallSuccessRate: number;
  avgSteps: number;
}

interface NodeEditorProps {
  ruleConfig: RuleConfig;
  onGenerate: (config: RuleConfig) => void;
  onValidate: (config: RuleConfig) => void;
  onLevelGenerated: (level: LevelData, result: PathResult) => void;
  presets: Preset[];
  onSavePreset: (preset: Preset) => void;
  onDeletePreset: (id: string) => void;
  onReorderPresets: (from: number, to: number) => void;
  isValidating: boolean;
  validationResult: ValidationResult | null;
}

interface NodeData {
  id: string;
  type: 'start' | 'distribution' | 'reward';
  x: number;
  y: number;
  config: StartNodeConfig | DistributionNodeConfig | RewardNodeConfig;
}

interface Connection {
  id: string;
  fromNode: string;
  fromPort: 'output';
  toNode: string;
  toPort: 'input';
}

const NODE_COLORS = {
  start: '#2ecc71',
  distribution: '#3498db',
  reward: '#f1c40f',
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = { start: 140, distribution: 180, reward: 140 };
const PORT_RADIUS = 8;

const NodeEditor: React.FC<NodeEditorProps> = ({
  ruleConfig,
  onGenerate,
  onValidate,
  onLevelGenerated,
  presets,
  onSavePreset,
  onDeletePreset,
  onReorderPresets,
  isValidating,
  validationResult,
}) => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{ fromNode: string; fromPort: 'output'; startX: number; startY: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [presetName, setPresetName] = useState('');
  const [draggedPreset, setDraggedPreset] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialNodes: NodeData[] = [
      {
        id: 'start-1',
        type: 'start',
        x: 50,
        y: 50,
        config: ruleConfig.startNode || { type: 'start', startX: 50, startY: 400, jumpPower: 12 },
      },
      {
        id: 'distribution-1',
        type: 'distribution',
        x: 300,
        y: 50,
        config: ruleConfig.distributionNode || { type: 'distribution', minGap: 80, maxGap: 200, minHeightChange: -50, maxHeightChange: 50, enemyProbability: 30 },
      },
      {
        id: 'reward-1',
        type: 'reward',
        x: 550,
        y: 50,
        config: ruleConfig.rewardNode || { type: 'reward', coinCount: 10, placementMode: 'uniform' },
      },
    ];
    setNodes(initialNodes);
    setConnections([
      { id: 'conn-1', fromNode: 'start-1', fromPort: 'output', toNode: 'distribution-1', toPort: 'input' },
      { id: 'conn-2', fromNode: 'distribution-1', fromPort: 'output', toNode: 'reward-1', toPort: 'input' },
    ]);
  }, []);

  useEffect(() => {
    const startNode = nodes.find(n => n.type === 'start')?.config as StartNodeConfig | undefined;
    const distNode = nodes.find(n => n.type === 'distribution')?.config as DistributionNodeConfig | undefined;
    const rewardNode = nodes.find(n => n.type === 'reward')?.config as RewardNodeConfig | undefined;
    
    const newConfig: RuleConfig = {
      startNode,
      distributionNode: distNode,
      rewardNode,
    };
    
    if (JSON.stringify(newConfig) !== JSON.stringify(ruleConfig)) {
      onGenerate(newConfig);
    }
  }, [nodes]);

  const getPortPosition = useCallback((nodeId: string, portType: 'input' | 'output') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    const height = NODE_HEIGHT[node.type];
    return {
      x: portType === 'input' ? node.x : node.x + NODE_WIDTH,
      y: node.y + height / 2,
    };
  }, [nodes]);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (draggingNode) {
      setNodes(prev => prev.map(node => {
        if (node.id === draggingNode) {
          return {
            ...node,
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
          };
        }
        return node;
      }));
    }
  }, [draggingNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
    setConnecting(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleOutputPortMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const pos = getPortPosition(nodeId, 'output');
    setConnecting({
      fromNode: nodeId,
      fromPort: 'output',
      startX: pos.x,
      startY: pos.y,
    });
  };

  const handleInputPortMouseUp = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connecting && connecting.fromNode !== nodeId) {
      const newConn: Connection = {
        id: `conn-${Date.now()}`,
        fromNode: connecting.fromNode,
        fromPort: connecting.fromPort,
        toNode: nodeId,
        toPort: 'input',
      };
      setConnections(prev => {
        const filtered = prev.filter(c => !(c.toNode === nodeId && c.toPort === 'input'));
        return [...filtered, newConn];
      });
    }
    setConnecting(null);
  };

  const updateNodeConfig = (nodeId: string, key: string, value: any) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          config: { ...node.config, [key]: value },
        };
      }
      return node;
    }));
  };

  const generateLevel = () => {
    const startNode = nodes.find(n => n.type === 'start')?.config as StartNodeConfig | undefined;
    const distNode = nodes.find(n => n.type === 'distribution')?.config as DistributionNodeConfig | undefined;
    const rewardNode = nodes.find(n => n.type === 'reward')?.config as RewardNodeConfig | undefined;
    
    const config: RuleConfig = {
      startNode,
      distributionNode: distNode,
      rewardNode,
    };
    
    const generator = new LevelGenerator(config);
    const level = generator.generate();
    
    const jumpPower = startNode?.jumpPower || 12;
    const pathFinder = new PathFinder(level, jumpPower);
    const result = pathFinder.findPath();
    
    onGenerate(config);
    onLevelGenerated(level, result);
  };

  const validateLevel = () => {
    const startNode = nodes.find(n => n.type === 'start')?.config as StartNodeConfig | undefined;
    const distNode = nodes.find(n => n.type === 'distribution')?.config as DistributionNodeConfig | undefined;
    const rewardNode = nodes.find(n => n.type === 'reward')?.config as RewardNodeConfig | undefined;
    
    const config: RuleConfig = {
      startNode,
      distributionNode: distNode,
      rewardNode,
    };
    
    onValidate(config);
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    
    const startNode = nodes.find(n => n.type === 'start')?.config as StartNodeConfig | undefined;
    const distNode = nodes.find(n => n.type === 'distribution')?.config as DistributionNodeConfig | undefined;
    const rewardNode = nodes.find(n => n.type === 'reward')?.config as RewardNodeConfig | undefined;
    
    const config: RuleConfig = {
      startNode,
      distributionNode: distNode,
      rewardNode,
    };
    
    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      config,
      thumbnail: generateThumbnail(),
    };
    
    onSavePreset(preset);
    setPresetName('');
    setShowSaveModal(false);
  };

  const generateThumbnail = (): string => {
    return JSON.stringify(nodes.map(n => ({ type: n.type, x: n.x, y: n.y })));
  };

  const loadPreset = (preset: Preset) => {
    const newNodes: NodeData[] = [];
    let xOffset = 50;
    
    if (preset.config.startNode) {
      newNodes.push({
        id: `start-${Date.now()}`,
        type: 'start',
        x: xOffset,
        y: 50,
        config: preset.config.startNode,
      });
      xOffset += 250;
    }
    
    if (preset.config.distributionNode) {
      newNodes.push({
        id: `distribution-${Date.now()}`,
        type: 'distribution',
        x: xOffset,
        y: 50,
        config: preset.config.distributionNode,
      });
      xOffset += 250;
    }
    
    if (preset.config.rewardNode) {
      newNodes.push({
        id: `reward-${Date.now()}`,
        type: 'reward',
        x: xOffset,
        y: 50,
        config: preset.config.rewardNode,
      });
    }
    
    setNodes(newNodes);
    
    const newConnections: Connection[] = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newConnections.push({
        id: `conn-${i}-${Date.now()}`,
        fromNode: newNodes[i].id,
        fromPort: 'output',
        toNode: newNodes[i + 1].id,
        toPort: 'input',
      });
    }
    setConnections(newConnections);
  };

  const handlePresetDragStart = (index: number) => {
    setDraggedPreset(index);
  };

  const handlePresetDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPreset === null || draggedPreset === index) return;
    onReorderPresets(draggedPreset, index);
    setDraggedPreset(index);
  };

  const handlePresetDragEnd = () => {
    setDraggedPreset(null);
  };

  const renderBezierCurve = (x1: number, y1: number, x2: number, y2: number, color: string) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    return (
      <path
        d={path}
        stroke={color}
        strokeWidth={3}
        fill="none"
        style={{ transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    );
  };

  const getColorForSuccessRate = (rate: number) => {
    const r = Math.round(231 + (46 - 231) * rate);
    const g = Math.round(76 + (204 - 76) * rate);
    const b = Math.round(60 + (113 - 60) * rate);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const exportConfigJSON = () => {
    const startNode = nodes.find(n => n.type === 'start')?.config as StartNodeConfig | undefined;
    const distNode = nodes.find(n => n.type === 'distribution')?.config as DistributionNodeConfig | undefined;
    const rewardNode = nodes.find(n => n.type === 'reward')?.config as RewardNodeConfig | undefined;
    
    const config: RuleConfig = {
      startNode,
      distributionNode: distNode,
      rewardNode,
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rule-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#1e1e2e',
        color: '#e0e0e0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '220px',
          minWidth: '220px',
          backgroundColor: '#282840',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          borderRight: '1px solid #3a3a5c',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e0e0e0' }}>
          预设 ({presets.length}/5)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {presets.map((preset, index) => (
            <div
              key={preset.id}
              draggable
              onDragStart={() => handlePresetDragStart(index)}
              onDragOver={(e) => handlePresetDragOver(e, index)}
              onDragEnd={handlePresetDragEnd}
              style={{
                backgroundColor: '#1e1e2e',
                borderRadius: '8px',
                padding: '10px',
                cursor: 'grab',
                position: 'relative',
                border: '1px solid #3a3a5c',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                transform: draggedPreset === index ? 'scale(1.02)' : 'scale(1)',
                boxShadow: draggedPreset === index ? '0 4px 15px rgba(0,0,0,0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                if (draggedPreset !== index) {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePreset(preset.id);
                }}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#e74c3c',
                  border: 'none',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                ×
              </button>
              
              <div
                onClick={() => loadPreset(preset)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '60px',
                    backgroundColor: '#3a3a5c',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#888',
                  }}
                >
                  缩略图
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, textAlign: 'center' }}>
                  {preset.name}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={presets.length >= 5}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: presets.length >= 5 ? '#555' : '#5865f2',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            cursor: presets.length >= 5 ? 'not-allowed' : 'pointer',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            marginTop: 'auto',
          }}
          onMouseEnter={(e) => {
            if (presets.length < 5) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            if (presets.length < 5) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            if (presets.length < 5) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }
          }}
        >
          保存预设
        </button>
      </div>

      <div
        ref={canvasRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          backgroundImage: 'radial-gradient(circle, #3a3a5c 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {connections.map(conn => {
            const fromPos = getPortPosition(conn.fromNode, 'output');
            const toPos = getPortPosition(conn.toNode, 'input');
            const fromNode = nodes.find(n => n.id === conn.fromNode);
            const color = fromNode ? NODE_COLORS[fromNode.type] : '#888';
            return renderBezierCurve(fromPos.x, fromPos.y, toPos.x, toPos.y, color);
          })}
          
          {connecting && renderBezierCurve(
            connecting.startX,
            connecting.startY,
            mousePos.x,
            mousePos.y,
            '#888'
          )}
        </svg>

        {nodes.map(node => {
          const color = NODE_COLORS[node.type];
          const height = NODE_HEIGHT[node.type];
          const config = node.config;
          
          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: NODE_WIDTH,
                backgroundColor: '#282840',
                borderRadius: '12px',
                border: `2px solid ${color}`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                cursor: 'move',
                userSelect: 'none',
                transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: draggingNode === node.id ? 10 : 1,
              }}
            >
              <div
                style={{
                  backgroundColor: color,
                  padding: '10px 14px',
                  borderRadius: '10px 10px 0 0',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }}
                />
                {node.type === 'start' && '起点节点'}
                {node.type === 'distribution' && '分布节点'}
                {node.type === 'reward' && '奖励节点'}
              </div>

              <div
                style={{
                  position: 'absolute',
                  left: -PORT_RADIUS,
                  top: height / 2 - PORT_RADIUS,
                  width: PORT_RADIUS * 2,
                  height: PORT_RADIUS * 2,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '2px solid #1e1e2e',
                  cursor: 'pointer',
                  transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseUp={(e) => handleInputPortMouseUp(e, node.id)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  right: -PORT_RADIUS,
                  top: height / 2 - PORT_RADIUS,
                  width: PORT_RADIUS * 2,
                  height: PORT_RADIUS * 2,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '2px solid #1e1e2e',
                  cursor: 'pointer',
                  transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseDown={(e) => handleOutputPortMouseDown(e, node.id)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              />

              <div style={{ padding: '12px 14px', fontSize: '12px' }}>
                {node.type === 'start' && (
                  <>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>起始X: {(config as StartNodeConfig).startX}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={(config as StartNodeConfig).startX}
                        onChange={(e) => updateNodeConfig(node.id, 'startX', Number(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: color,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>起始Y: {(config as StartNodeConfig).startY}</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="550"
                        value={(config as StartNodeConfig).startY}
                        onChange={(e) => updateNodeConfig(node.id, 'startY', Number(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: color,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>跳跃力: {(config as StartNodeConfig).jumpPower}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="25"
                        value={(config as StartNodeConfig).jumpPower}
                        onChange={(e) => updateNodeConfig(node.id, 'jumpPower', Number(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: color,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </>
                )}

                {node.type === 'distribution' && (
                  <>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>间距: {(config as DistributionNodeConfig).minGap}-{(config as DistributionNodeConfig).maxGap}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="range"
                          min="40"
                          max="150"
                          value={(config as DistributionNodeConfig).minGap}
                          onChange={(e) => updateNodeConfig(node.id, 'minGap', Number(e.target.value))}
                          style={{
                            flex: 1,
                            accentColor: color,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="range"
                          min="100"
                          max="300"
                          value={(config as DistributionNodeConfig).maxGap}
                          onChange={(e) => updateNodeConfig(node.id, 'maxGap', Number(e.target.value))}
                          style={{
                            flex: 1,
                            accentColor: color,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>高度变化: {(config as DistributionNodeConfig).minHeightChange}~{(config as DistributionNodeConfig).maxHeightChange}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="range"
                          min="-100"
                          max="0"
                          value={(config as DistributionNodeConfig).minHeightChange}
                          onChange={(e) => updateNodeConfig(node.id, 'minHeightChange', Number(e.target.value))}
                          style={{
                            flex: 1,
                            accentColor: color,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={(config as DistributionNodeConfig).maxHeightChange}
                          onChange={(e) => updateNodeConfig(node.id, 'maxHeightChange', Number(e.target.value))}
                          style={{
                            flex: 1,
                            accentColor: color,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>敌人概率: {(config as DistributionNodeConfig).enemyProbability}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(config as DistributionNodeConfig).enemyProbability}
                        onChange={(e) => updateNodeConfig(node.id, 'enemyProbability', Number(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: color,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </>
                )}

                {node.type === 'reward' && (
                  <>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>金币数量: {(config as RewardNodeConfig).coinCount}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={(config as RewardNodeConfig).coinCount}
                        onChange={(e) => updateNodeConfig(node.id, 'coinCount', Number(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: color,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: '6px' }}>放置模式</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateNodeConfig(node.id, 'placementMode', 'uniform');
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid ' + ((config as RewardNodeConfig).placementMode === 'uniform' ? color : '#3a3a5c'),
                            backgroundColor: (config as RewardNodeConfig).placementMode === 'uniform' ? color + '20' : 'transparent',
                            color: '#e0e0e0',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          均匀
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateNodeConfig(node.id, 'placementMode', 'random');
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid ' + ((config as RewardNodeConfig).placementMode === 'random' ? color : '#3a3a5c'),
                            backgroundColor: (config as RewardNodeConfig).placementMode === 'random' ? color + '20' : 'transparent',
                            color: '#e0e0e0',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          随机
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            zIndex: 100,
          }}
        >
          <button
            onClick={generateLevel}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2ecc71',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 10px rgba(46, 204, 113, 0.3)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(46, 204, 113, 0.3)';
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
          >
            生成关卡
          </button>
          
          <button
            onClick={validateLevel}
            disabled={isValidating}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isValidating ? '#555' : '#3498db',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isValidating ? 'not-allowed' : 'pointer',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isValidating ? 'none' : '0 2px 10px rgba(52, 152, 219, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isValidating) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isValidating) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(52, 152, 219, 0.3)';
              }
            }}
            onMouseDown={(e) => {
              if (!isValidating) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              if (!isValidating) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              }
            }}
          >
            {isValidating ? '验证中...' : '后端验证'}
          </button>

          <button
            onClick={exportConfigJSON}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#9b59b6',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 10px rgba(155, 89, 182, 0.3)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(155, 89, 182, 0.3)';
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
          >
            导出JSON
          </button>
        </div>
      </div>

      <div
        style={{
          width: '280px',
          minWidth: '280px',
          backgroundColor: '#282840',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          borderLeft: '1px solid #3a3a5c',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e0e0e0' }}>
          验证结果
        </h3>
        
        {validationResult ? (
          <>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#1e1e2e', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>总体通关率</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: getColorForSuccessRate(validationResult.overallSuccessRate / 100) }}>
                {validationResult.overallSuccessRate.toFixed(1)}%
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#1e1e2e', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>平均步数</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#e0e0e0' }}>
                {validationResult.avgSteps.toFixed(0)}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>跳跃力参数对比</div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  gap: '8px',
                  padding: '16px 8px',
                  backgroundColor: '#1e1e2e',
                  borderRadius: '8px',
                  minHeight: '150px',
                }}
              >
                {validationResult.results.map((result, index) => {
                  const rate = result.successRate / 100;
                  const barHeight = Math.max(10, rate * 100);
                  return (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ fontSize: '10px', marginBottom: '6px', color: '#888' }}>
                        {result.successRate.toFixed(0)}%
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: `${barHeight}%`,
                          minHeight: '10px',
                          backgroundColor: getColorForSuccessRate(rate),
                          borderRadius: '4px 4px 0 0',
                          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                      <div style={{ fontSize: '11px', marginTop: '8px', color: '#aaa' }}>
                        {result.jumpPower}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>
              跳跃力 →
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '13px',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            点击"后端验证"按钮<br />查看通关概率分析
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #3a3a5c' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>节点配置JSON</div>
          <pre
            style={{
              fontSize: '10px',
              backgroundColor: '#1e1e2e',
              padding: '10px',
              borderRadius: '6px',
              overflow: 'auto',
              maxHeight: '150px',
              margin: 0,
              color: '#9cdcfe',
            }}
          >
            {JSON.stringify(ruleConfig, null, 2)}
          </pre>
        </div>
      </div>

      {showSaveModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            style={{
              backgroundColor: '#282840',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              minWidth: '300px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>保存预设</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="输入预设名称"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #3a3a5c',
                backgroundColor: '#1e1e2e',
                color: '#e0e0e0',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #3a3a5c',
                  backgroundColor: 'transparent',
                  color: '#e0e0e0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                取消
              </button>
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: presetName.trim() ? '#5865f2' : '#555',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: presetName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeEditor;
