import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { apiClient, createWebSocketConnection } from '../api/client';
import EditorCanvas from '../editor/EditorCanvas';
import NodeForm from '../editor/NodeForm';
import VariablePanel from '../editor/VariablePanel';
import GameEngine from '../game/GameEngine';
import type { Story } from '../types';

const EditorPage: React.FC = () => {
  const { storyId } = useParams<{ storyId?: string }>();
  const navigate = useNavigate();

  const story = useGameStore((s) => s.story);
  const setStory = useGameStore((s) => s.setStory);
  const updateStory = useGameStore((s) => s.updateStory);
  const addNode = useGameStore((s) => s.addNode);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [publishModal, setPublishModal] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPanels, setShowPanels] = useState(true);
  const [activePanel, setActivePanel] = useState<'node' | 'variable'>('node');

  const wsRef = useRef<WebSocket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initStory = async () => {
      setLoading(true);
      try {
        if (storyId) {
          try {
            const data = await apiClient.getStory(storyId);
            setStory(data);
          } catch {
            const data = await apiClient.createStory({
              title: '未命名故事',
              author: ''
            });
            setStory(data);
            navigate(`/editor/${data.id}`, { replace: true });
          }
        } else {
          const data = await apiClient.createStory({
            title: '未命名故事',
            author: ''
          });
          setStory(data);
          navigate(`/editor/${data.id}`, { replace: true });
        }
      } catch (error) {
        const defaultStory: Story = {
          id: 'local-' + Date.now(),
          title: '未命名故事',
          author: '',
          coverImageUrl: '',
          playCount: 0,
          averageRating: 0,
          ratingCount: 0,
          createdAt: new Date().toISOString(),
          published: false,
          nodes: [
            {
              id: 'node-1',
              title: '开始场景',
              description: '在这里描述你的开场场景...',
              backgroundImageUrl: '',
              backgroundMusicUrl: '',
              variableRules: [],
              position: { x: 100, y: 100 },
              isStart: true
            }
          ],
          edges: [],
          variables: [],
          startNodeId: 'node-1'
        };
        setStory(defaultStory);
      } finally {
        setLoading(false);
      }
    };

    initStory();
  }, [storyId, setStory, navigate]);

  useEffect(() => {
    if (!storyId || !story) return;

    try {
      const ws = createWebSocketConnection(storyId);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'saved') {
            setIsSaving(false);
            setLastSaved(new Date());
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        // WebSocket error, fallback to REST
      };

      return () => {
        ws.close();
      };
    } catch {
      // WebSocket not available, use REST fallback
      return () => {};
    }
  }, [storyId, story?.id]);

  useEffect(() => {
    if (!story || loading) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        setIsSaving(true);
        ws.send(
          JSON.stringify({
            type: 'save',
            data: story,
            ts: Date.now()
          })
        );

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 1000);
      } else if (storyId && !storyId.startsWith('local-')) {
        setIsSaving(true);
        apiClient
          .updateStory(storyId, story)
          .then(() => {
            setLastSaved(new Date());
          })
          .catch(() => {
            // ignore
          })
          .finally(() => {
            setIsSaving(false);
          });
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [story, storyId, loading]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateStory({ title: e.target.value });
    },
    [updateStory]
  );

  const handleAuthorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateStory({ author: e.target.value });
    },
    [updateStory]
  );

  const handleAddNode = useCallback(() => {
    addNode();
  }, [addNode]);

  const handlePublish = useCallback(async () => {
    if (!story || !storyId || storyId.startsWith('local-')) return;

    setPublishing(true);
    try {
      const result = await apiClient.publishStory(storyId);
      setShortUrl(result.shortUrl);
      updateStory({ published: true, shortUrl: result.shortUrl });
      setPublishModal(true);
    } catch {
      alert('发布失败，请稍后重试');
    } finally {
      setPublishing(false);
    }
  }, [story, storyId, updateStory]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shortUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shortUrl]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading || !story) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎨</div>
          <p className="text-text-secondary">编辑器加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
      <header
        className="border-b border-accent/50 px-4 py-3 flex-shrink-0"
        style={{ backgroundColor: '#16213e' }}
      >
        <div className="max-w-full mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                to="/"
                className="text-text-secondary hover:text-highlight transition-colors duration-300 text-sm"
              >
                ← 返回
              </Link>
              <div className="h-6 w-px bg-accent/50" />
              <span className="text-highlight font-bold">✏️ 编辑器</span>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={story.title}
                  onChange={handleTitleChange}
                  placeholder="故事标题"
                  className="w-full px-4 py-2 rounded-lg bg-bg-main text-text-main border border-accent/50 focus:border-highlight transition-all duration-300 text-sm font-medium"
                />
              </div>
              <div className="w-full sm:w-40">
                <input
                  type="text"
                  value={story.author}
                  onChange={handleAuthorChange}
                  placeholder="作者名"
                  className="w-full px-4 py-2 rounded-lg bg-bg-main text-text-main border border-accent/50 focus:border-highlight transition-all duration-300 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-text-secondary px-3 py-2 rounded-lg bg-bg-main/50">
                {isSaving ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    保存中...
                  </>
                ) : lastSaved ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    已保存 {formatTime(lastSaved)}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-text-secondary" />
                    未保存
                  </>
                )}
              </div>

              <button
                onClick={handleAddNode}
                className="px-3 py-2 text-sm rounded-lg text-white transition-all duration-300 hidden sm:block"
                style={{ backgroundColor: '#0f3460' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e94560';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0f3460';
                }}
              >
                + 节点
              </button>

              <button
                onClick={handlePublish}
                disabled={publishing || !storyId || storyId.startsWith('local-')}
                className="px-4 py-2 text-sm rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#e94560' }}
              >
                {publishing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    发布中
                  </span>
                ) : story.published ? (
                  '已发布 ✓'
                ) : (
                  '🚀 发布'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-3 md:p-4 overflow-hidden">
        <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-4">
          <div className="min-h-[500px] xl:min-h-0 relative rounded-lg overflow-hidden">
            <div className="absolute top-3 left-3 z-10 flex gap-2 md:hidden">
              <button
                onClick={() => setShowPanels(!showPanels)}
                className="px-3 py-1.5 text-xs rounded-lg text-white shadow-card transition-all duration-300"
                style={{ backgroundColor: '#0f3460' }}
              >
                {showPanels ? '隐藏面板' : '显示面板'}
              </button>
              <button
                onClick={handleAddNode}
                className="px-3 py-1.5 text-xs rounded-lg text-white shadow-card transition-all duration-300"
                style={{ backgroundColor: '#e94560' }}
              >
                + 节点
              </button>
            </div>

            <div className="w-full h-full">
              <EditorCanvas />
            </div>

            <div
              className={`hidden xl:flex absolute right-3 top-3 flex-col gap-3 w-[280px] z-10 pointer-events-none`}
              style={{ maxHeight: 'calc(100% - 24px)' }}
            >
              <div className="pointer-events-auto flex-1 min-h-0" style={{ maxHeight: '55%' }}>
                <NodeForm />
              </div>
              <div className="pointer-events-auto flex-1 min-h-0" style={{ maxHeight: '45%' }}>
                <VariablePanel />
              </div>
            </div>

            {showPanels && (
              <div className="xl:hidden absolute inset-x-3 bottom-3 z-10 rounded-lg overflow-hidden pointer-events-auto shadow-card">
                <div className="flex border-b border-accent/50"
                  style={{ backgroundColor: '#16213e' }}
                >
                  <button
                    onClick={() => setActivePanel('node')}
                    className={`flex-1 py-2.5 text-xs font-medium transition-all duration-300 ${
                      activePanel === 'node'
                        ? 'text-highlight border-b-2 border-highlight'
                        : 'text-text-secondary hover:text-text-main'
                    }`}
                  >
                    📝 节点编辑
                  </button>
                  <button
                    onClick={() => setActivePanel('variable')}
                    className={`flex-1 py-2.5 text-xs font-medium transition-all duration-300 ${
                      activePanel === 'variable'
                        ? 'text-highlight border-b-2 border-highlight'
                        : 'text-text-secondary hover:text-text-main'
                    }`}
                  >
                    📊 变量管理
                  </button>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  {activePanel === 'node' ? <NodeForm /> : <VariablePanel />}
                </div>
              </div>
            )}
          </div>

          <div className="min-h-[500px] xl:min-h-0 rounded-lg overflow-hidden">
            <div className="w-full h-full">
              <GameEngine story={story} preview={true} />
            </div>
          </div>
        </div>
      </main>

      {publishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease]"
            style={{ backgroundColor: '#16213e' }}
          >
            <div className="p-6 border-b border-accent/50 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-1">发布成功！</h3>
              <p className="text-text-secondary text-sm">
                你的故事已发布，分享下方链接让更多玩家体验吧
              </p>
            </div>

            <div className="p-6">
              <label className="block text-xs text-text-secondary mb-2">分享链接</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shortUrl}
                  readOnly
                  className="flex-1 px-4 py-2.5 rounded-lg bg-bg-main text-text-main border border-accent/50 text-sm font-mono"
                />
                <button
                  onClick={handleCopyUrl}
                  className={`px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
                    copied ? 'bg-green-500' : ''
                  }`}
                  style={!copied ? { backgroundColor: '#e94560' } : {}}
                >
                  {copied ? '已复制 ✓' : '复制'}
                </button>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setPublishModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-text-main text-sm border border-accent/50 hover:border-highlight hover:bg-highlight/10 transition-all duration-300"
                >
                  继续编辑
                </button>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium text-center transition-all duration-300"
                  style={{ backgroundColor: '#0f3460' }}
                >
                  预览作品 →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default EditorPage;
