import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../stores/gameStore';
import type { GameVariable, VariableRule } from '../types';

const VariablePanel: React.FC = () => {
  const variables = useGameStore((s) => s.variables);
  const addVariable = useGameStore((s) => s.addVariable);
  const updateVariable = useGameStore((s) => s.updateVariable);
  const removeVariable = useGameStore((s) => s.removeVariable);
  const runtimeState = useGameStore((s) => s.runtimeState);
  const selectedNodeId = useGameStore((s) => s.selectedNodeId);
  const updateNode = useGameStore((s) => s.updateNode);
  const story = useGameStore((s) => s.story);

  const [changedVariableIds, setChangedVariableIds] = useState<Set<string>>(new Set());
  const [selectedRuleVarId, setSelectedRuleVarId] = useState<string>('');
  const [selectedRuleOperation, setSelectedRuleOperation] = useState<string>('add');
  const [selectedRuleValue, setSelectedRuleValue] = useState<number | boolean>(1);

  const prevValuesRef = useRef<Record<string, number | boolean>>({});

  useEffect(() => {
    if (!runtimeState) return;

    const changed: string[] = [];
    Object.entries(runtimeState.variables).forEach(([id, value]) => {
      if (prevValuesRef.current[id] !== undefined && prevValuesRef.current[id] !== value) {
        changed.push(id);
      }
    });

    if (changed.length > 0) {
      setChangedVariableIds((prev) => {
        const next = new Set(prev);
        changed.forEach((id) => next.add(id));
        return next;
      });

      setTimeout(() => {
        setChangedVariableIds((prev) => {
          const next = new Set(prev);
          changed.forEach((id) => next.delete(id));
          return next;
        });
      }, 300);
    }

    prevValuesRef.current = { ...runtimeState.variables };
  }, [runtimeState?.variables]);

  useEffect(() => {
    if (variables.length > 0 && !selectedRuleVarId) {
      setSelectedRuleVarId(variables[0].id);
      const firstVar = variables[0];
      setSelectedRuleOperation(firstVar.type === 'number' ? 'add' : 'toggle');
      setSelectedRuleValue(firstVar.type === 'number' ? 1 : true);
    }
  }, [variables.length, selectedRuleVarId]);

  const selectedNode = story?.nodes.find((n) => n.id === selectedNodeId) || null;

  const handleAddVariable = useCallback(() => {
    const newVar = addVariable();
    return newVar;
  }, [addVariable]);

  const handleUpdateVariable = useCallback(
    (id: string, field: string, value: string | number | boolean) => {
      updateVariable(id, { [field]: value });
    },
    [updateVariable]
  );

  const handleRemoveVariable = useCallback(
    (id: string) => {
      removeVariable(id);
    },
    [removeVariable]
  );

  const handleApplyRuleToNode = useCallback(() => {
    if (!selectedNode || !selectedRuleVarId) return;

    const targetVar = variables.find((v) => v.id === selectedRuleVarId);
    if (!targetVar) return;

    const newRule: VariableRule = {
      id: uuidv4(),
      variableId: selectedRuleVarId,
      operation: selectedRuleOperation as 'add' | 'subtract' | 'set' | 'toggle',
      value: targetVar.type === 'number' ? Number(selectedRuleValue) : Boolean(selectedRuleValue)
    };

    updateNode(selectedNode.id, {
      variableRules: [...selectedNode.variableRules, newRule]
    });
  }, [selectedNode, selectedRuleVarId, selectedRuleOperation, selectedRuleValue, variables, updateNode]);

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

  const getCurrentValue = (v: GameVariable): number | boolean => {
    if (runtimeState && runtimeState.variables[v.id] !== undefined) {
      return runtimeState.variables[v.id];
    }
    return v.initialValue;
  };

  return (
    <div
      className="rounded-lg shadow-card transition-all duration-300 overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: 'rgba(22, 33, 62, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <div className="p-4 border-b border-accent/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
            <span className="text-highlight">📊</span>
            变量管理
          </h3>
          <button
            onClick={handleAddVariable}
            className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-300 text-white"
            style={{ backgroundColor: '#0f3460' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e94560';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0f3460';
            }}
          >
            + 变量
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {variables.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            <div className="text-3xl mb-2 opacity-50">📈</div>
            暂无变量，点击上方按钮添加
          </div>
        ) : (
          <div className="space-y-3">
            {variables.map((v) => {
              const currentValue = getCurrentValue(v);
              const isChanged = changedVariableIds.has(v.id);
              const progress = v.type === 'number'
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      ((currentValue as number) - (v.minValue ?? 0)) /
                        Math.max(1, (v.maxValue ?? 100) - (v.minValue ?? 0)) * 100
                    )
                  )
                : 0;

              return (
                <div
                  key={v.id}
                  className="p-3 rounded-lg bg-bg-main/60 border border-accent/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {v.type === 'number' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: v.color || '#e94560' }}
                        />
                      )}
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleUpdateVariable(v.id, 'name', e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-text-main text-sm font-medium border-b border-transparent hover:border-accent focus:border-highlight transition-all duration-300 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveVariable(v.id)}
                      className="ml-2 text-text-secondary hover:text-highlight transition-colors duration-200 text-sm flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-text-secondary mb-1">类型</label>
                      <select
                        value={v.type}
                        onChange={(e) => {
                          const newType = e.target.value as 'number' | 'boolean';
                          handleUpdateVariable(v.id, 'type', newType);
                          if (newType === 'number') {
                            handleUpdateVariable(v.id, 'initialValue', 0);
                            handleUpdateVariable(v.id, 'minValue', 0);
                            handleUpdateVariable(v.id, 'maxValue', 100);
                          } else {
                            handleUpdateVariable(v.id, 'initialValue', false);
                          }
                        }}
                        className="w-full px-2 py-1 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
                      >
                        <option value="number">数字</option>
                        <option value="boolean">布尔</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-secondary mb-1">初始值</label>
                      {v.type === 'number' ? (
                        <input
                          type="number"
                          value={v.initialValue as number}
                          onChange={(e) =>
                            handleUpdateVariable(v.id, 'initialValue', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
                        />
                      ) : (
                        <select
                          value={String(v.initialValue)}
                          onChange={(e) =>
                            handleUpdateVariable(v.id, 'initialValue', e.target.value === 'true')
                          }
                          className="w-full px-2 py-1 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {v.type === 'number' && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-text-secondary mb-1">最小值</label>
                          <input
                            type="number"
                            value={v.minValue ?? 0}
                            onChange={(e) =>
                              handleUpdateVariable(v.id, 'minValue', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-secondary mb-1">最大值</label>
                          <input
                            type="number"
                            value={v.maxValue ?? 100}
                            onChange={(e) =>
                              handleUpdateVariable(v.id, 'maxValue', parseFloat(e.target.value) || 100)
                            }
                            className="w-full px-2 py-1 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-secondary mb-1">颜色</label>
                          <input
                            type="color"
                            value={v.color || '#e94560'}
                            onChange={(e) => handleUpdateVariable(v.id, 'color', e.target.value)}
                            className="w-full h-7 rounded border border-accent/40 cursor-pointer bg-bg-card"
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[10px] text-text-secondary mb-1">
                          <span>当前值</span>
                          <span
                            key={`${v.id}-${currentValue}-${isChanged}`}
                            className={`font-bold text-sm ${
                              isChanged ? 'animate-scale-pop inline-block' : ''
                            }`}
                            style={{ color: v.color || '#e94560' }}
                          >
                            {currentValue as number}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-accent/50 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: v.color || '#e94560'
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {v.type === 'boolean' && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-text-secondary">当前值</span>
                      <span
                        key={`${v.id}-${currentValue}-${isChanged}`}
                        className={`font-bold text-sm inline-block ${
                          isChanged ? 'animate-scale-pop' : ''
                        } ${currentValue ? 'text-green-400' : 'text-text-secondary'}`}
                      >
                        {currentValue ? '✓ True' : '✗ False'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedNode && variables.length > 0 && (
        <div className="p-4 border-t border-accent/50 bg-bg-main/40">
          <h4 className="text-xs font-semibold text-highlight mb-3 flex items-center gap-2">
            <span>✨</span>
            应用到当前节点
          </h4>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <select
                value={selectedRuleVarId}
                onChange={(e) => {
                  const newVarId = e.target.value;
                  setSelectedRuleVarId(newVarId);
                  const newVar = variables.find((v) => v.id === newVarId);
                  if (newVar) {
                    setSelectedRuleOperation(newVar.type === 'number' ? 'add' : 'toggle');
                    setSelectedRuleValue(newVar.type === 'number' ? 1 : true);
                  }
                }}
                className="px-2 py-1.5 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
              >
                {variables.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>

              {(() => {
                const targetVar = variables.find((v) => v.id === selectedRuleVarId);
                const options = targetVar
                  ? getOperationOptions(targetVar.type)
                  : [];
                return (
                  <select
                    value={selectedRuleOperation}
                    onChange={(e) => setSelectedRuleOperation(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
                  >
                    {options.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                );
              })()}

              {(() => {
                const targetVar = variables.find((v) => v.id === selectedRuleVarId);
                if (!targetVar || targetVar.type === 'boolean') {
                  if (selectedRuleOperation === 'set') {
                    return (
                      <select
                        value={String(selectedRuleValue)}
                        onChange={(e) =>
                          setSelectedRuleValue(e.target.value === 'true')
                        }
                        className="px-2 py-1.5 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    );
                  }
                  return (
                    <div className="px-2 py-1.5 text-xs rounded bg-bg-card/50 text-text-secondary border border-accent/20 text-center">
                      切换
                    </div>
                  );
                }
                return (
                  <input
                    type="number"
                    value={selectedRuleValue as number}
                    onChange={(e) => setSelectedRuleValue(parseFloat(e.target.value) || 0)}
                    className="px-2 py-1.5 text-xs rounded bg-bg-card text-text-main border border-accent/40 focus:border-highlight transition-all duration-300 outline-none"
                  />
                );
              })()}
            </div>

            <button
              onClick={handleApplyRuleToNode}
              className="w-full py-1.5 text-xs font-medium rounded-lg transition-all duration-300 text-white"
              style={{ backgroundColor: '#0f3460' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e94560';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f3460';
              }}
            >
              添加规则到节点
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariablePanel;
