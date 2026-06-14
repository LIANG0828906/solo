import React, { useState, useEffect, useRef, useCallback } from 'react';
import DialogueTreeEditor from './dialogue/DialogueTreeEditor';
import CharacterPortrait from './character/CharacterPortrait';
import { dialogueRuntime } from './dialogue/DialogueRuntime';
import { gameStateManager } from './game/GameStateManager';
import { spriteManager } from './character/SpriteManager';
import type { DialogueTree, LoadingProgress, DialogueState, ExpressionType } from './types';
import { Play, RotateCcw, ChevronDown, ChevronUp, Settings, Heart, Clock, BookOpen } from 'lucide-react';

function createDefaultTree(): DialogueTree {
  const node1 = {
    id: 'node_start',
    speaker: 'npc' as const,
    text: '你好，冒险者！欢迎来到像素小镇。你是第一次来这里吗？',
    expression: 'default' as const,
    position: { x: 50, y: 30 },
    branches: [
      {
        id: 'branch_1',
        targetNodeId: 'node_happy',
        condition: { type: 'affection' as const, operator: 'gte', value: 60 },
        label: '我是你的老朋友',
      },
      {
        id: 'branch_2',
        targetNodeId: 'node_surprised',
        condition: { type: 'time' as const, operator: 'gt', value: 18 },
        label: '这么晚了怎么还在？',
      },
      {
        id: 'branch_3',
        targetNodeId: 'node_story',
        condition: { type: 'story' as const, operator: 'eq', value: 'quest_done' },
        label: '任务完成了',
      },
      {
        id: 'branch_4',
        targetNodeId: 'node_neutral',
        label: '是的，第一次来',
      },
    ],
  };

  const node2 = {
    id: 'node_happy',
    speaker: 'npc' as const,
    text: '哎呀，是你啊！好久不见，最近过得怎么样？我还以为你把我忘了呢～',
    expression: 'happy' as const,
    position: { x: 50, y: 240 },
    branches: [],
  };

  const node3 = {
    id: 'node_surprised',
    speaker: 'npc' as const,
    text: '咦？都这么晚了还出门？小心小镇晚上有怪物出没哦，你可要小心点！',
    expression: 'surprised' as const,
    position: { x: 300, y: 240 },
    branches: [],
  };

  const node4 = {
    id: 'node_story',
    speaker: 'npc' as const,
    text: '什么？你已经完成了那个任务？！太厉害了！这是给你的奖励，收下吧！',
    expression: 'happy' as const,
    position: { x: 550, y: 240 },
    branches: [],
  };

  const node5 = {
    id: 'node_neutral',
    speaker: 'npc' as const,
    text: '这样啊...那我来给你介绍一下小镇吧。这里是杂货店，那边是旅馆...',
    expression: 'default' as const,
    position: { x: 300, y: 30 },
    branches: [],
  };

  return {
    nodes: [node1, node2, node3, node4, node5],
    startNodeId: 'node_start',
  };
}

