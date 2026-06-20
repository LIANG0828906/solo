import React, { useEffect, useCallback, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { Story, SceneNode, SceneEdge, TriggerCondition } from '../types';

interface GameEngineProps {
  story: Story;
  preview?: boolean;
}

const evaluateConditions = (
  conditions: TriggerCondition[],
  varValues: Record<string, number | boolean>
): boolean => {
  return conditions.every((c) => {
    const current = varValues[c.variableId];
    switch (c.operator) {
      case '>':
        return (current as number) > (c.value as number);
      case '<':
        return (current as number) < (c.value as number);
      case '>=':
        return (current as number) >= (c.value as number);
      case '<=':
        return (current as number) <= (c.value as number);
      case '==':
        return current === c.value;
      case '!=':
        return current !== c.value;
      default:
        return true;
    }
  });
};

const GameEngine: React.FC<GameEngineProps> = ({ story, preview = false }) => {
  const runtimeState = useGameStore((s) => s.runtimeState);
  const setCurrentNode = useGameStore((s) => s.setCurrentNode);
  const applyVariableRules = useGameStore((s) => s.applyVariableRules);
  const resetRuntime = useGameStore((s) => s.resetRuntime);
  const variables = useGameStore((s) => s.variables);

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    resetRuntime();
  }, [story.id, resetRuntime]);

  const currentNode: SceneNode | undefined = story.nodes.find(
    (n) => n.id === runtimeState?.currentNodeId
  );

  const availableEdges: SceneEdge[] = story.edges.filter(
    (e) =>
      e.source === runtimeState?.currentNodeId &&
      evaluateConditions(e.conditions, runtimeState?.variables || {})
  );

  const handleChoice = useCallback(
    (edge: SceneEdge) => {
      if (isTransitioning) return;
      setIsTransitioning(true);

      const targetNode = story.nodes.find((n) => n.id === edge.target);
      if (targetNode && targetNode.variableRules.length > 0) {
        applyVariableRules(targetNode.variableRules);
      }

      setTimeout(() => {
        setCurrentNode(edge.target);
        setIsTransitioning(false);
      }, 300);
    },
    [isTransitioning, story.nodes, applyVariableRules, setCurrentNode]
  );

  const handleReset = useCallback(() => {
    resetRuntime();
  }, [resetRuntime]);

  const progress =
    story.nodes.length > 0 && runtimeState
      ? (runtimeState.visitedNodes.length / story.nodes.length) * 100
      : 0;

  const varPanelWidth = preview ? 'w-56' : 'w-64';

  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden shadow-card flex flex-col"
      style={{ backgroundColor: '#16213e' }}
    >
      <div className="relative z-10 p-4 border-b border-accent/50 bg-bg-main/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-text-main truncate pr-2 text-sm md:text-base">
            {story.title}
          </h2>
          {preview && (
            <button
              onClick={handleReset}
              className="px-3 py-1 text-xs rounded-lg text-white transition-all duration-300 flex-shrink-0"
              style={{ backgroundColor: '#0f3460' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e94560';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f3460';
              }}
            >
              ↺ 重置
            </button>
          )}
        </div>
        <div className="relative">
          <div className="w-full h-2 rounded-full bg-accent/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 relative"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #0f3460, #e94560)'
              }}
            >
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg"
                style={{
                  boxShadow: '0 0 8px rgba(233, 69, 96, 0.8)'
                }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-text-secondary mt-1">
            <span>进度</span>
            <span>
              {runtimeState?.visitedNodes.length || 0}/{story.nodes.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        <div
          className={`flex-1 relative transition-all duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentNode?.backgroundImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${currentNode.backgroundImageUrl})`
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(22,33,62,0.3) 0%, rgba(22,33,62,0.85) 60%, rgba(22,33,62,0.95) 100%)'
                }}
              />
            </div>
          )}

          <div className="relative z-10 h-full flex flex-col p-4 md:p-6 overflow-y-auto">
            <h3 className="text-xl md:text-2xl font-bold text-text-main mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currentNode?.title || '场景加载中...'}
            </h3>

            <div className="flex-1 text-text-main/90 leading-relaxed text-sm md:text-base whitespace-pre-wrap mb-6">
              {currentNode?.description || '这里是场景描述...'}
            </div>

            <div className="space-y-2 md:space-y-3">
              <h4 className="text-xs text-text-secondary uppercase tracking-wider mb-2">
                选择你的行动
              </h4>
              {availableEdges.length === 0 ? (
                <div className="text-center py-6 text-text-secondary">
                  <div className="text-3xl mb-2 opacity-50">🎬</div>
                  <p className="text-sm">故事到此结束</p>
                  {preview && (
                    <button
                      onClick={handleReset}
                      className="mt-4 px-4 py-2 text-sm rounded-lg text-white transition-all duration-300"
                      style={{ backgroundColor: '#e94560' }}
                    >
                      重新开始
                    </button>
                  )}
                </div>
              ) : (
                availableEdges.map((edge) => (
                  <button
                    key={edge.id}
                    onClick={() => handleChoice(edge)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-accent/50 text-text-main
                      hover:border-highlight hover:bg-highlight/10 transition-all duration-300 group"
                    style={{ backgroundColor: 'rgba(26, 26, 46, 0.6)' }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs group-hover:bg-highlight transition-colors duration-300 flex-shrink-0">
                        →
                      </span>
                      <span className="text-sm">{edge.label || '继续...'}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {variables.length > 0 && (
          <div
            className={`${varPanelWidth} border-t md:border-t-0 md:border-l border-accent/50 p-3 overflow-y-auto
              bg-bg-main/50 backdrop-blur-sm flex-shrink-0`}
            style={{ maxHeight: preview ? '200px' : 'none' }}
          >
            <h4 className="text-xs font-semibold text-highlight mb-3 flex items-center gap-2">
              <span>📊</span> 状态
            </h4>
            <div className="space-y-3">
              {variables.map((v) => {
                const currentValue =
                  runtimeState?.variables[v.id] ?? v.initialValue;
                const isNumber = v.type === 'number';
                const progress = isNumber
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        ((currentValue as number) - (v.minValue ?? 0)) /
                          Math.max(
                            1,
                            (v.maxValue ?? 100) - (v.minValue ?? 0)
                          ) *
                          100
                      )
                    )
                  : 0;

                return (
                  <div key={v.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary flex items-center gap-1.5">
                        {isNumber && (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: v.color || '#e94560' }}
                          />
                        )}
                        {v.name}
                      </span>
                      <span
                        className="font-bold"
                        style={{
                          color: isNumber ? v.color || '#e94560' : currentValue ? '#4ade80' : '#a0a0b0'
                        }}
                      >
                        {isNumber
                          ? currentValue
                          : currentValue
                          ? '✓'
                          : '✗'}
                      </span>
                    </div>
                    {isNumber && (
                      <div className="w-full h-1.5 rounded-full bg-accent/50 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: v.color || '#e94560'
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEngine;
