import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, GitBranch } from 'lucide-react';
import { getRoomById, getStoryById } from '@/DataService';
import { cn } from '@/lib/utils';
import type { RoomMeta, StoryNode, SentimentType } from '@/types';

const NODE_COLORS: Record<SentimentType, string> = {
  neutral: '#1E3A5F',
  positive: '#2D6A4F',
  conflict: '#9B2335',
};

function getNodeColor(node: StoryNode): string {
  if (node.parentId === null) return '#1E3A5F';
  return NODE_COLORS[node.sentiment];
}

function collectPaths(nodes: StoryNode[], root: StoryNode): string[][] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const paths: string[][] = [];

  function dfs(currentId: string, acc: string[]): void {
    const node = nodeMap.get(currentId);
    if (!node) return;
    const next = [...acc, currentId];
    if (node.childrenIds.length === 0) {
      paths.push(next);
      return;
    }
    for (const childId of node.childrenIds) {
      dfs(childId, next);
    }
  }

  dfs(root.id, []);
  return paths;
}

export default function ReadingMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<RoomMeta | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string[] | null>(null);
  const [allPaths, setAllPaths] = useState<string[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [showBranchPicker, setShowBranchPicker] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    const roomData = getRoomById(id);
    if (!roomData) {
      navigate('/');
      return;
    }
    setRoom(roomData);
    const story = getStoryById(id);
    setNodes(story);
    const root = story.find(n => n.depth === 0);
    if (root) {
      const paths = collectPaths(story, root);
      setAllPaths(paths);
    }
  }, [id, navigate]);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const currentNode: StoryNode | undefined = currentPath ? nodeMap.get(currentPath[currentIndex]) : undefined;

  useEffect(() => {
    if (!isPlaying || !currentPath) return;

    timerRef.current = setTimeout(() => {
      if (currentIndex < currentPath.length - 1) {
        setShowBranchPicker(false);
        setDirection('next');
        setCurrentIndex(i => i + 1);
      } else {
        setIsPlaying(false);
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, currentPath]);

  const choosePath = (path: string[]) => {
    setCurrentPath(path);
    setCurrentIndex(0);
    setDirection(null);
    setIsPlaying(false);
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection('prev');
      setCurrentIndex(i => i - 1);
      setShowBranchPicker(false);
    }
  };

  const goNext = () => {
    if (!currentNode) return;
    if (currentNode.childrenIds.length === 0) return;

    if (currentNode.childrenIds.length >= 2) {
      setShowBranchPicker(true);
      setIsPlaying(false);
      return;
    }

    setDirection('next');
    setCurrentIndex(i => i + 1);
    setShowBranchPicker(false);
  };

  const pickBranch = (childId: string) => {
    if (!currentPath) return;
    const newPath: string[] = [...currentPath.slice(0, currentIndex + 1), childId];
    let cursorId = childId;
    while (true) {
      const n = nodeMap.get(cursorId);
      if (!n || n.childrenIds.length === 0) break;
      const pick = n.childrenIds[0];
      newPath.push(pick);
      cursorId = pick;
    }
    setCurrentPath(newPath);
    setCurrentIndex(currentIndex + 1);
    setDirection('next');
    setShowBranchPicker(false);
  };

  const togglePlay = () => {
    if (!currentPath) return;
    if (currentIndex >= currentPath.length - 1) return;
    setIsPlaying(p => !p);
    setShowBranchPicker(false);
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <header className="flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur border-b border-gray-100 sticky top-0 z-30">
        <Link
          to={`/story/${room.id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-[#1E3A5F] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">返回故事线</span>
        </Link>
        <h1 className="font-serif text-xl md:text-2xl font-bold text-[#2D2D2D] tracking-wide">
          阅读模式
        </h1>
        <div className="w-[140px]" />
      </header>

      {!currentPath ? (
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E3A5F]/5 text-[#1E3A5F] text-sm font-medium mb-4">
                <GitBranch size={16} />
                <span>共发现 {allPaths.length} 条叙事路径</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2D2D2D] mb-3">
                {room.title}
              </h2>
              <p className="text-gray-500">请选择一条路径开始你的阅读旅程</p>
            </div>

            <div className="space-y-3">
              {allPaths.length === 1 ? (
                <div className="text-center">
                  <button
                    onClick={() => choosePath(allPaths[0])}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8C] text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <Play size={20} />
                    <span>开始阅读（共 {allPaths[0].length} 段）</span>
                  </button>
                </div>
              ) : (
                allPaths.map((path, idx) => (
                  <button
                    key={idx}
                    onClick={() => choosePath(path)}
                    className="path-card w-full text-left p-5 rounded-2xl bg-white border border-gray-100 hover:border-[#1E3A5F]/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <span className="font-semibold text-[#2D2D2D]">路径 {idx + 1}</span>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#E8B94A]/15 text-[#8B6914] font-medium">
                        {path.length} 个节点
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed line-clamp-2 pl-11">
                      {path.map((nid, i) => {
                        const n = nodeMap.get(nid);
                        if (!n) return null;
                        if (i === 0) return n.content.substring(0, 60) + '…';
                        return null;
                      })}
                    </div>
                    <div className="mt-3 pl-11 flex items-center gap-1 flex-wrap">
                      {path.map((nid, i) => {
                        const n = nodeMap.get(nid);
                        if (!n) return null;
                        return (
                          <div
                            key={nid}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: getNodeColor(n),
                              opacity: 0.4 + (i / Math.max(path.length, 1)) * 0.6,
                            }}
                          />
                        );
                      })}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : currentNode ? (
        <div className="flex-1 flex flex-col px-6 py-8 pb-36">
          <div className="max-w-[720px] mx-auto w-full flex-1 flex flex-col">
            <div
              className={cn(
                'relative book-page rounded-3xl p-8 md:p-12 flex-1 overflow-hidden',
                direction === 'next' ? 'book-page-next' : '',
                direction === 'prev' ? 'book-page-prev' : ''
              )}
              key={`${currentPath?.join('-')}-${currentIndex}`}
              onAnimationEnd={() => setDirection(null)}
            >
              <div className="absolute left-4 md:left-6 top-8 flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: getNodeColor(currentNode) }}
                >
                  {currentNode.depth + 1}
                </div>
                <div className="flex flex-col items-center gap-1 mt-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                    style={{ backgroundColor: currentNode.author.avatarColor }}
                  >
                    {currentNode.author.name.charAt(0)}
                  </div>
                  <span className="text-[10px] text-gray-500 max-w-[52px] text-center leading-tight">
                    {currentNode.author.name}
                  </span>
                </div>
              </div>

              <div className="pl-16 md:pl-20">
                <p className="font-serif drop-cap text-[#2D2D2D] leading-[2] text-lg md:text-xl">
                  {currentNode.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {currentPath && currentNode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[500px] px-6">
          {showBranchPicker && currentNode.childrenIds.length >= 2 && (
            <div className="mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-xs font-semibold text-[#1E3A5F] mb-3 flex items-center gap-1.5">
                <GitBranch size={14} />
                选择下一分支
              </div>
              <div className="grid grid-cols-2 gap-3">
                {currentNode.childrenIds.map((cid, idx) => {
                  const child = nodeMap.get(cid);
                  if (!child) return null;
                  return (
                    <button
                      key={cid}
                      onClick={() => pickBranch(cid)}
                      className="text-left p-3 rounded-xl border border-gray-100 hover:border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/[0.02] transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getNodeColor(child) }}
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {idx === 0 ? '分支 A · 左' : '分支 B · 右'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {child.content.substring(0, 60)}…
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="control-bar-bg rounded-full shadow-xl px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  currentIndex === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-[#1E3A5F]/10 hover:text-[#1E3A5F]'
                )}
              >
                <ChevronLeft size={22} />
              </button>

              <button
                onClick={togglePlay}
                disabled={currentIndex >= currentPath.length - 1}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all',
                  currentIndex >= currentPath.length - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isPlaying
                      ? 'bg-[#9B2335] text-white hover:bg-[#7a1c2a]'
                      : 'bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8C] text-white hover:shadow-lg'
                )}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>

              <button
                onClick={goNext}
                disabled={currentIndex >= currentPath.length - 1}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  currentIndex >= currentPath.length - 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-[#1E3A5F]/10 hover:text-[#1E3A5F]'
                )}
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="mt-3 px-4">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                <span className="font-medium tabular-nums">
                  第 {currentIndex + 1} 段
                </span>
                <span className="tabular-nums text-gray-400">
                  / 共 {currentPath.length} 段
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {currentPath.map((nid, i) => {
                  const n = nodeMap.get(nid);
                  const isActive = i === currentIndex;
                  const isPassed = i < currentIndex;
                  return (
                    <div
                      key={nid}
                      className={cn(
                        'rounded-full transition-all',
                        isActive ? 'w-3 h-3' : 'w-1.5 h-1.5'
                      )}
                      style={{
                        backgroundColor: isActive
                          ? (n ? getNodeColor(n) : '#1E3A5F')
                          : isPassed
                            ? (n ? getNodeColor(n) : '#1E3A5F')
                            : '#D1D5DB',
                        opacity: isActive ? 1 : isPassed ? 0.55 : 1,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