const App: React.FC = () => {
  const [loading, setLoading] = useState<LoadingProgress>({
    total: 3, loaded: 0, percentage: 0, status: 'loading',
  });
  const [dialogueState, setDialogueState] = useState<DialogueState | null>(null);
  const [tree, setTree] = useState<DialogueTree>(createDefaultTree());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [typingSpeed, setTypingSpeed] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [affection, setAffection] = useState(50);
  const [gameTime, setGameTime] = useState(12);
  const [storyFlags, setStoryFlags] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(false);
  const resizeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = spriteManager.subscribeToProgress(setLoading);
    spriteManager.preloadAll();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = dialogueRuntime.subscribe((state) => {
      setDialogueState(state);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();

    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = window.setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartDialogue = useCallback(() => {
    dialogueRuntime.setTree(tree);
    dialogueRuntime.setTypingSpeed(typingSpeed);
    dialogueRuntime.startDialogue();
    setIsPlaying(true);
  }, [tree, typingSpeed]);

  const handleReset = useCallback(() => {
    dialogueRuntime.reset();
    setIsPlaying(false);
  }, []);

  const handleSkipTyping = useCallback(() => {
    dialogueRuntime.skipTyping();
  }, []);

  const handleSelectBranch = useCallback((branchId: string) => {
    dialogueRuntime.selectBranch(branchId);
  }, []);

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = Number(e.target.value);
    setTypingSpeed(speed);
    dialogueRuntime.setTypingSpeed(speed);
  };

  const handleAffectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAffection(val);
    gameStateManager.setAffection(val);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setGameTime(val);
    gameStateManager.setTime(val);
  };

  const toggleStoryFlag = (flag: string) => {
    const newFlags = storyFlags.includes(flag)
      ? storyFlags.filter((f) => f !== flag)
      : [...storyFlags, flag];
    setStoryFlags(newFlags);
    if (storyFlags.includes(flag)) {
      gameStateManager.removeStoryFlag(flag);
    } else {
      gameStateManager.addStoryFlag(flag);
    }
  };

  if (loading.status !== 'success') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#e2e8f0',
          letterSpacing: '2px',
        }}>
          像素对话系统
        </div>
        <div style={{
          width: '300px',
          height: '6px',
          backgroundColor: '#1e293b',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${loading.percentage}%`,
              backgroundColor: '#3b82f6',
              borderRadius: '6px',
              transition: 'width 0.8s ease-in-out',
            }}
          />
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          加载资源中 {loading.percentage}%
        </div>
        {loading.status === 'error' && (
          <button
            onClick={() => spriteManager.retryLoad()}
            style={{
              padding: '10px 24px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; }}
          >
            重新加载
          </button>
        )}
      </div>
    );
  }

  const currentExpression: ExpressionType = dialogueState?.currentExpression || 'default';
  const characterId = 'npc_alice';

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {isMobile && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155',
            cursor: 'pointer',
            color: '#e2e8f0',
            fontSize: '14px',
            fontWeight: 500,
          }}
          onClick={() => setEditorCollapsed(!editorCollapsed)}
        >
          <span>对话树编辑器</span>
          {editorCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      )}

      {(!isMobile || !editorCollapsed) && (
        <div
          style={{
            flex: isMobile ? 'none' : 0.6,
            minWidth: isMobile ? '100%' : '400px',
            width: isMobile ? '100%' : '600px',
            height: isMobile ? '50vh' : '100%',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <DialogueTreeEditor
            tree={tree}
            onChange={setTree}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>
      )}

      <div
        style={{
          flex: isMobile ? 1 : 0.4,
          minWidth: isMobile ? '100%' : '280px',
          width: isMobile ? '100%' : '320px',
          height: isMobile ? 'auto' : '100%',
          padding: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'auto',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <CharacterPortrait
            characterId={characterId}
            expression={currentExpression}
            width={280}
            height={280}
          />

          <div style={{
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '16px',
            boxSizing: 'border-box',
            cursor: dialogueState?.isTyping ? 'pointer' : 'default',
          }}
          onClick={handleSkipTyping}
          >
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#f472b6',
              marginBottom: '8px',
            }}>
              {dialogueState?.currentSpeaker === 'player' ? '玩家' : 'NPC 艾莉'}
            </div>
            <div style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#e2e8f0',
              minHeight: '60px',
            }}>
              {dialogueState?.displayedText || (
                <span style={{ color: '#64748b' }}>
                  {isPlaying ? '' : '点击"开始对话"按钮开始预览'}
                </span>
              )}
              {dialogueState?.isTyping && <span style={{ opacity: 0 }}>|</span>}
            </div>

            {dialogueState?.isTyping && (
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                marginTop: '8px',
              }}>
                点击跳过
              </div>
            )}
          </div>

          {dialogueState && dialogueState.availableBranches.length > 0 && !dialogueState.isTyping && (
            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {dialogueState.availableBranches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch.id)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#334155',
                    color: '#e2e8f0',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left',
                    transition: 'background-color 0.2s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {branch.label}
                </button>
              ))}
            </div>
          )}

          <div style={{
            width: '100%',
            display: 'flex',
            gap: '8px',
          }}>
            <button
              onClick={handleStartDialogue}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; }}
            >
              <Play size={16} />
              开始对话
            </button>
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                backgroundColor: '#334155',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#475569'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div style={{
          width: '100%',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '14px 16px',
          boxSizing: 'border-box',
        }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isMobile ? 'pointer' : 'default',
              marginBottom: showControls || !isMobile ? '12px' : 0,
            }}
            onClick={() => isMobile && setShowControls(!showControls)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#e2e8f0',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              <Settings size={16} color="#60a5fa" />
              速度控制
            </div>
            {isMobile && (
              showControls ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />
            )}
          </div>

          {(showControls || !isMobile) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>打印速度</span>
                  <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
                    {typingSpeed} ms/字
                  </span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={500}
                  value={typingSpeed}
                  onChange={handleSpeedChange}
                  style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #2563eb;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #2563eb;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
                  }
                `}</style>
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                }}>
                  <Heart size={14} color="#f472b6" />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>好感度: {affection}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={affection}
                  onChange={handleAffectionChange}
                  style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                }}>
                  <Clock size={14} color="#22c55e" />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>时间: {gameTime}:00</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={23}
                  value={gameTime}
                  onChange={handleTimeChange}
                  style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}>
                  <BookOpen size={14} color="#f97316" />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>剧情标记</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['quest_done', 'quest_started', 'day_3'].map((flag) => (
                    <button
                      key={flag}
                      onClick={() => toggleStoryFlag(flag)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: storyFlags.includes(flag) ? '#f97316' : '#334155',
                        color: storyFlags.includes(flag) ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {flag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
