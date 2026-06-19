import React, { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../stores/gameStore';
import type { VariableRule } from '../types';

const NodeForm: React.FC = () => {
  const story = useGameStore((s) => s.story);
  const selectedNodeId = useGameStore((s) => s.selectedNodeId);
  const updateNode = useGameStore((s) => s.updateNode);
  const variables = useGameStore((s) => s.variables);

  const selectedNode = useMemo(() => {
    if (!story || !selectedNodeId) return null;
    return story.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [story, selectedNodeId]);

  const handleChange = useCallback(
    (field: string, value: string | boolean) => {
      if (!selectedNode) return;
      updateNode(selectedNode.id, { [field]: value });
    },
    [selectedNode, updateNode]
  );

  const handleRuleChange = useCallback(
    (ruleIndex: number, field: string, value: string | number | boolean) => {
      if (!selectedNode) return;
      const newRules = [...selectedNode.variableRules];
      newRules[ruleIndex] = {
        ...newRules[ruleIndex],
        [field]: value
      };
      updateNode(selectedNode.id, { variableRules: newRules });
    },
    [selectedNode, updateNode]
  );

  const handleAddRule = useCallback(() => {
    if (!selectedNode || variables.length === 0) return;
    const firstVar = variables[0];
    const newRule: VariableRule = {
      id: uuidv4(),
      variableId: firstVar.id,
      operation: firstVar.type === 'number' ? 'add' : 'toggle',
      value: firstVar.type === 'number' ? 1 : true
    };
    updateNode(selectedNode.id, {
      variableRules: [...selectedNode.variableRules, newRule]
    });
  }, [selectedNode, variables, updateNode]);

  const handleRemoveRule = useCallback(
    (ruleIndex: number) => {
      if (!selectedNode) return;
      const newRules = selectedNode.variableRules.filter((_, i) => i !== ruleIndex);
      updateNode(selectedNode.id, { variableRules: newRules });
    },
    [selectedNode, updateNode]
  );

  const getOperationOptions = (varType: 'number' | 'boolean') => {
    if (varType === 'number') {
      return [
        { value: 'add', label: '增加' },
        { value: 'subtract', label: '减少' },
        { value: 'set', label: '设置为' }
      ];
    }
    return [
      { value: 'toggle', label: '切换' },
      { value: 'set', label: '设置为' }
    ];
  };

  if (!selectedNode) {
    return (
      <div
        className="p-6 rounded-lg shadow-card transition-all duration-300 flex items-center justify-center text-center h-full"
        style={{ backgroundColor: '#16213e' }}
      >
        <div className="text-text-secondary">
          <div className="text-4xl mb-3 opacity-50">📝</div>
          <p className="text-sm">请选择一个节点进行编辑</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-5 rounded-lg shadow-card transition-all duration-300 overflow-y-auto h-full"
      style={{ backgroundColor: '#16213e' }}
    >
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-accent/50">
        <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
          <span className="text-highlight">✏️</span>
          节点编辑
        </h3>
        {selectedNode.isStart && (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            开始节点
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            标题
          </label>
          <input
            type="text"
            value={selectedNode.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-main text-text-main border border-accent/50 focus:border-highlight transition-all duration-300 text-sm"
            placeholder="输入场景标题"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            描述文本
          </label>
          <textarea
            value={selectedNode.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-bg-main text-text-main border border-accent/50 focus:border-highlight transition-all duration-300 text-sm resize-none"
            placeholder="描述这个场景的内容..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            背景图片 URL
          </label>
          <input
            type="text"
            value={selectedNode.backgroundImageUrl}
            onChange={(e) => handleChange('backgroundImageUrl', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-main text-text-main border border-accent/50 focus:border-highlight transition-all duration-300 text-sm"
            placeholder="https://example.com/image.jpg"
          />
          {selectedNode.backgroundImageUrl && (
            <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-accent/30">
              <img
                src={selectedNode.backgroundImageUrl}
                alt="预览"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            背景音乐 URL
          </label>
          <input
            type="text"
            value={selectedNode.backgroundMusicUrl}
            onChange={(e) => handleChange('backgroundMusicUrl', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-main text-text-main border border-accent/50 focus:border-highlight transition-all duration-300 text-sm"
            placeholder="https://example.com/music.mp3"
          />
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-main/50">
          <span className="text-sm text-text-main">设为开始节点</span>
          <button
            onClick={() => handleChange('isStart', !selectedNode.isStart)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              selectedNode.isStart ? 'bg-green-500' : 'bg-accent'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                selectedNode.isStart ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="pt-3 border-t border-accent/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-main flex items-center gap-2">
              <span className="text-highlight">🎯</span>
              变量修改规则
            </h4>
            <button
              onClick={handleAddRule}
              disabled={variables.length === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#0f3460'
              }}
              onMouseEnter={(e) => {
                if (variables.length > 0) {
                  e.currentTarget.style.backgroundColor = '#e94560';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f3460';
              }}
            >
              + 添加规则
            </button>
          </div>

          {variables.length === 0 && (
            <div className="text-center py-4 text-text-secondary text-xs">
              请先在变量面板定义变量
            </div>
          )}

          <div className="space-y-2">
            {selectedNode.variableRules.map((rule, index) => {
              const ruleVariable = variables.find((v) => v.id === rule.variableId);
              if (!ruleVariable) return null;
              const operationOptions = getOperationOptions(ruleVariable.type);

              return (
                <div
                  key={rule.id}
                  className="p-3 rounded-lg bg-bg-main border border-accent/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">规则 {index + 1}</span>
                    <button
                      onClick={() => handleRemoveRule(index)}
                      className="text-text-secondary hover:text-highlight transition-colors duration-200 text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={rule.variableId}
                      onChange={(e) => {
                        const newVar = variables.find((v) => v.id === e.target.value);
                        if (newVar) {
                          handleRuleChange(index, 'variableId', e.target.value);
                          handleRuleChange(
                            index,
                            'operation',
                            newVar.type === 'number' ? 'add' : 'toggle'
                          );
                          handleRuleChange(
                            index,
                            'value',
                            newVar.type === 'number' ? 1 : true
                          );
                        }
                      }}
                      className="px-2 py-1.5 text-xs rounded bg-bg-card text-text-main border border-accent/50 focus:border-highlight transition-all duration-300"
                    >
                      {variables.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={rule.operation}
                      onChange={(e) =>
                        handleRuleChange(index, 'operation', e.target.value)
                      }
                      className="px-2 py-1.5 text-xs rounded bg-bg-card text-text-main border border-accent/50 focus:border-highlight transition-all duration-300"
                    >
                      {operationOptions.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {ruleVariable.type === 'number' ? (
                      <input
                        type="number"
                        value={rule.value as number}
                        onChange={(e) =>
                          handleRuleChange(index, 'value', parseFloat(e.target.value) || 0)
                        }
                        className="px-2 py-1.5 text-xs rounded bg-bg-card text-text-main border border-accent/50 focus:border-highlight transition-all duration-300"
                      />
                    ) : (
                      <select
                        value={String(rule.value)}
                        onChange={(e) =>
                          handleRuleChange(index, 'value', e.target.value === 'true')
                        }
                        className="px-2 py-1.5 text-xs rounded bg-bg-card text-text-main border border-accent/50 focus:border-highlight transition-all duration-300"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedNode.variableRules.length === 0 && variables.length > 0 && (
            <div className="text-center py-4 text-text-secondary text-xs border border-dashed border-accent/30 rounded-lg">
              暂无规则，点击上方按钮添加
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeForm;
