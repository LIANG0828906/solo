import React, { useState, useRef, useEffect, useCallback } from 'react';
import type {
  DialogueNode,
  DialogueTree,
  DialogueBranch,
  DialogueCondition,
  ConditionType,
  Speaker,
  ExpressionType,
} from '../types';
import { Plus, Trash2, MessageSquare, User, Bot } from 'lucide-react';

interface DialogueTreeEditorProps {
  tree: DialogueTree;
  onChange: (tree: DialogueTree) => void;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 180;
const MAX_TEXT_LENGTH = 200;

const CONDITION_COLORS: Record<ConditionType, string> = {
  affection: '#3b82f6',
  time: '#22c55e',
  story: '#f97316',
};

const CONDITION_LABELS: Record<ConditionType, string> = {
  affection: '好感度',
  time: '时间',
  story: '剧情',
};

const EXPRESSION_LABELS: Record<ExpressionType, string> = {
  default: '默认',
  happy: '开心',
  sad: '悲伤',
  angry: '愤怒',
  surprised: '惊讶',
};

function generateId(): string {
  return 'node_' + Math.random().toString(36).substr(2, 9);
}

const DialogueTreeEditor: React.FC<DialogueTreeEditorProps> = ({
  tree,
  onChange,
  selectedNodeId,
  onSelectNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<DialogueNode | null>(null);
  const [newBranchCondition, setNewBranchCondition] = useState<ConditionType>('affection');
  const rafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);

  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    tree.nodes.forEach((node) => {
      node.branches.forEach((branch) => {
        const targetNode = tree.nodes.find((n) => n.id === branch.targetNodeId);
        if (!targetNode) return;

        const startX = node.position.x + NODE_WIDTH / 2;
        const startY = node.position.y + NODE_HEIGHT;
        const endX = targetNode.position.x + NODE_WIDTH / 2;
        const endY = targetNode.position.y;

        const color = branch.condition
          ? CONDITION_COLORS[branch.condition.type]
          : '#64748b';

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        const midY = (startY + endY) / 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(startX, midY, endX, midY, endX, endY);
        ctx.stroke();

        const arrowSize = 8;
        const angle = Math.atan2(endY - midY, endX - endX) + Math.PI / 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      });
    });

    if (connectingFrom) {
      const fromNode = tree.nodes.find((n) => n.id === connectingFrom);
      if (fromNode) {
        const startX = fromNode.position.x + NODE_WIDTH / 2;
        const startY = fromNode.position.y + NODE_HEIGHT;

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.lineCap = 'round';

        const midY = (startY + mousePos.y) / 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(startX, midY, mousePos.x, midY, mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [tree.nodes, connectingFrom, mousePos]);

  useEffect(() => {
    if (!pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        drawConnections();
        pendingUpdateRef.current = false;
      });
    }
  }, [drawConnections]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = tree.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    onSelectNode(nodeId);
    setEditingNode({ ...node });
    setDraggingNodeId(nodeId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - node.position.x,
        y: e.clientY - rect.top - node.position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    if (draggingNodeId) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      const updatedNodes = tree.nodes.map((n) =>
        n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n
      );
      onChange({ ...tree, nodes: updatedNodes });

      if (editingNode && editingNode.id === draggingNodeId) {
        setEditingNode({ ...editingNode, position: { x: newX, y: newY } });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (connectingFrom) {
      const targetNode = tree.nodes.find(
        (n) =>
          x >= n.position.x &&
          x <= n.position.x + NODE_WIDTH &&
          y >= n.position.y &&
          y <= n.position.y + NODE_HEIGHT &&
          n.id !== connectingFrom
      );

      if (targetNode) {
        addBranch(connectingFrom, targetNode.id);
      }
      setConnectingFrom(null);
    }

    setDraggingNodeId(null);
  };

  const addNode = (speaker: Speaker) => {
    const newNode: DialogueNode = {
      id: generateId(),
      speaker,
      text: speaker === 'npc' ? '你好，冒险者！' : '你好',
      expression: 'default',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      branches: [],
    };

    onChange({
      ...tree,
      nodes: [...tree.nodes, newNode],
    });
    onSelectNode(newNode.id);
    setEditingNode(newNode);
  };

  const deleteNode = (nodeId: string) => {
    const updatedNodes = tree.nodes.filter((n) => n.id !== nodeId);
    const cleanedNodes = updatedNodes.map((n) => ({
      ...n,
      branches: n.branches.filter((b) => b.targetNodeId !== nodeId),
    }));

    const newStartId = tree.startNodeId === nodeId ? (cleanedNodes[0]?.id || '') : tree.startNodeId;

    onChange({
      ...tree,
      nodes: cleanedNodes,
      startNodeId: newStartId,
    });

    if (selectedNodeId === nodeId) {
      onSelectNode(null);
      setEditingNode(null);
    }
  };

  const updateNode = (updates: Partial<DialogueNode>) => {
    if (!editingNode) return;

    const updated = { ...editingNode, ...updates };
    setEditingNode(updated);

    const updatedNodes = tree.nodes.map((n) =>
      n.id === editingNode.id ? updated : n
    );
    onChange({ ...tree, nodes: updatedNodes });
  };

  const addBranch = (fromNodeId: string, toNodeId: string) => {
    const condition: DialogueCondition = {
      type: newBranchCondition,
      operator: 'gt',
      value: newBranchCondition === 'story' ? 'quest_started' : 50,
    };

    const newBranch: DialogueBranch = {
      id: generateId(),
      targetNodeId: toNodeId,
      condition,
      label: '选项',
    };

    const updatedNodes = tree.nodes.map((n) =>
      n.id === fromNodeId ? { ...n, branches: [...n.branches, newBranch] } : n
    );
    onChange({ ...tree, nodes: updatedNodes });
  };

  const deleteBranch = (nodeId: string, branchId: string) => {
    const updatedNodes = tree.nodes.map((n) =>
      n.id === nodeId
        ? { ...n, branches: n.branches.filter((b) => b.id !== branchId) }
        : n
    );
    onChange({ ...tree, nodes: updatedNodes });
  };

  const updateBranch = (nodeId: string, branchId: string, updates: Partial<DialogueBranch>) => {
    const updatedNodes = tree.nodes.map((n) => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        branches: n.branches.map((b) =>
          b.id === branchId ? { ...b, ...updates } : b
        ),
      };
    });
    onChange({ ...tree, nodes: updatedNodes });

    if (editingNode && editingNode.id === nodeId) {
      setEditingNode({
        ...editingNode,
        branches: editingNode.branches.map((b) =>
          b.id === branchId ? { ...b, ...updates } : b
        ),
      });
    }
  };

  const updateBranchCondition = (
    nodeId: string,
    branchId: string,
    conditionUpdates: Partial<DialogueCondition>
  ) => {
    const updatedNodes = tree.nodes.map((n) => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        branches: n.branches.map((b) => {
          if (b.id !== branchId) return b;
          const newCondition = b.condition
            ? { ...b.condition, ...conditionUpdates }
            : { type: 'affection' as ConditionType, operator: 'gt', value: 50, ...conditionUpdates };
          return { ...b, condition: newCondition };
        }),
      };
    });
    onChange({ ...tree, nodes: updatedNodes });
  };

  const handleStartConnect = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingFrom(nodeId);
  };

  const textLength = editingNode?.text.length || 0;
  const textOverLimit = textLength > MAX_TEXT_LENGTH;

  return (
    <div className="dialogue-tree-editor" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #334155',
      }}>
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>对话树编辑器</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => addNode('npc')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
        >
          <Bot size={16} />
          NPC节点
        </button>
        <button
          onClick={() => addNode('player')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
        >
          <User size={16} />
          玩家节点
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          onSelectNode(null);
          setConnectingFrom(null);
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />

        {tree.nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isConnecting = connectingFrom === node.id;

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              style={{
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: `2px solid ${isSelected ? '#f59e0b' : '#94a3b8'}`,
                boxShadow: isSelected ? '0 8px 24px rgba(245, 158, 11, 0.25)' : '0 2px 8px rgba(0,0,0,0.1)',
                transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'transform 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out',
                cursor: draggingNodeId === node.id ? 'grabbing' : 'grab',
                padding: '12px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                userSelect: 'none',
                zIndex: isSelected ? 10 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#94a3b8';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: node.speaker === 'npc' ? '#f472b6' : '#60a5fa',
                paddingBottom: '6px',
                borderBottom: '1px solid #e2e8f0',
              }}>
                {node.speaker === 'npc' ? <Bot size={14} /> : <User size={14} />}
                {node.speaker === 'npc' ? 'NPC' : '玩家'}
                {node.expression && (
                  <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '11px', fontWeight: 400 }}>
                    {EXPRESSION_LABELS[node.expression]}
                  </span>
                )}
              </div>

              <div style={{
                flex: 1,
                fontSize: '14px',
                lineHeight: 1.5,
                color: '#1e293b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
              }}>
                {node.text || '（空文本）'}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingTop: '6px',
                borderTop: '1px solid #e2e8f0',
              }}>
                <span style={{
                  fontSize: '11px',
                  color: '#64748b',
                }}>
                  {node.branches.length} 个分支
                </span>
                <button
                  onClick={(e) => handleStartConnect(e, node.id)}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 8px',
                    backgroundColor: isConnecting ? '#f59e0b' : '#e2e8f0',
                    color: isConnecting ? '#ffffff' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isConnecting ? '连线中...' : '添加分支'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingNode && (
        <div style={{
          borderTop: '1px solid #334155',
          padding: '12px 16px',
          backgroundColor: '#1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <MessageSquare size={16} color="#60a5fa" />
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px' }}>
              节点属性
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => deleteNode(editingNode.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.15s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Trash2 size={14} />
              删除
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#94a3b8',
                marginBottom: '4px',
              }}>
                说话人
              </label>
              <select
                value={editingNode.speaker}
                onChange={(e) => updateNode({ speaker: e.target.value as Speaker })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: '#334155',
                  color: '#e2e8f0',
                  border: '2px solid transparent',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px #3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="npc">NPC</option>
                <option value="player">玩家</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#94a3b8',
                marginBottom: '4px',
              }}>
                表情
              </label>
              <select
                value={editingNode.expression || 'default'}
                onChange={(e) => updateNode({ expression: e.target.value as ExpressionType })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: '#334155',
                  color: '#e2e8f0',
                  border: '2px solid transparent',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px #3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              >
                {Object.entries(EXPRESSION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}>
              <label style={{
                fontSize: '12px',
                color: '#94a3b8',
              }}>
                对话文本
              </label>
              <span style={{
                fontSize: '11px',
                color: textOverLimit ? '#ef4444' : '#64748b',
              }}>
                {textLength}/{MAX_TEXT_LENGTH}
              </span>
            </div>
            <textarea
              value={editingNode.text}
              onChange={(e) => updateNode({ text: e.target.value })}
              maxLength={MAX_TEXT_LENGTH}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: textOverLimit ? '#450a0a' : '#334155',
                color: textOverLimit ? '#fecaca' : '#e2e8f0',
                border: `2px solid ${textOverLimit ? '#ef4444' : 'transparent'}`,
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                if (!textOverLimit) {
                  e.target.style.boxShadow = '0 0 0 2px #3b82f6';
                }
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {editingNode.branches.length > 0 && (
            <div>
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginBottom: '6px',
              }}>
                分支列表
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '120px',
                overflowY: 'auto',
              }}>
                {editingNode.branches.map((branch) => {
                  const condition = branch.condition;
                  const conditionColor = condition
                    ? CONDITION_COLORS[condition.type]
                    : '#64748b';

                  return (
                    <div
                      key={branch.id}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#334155',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderLeft: `3px solid ${conditionColor}`,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#e2e8f0',
                          fontWeight: 500,
                        }}>
                          {branch.label || '选项'}
                        </div>
                        {condition && (
                          <div style={{
                            fontSize: '11px',
                            color: conditionColor,
                            marginTop: '2px',
                          }}>
                            {CONDITION_LABELS[condition.type]}: {String(condition.value)}
                          </div>
                        )}
                      </div>
                      {condition && (
                        <select
                          value={condition.type}
                          onChange={(e) => updateBranchCondition(
                            editingNode.id,
                            branch.id,
                            { type: e.target.value as ConditionType }
                          )}
                          style={{
                            padding: '4px 6px',
                            backgroundColor: '#1e293b',
                            color: '#e2e8f0',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            outline: 'none',
                          }}
                        >
                          {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => deleteBranch(editingNode.id, branch.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          color: '#94a3b8',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>新增分支条件:</span>
            <select
              value={newBranchCondition}
              onChange={(e) => setNewBranchCondition(e.target.value as ConditionType)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#334155',
                color: '#e2e8f0',
                border: '2px solid transparent',
                borderRadius: '8px',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              点击"添加分支"按钮后拖动到目标节点
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DialogueTreeEditor;
