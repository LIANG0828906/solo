import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { EditorBlock } from './components/EditorBlock';
import { Sidebar } from './components/Sidebar';
import { useWebSocket } from './hooks/useWebSocket';
import { extractOutline, toggleCollapse, findBlockTitle } from './utils/outline';
import type {
  Block,
  BlockType,
  WikiPage,
  CursorPosition,
  OutlineItem,
  Connection,
  VoteType,
  VoteCounts,
  VersionHistory,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

const DEMO_USER_NAMES = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];

function generateDemoPage(): WikiPage {
  const now = Date.now();
  return {
    id: 'demo-page-1',
    title: '团队知识管理最佳实践',
    blocks: [
      {
        id: uuidv4(),
        type: 'text',
        content: '# 团队知识管理最佳实践\n\n本文档旨在分享团队在知识沉淀、协同编辑方面的经验和方法论。',
        votes: { happy: 3, sad: 0, surprised: 1 },
        createdAt: now - 3600000,
        updatedAt: now - 1800000,
      },
      {
        id: uuidv4(),
        type: 'text',
        content: '## 一、为什么需要知识管理\n\n在快速发展的技术团队中，知识的有效沉淀和传递直接影响团队的整体效率和新人的成长速度。',
        votes: { happy: 5, sad: 0, surprised: 0 },
        createdAt: now - 3000000,
        updatedAt: now - 1200000,
      },
      {
        id: uuidv4(),
        type: 'code',
        content: '// 示例：团队规范的代码注释\n/**\n * 计算两个日期之间的天数差\n * @param date1 - 开始日期\n * @param date2 - 结束日期\n * @returns 天数差\n */\nfunction daysBetween(date1: Date, date2: Date): number {\n  const oneDay = 24 * 60 * 60 * 1000;\n  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));\n}',
        language: 'typescript',
        votes: { happy: 8, sad: 0, surprised: 2 },
        createdAt: now - 2400000,
        updatedAt: now - 600000,
      },
      {
        id: uuidv4(),
        type: 'text',
        content: '## 二、核心原则\n\n### 2.1 结构化优先\n\n所有知识文档都应该有清晰的结构，使用标题层级来组织内容。\n\n### 2.2 关联胜于独立\n\n知识点之间应该建立关联，形成知识网络，而不是孤立的文档。',
        votes: { happy: 4, sad: 1, surprised: 0 },
        createdAt: now - 1800000,
        updatedAt: now - 300000,
      },
      {
        id: uuidv4(),
        type: 'image',
        content: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
        votes: { happy: 2, sad: 0, surprised: 0 },
        createdAt: now - 1200000,
        updatedAt: now - 1200000,
      },
      {
        id: uuidv4(),
        type: 'text',
        content: '## 三、工具与流程\n\n选择合适的工具是知识管理成功的关键。本Wiki编辑器提供了块级编辑、实时协同、版本历史等核心功能。',
        votes: { happy: 6, sad: 0, surprised: 1 },
        createdAt: now - 600000,
        updatedAt: now - 60000,
      },
    ],
    connections: [],
    createdAt: now - 7200000,
    updatedAt: now,
  };
}

function generateDemoVersions(page: WikiPage): VersionHistory[] {
  const now = Date.now();
  return [
    {
      id: uuidv4(),
      pageId: page.id,
      version: 3,
      author: '李四',
      authorInitials: 'LS',
      timestamp: now - 300000,
      summary: '添加了工具与流程章节，补充了代码示例',
      snapshot: { ...page },
    },
    {
      id: uuidv4(),
      pageId: page.id,
      version: 2,
      author: '张三',
      authorInitials: 'ZS',
      timestamp: now - 1800000,
      summary: '完善了核心原则章节，增加了二级标题',
      snapshot: { ...page, blocks: page.blocks.slice(0, 4) },
    },
    {
      id: uuidv4(),
      pageId: page.id,
      version: 1,
      author: '王五',
      authorInitials: 'WW',
      timestamp: now - 3600000,
      summary: '创建文档，编写引言和背景介绍',
      snapshot: { ...page, blocks: page.blocks.slice(0, 2) },
    },
  ];
}

const App: React.FC = () => {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [versions, setVersions] = useState<VersionHistory[]>([]);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [newBlockId, setNewBlockId] = useState<string | null>(null);
  const [showBlockTypeMenu, setShowBlockTypeMenu] = useState<number | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [userVotes, setUserVotes] = useState<Map<string, VoteType>>(new Map());
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [connectionTooltip, setConnectionTooltip] = useState<{ x: number; y: number; title: string; targetBlockId: string } | null>(null);
  const [connectingFromBlock, setConnectingFromBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);

  const [touchDragBlockId, setTouchDragBlockId] = useState<string | null>(null);
  const [touchDragStartY, setTouchDragStartY] = useState(0);
  const [touchDragCurrentY, setTouchDragCurrentY] = useState(0);
  const [touchDropTargetIndex, setTouchDropTargetIndex] = useState<number | null>(null);

  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const userId = useMemo(() => uuidv4(), []);
  const userName = useMemo(() => DEMO_USER_NAMES[Math.floor(Math.random() * DEMO_USER_NAMES.length)], []);
  const userColor = useMemo(() => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)], []);

  const {
    connect,
    isConnected,
    onlineUsers,
    userInitials,
    sendBlockUpdate,
    sendBlockReorder,
    sendBlockCreate,
    sendBlockDelete,
    sendConnectionCreate,
    sendCursor,
    sendVote,
    sendRollback,
  } = useWebSocket('demo-page-1', userId, userName);

  useEffect(() => {
    const timer = setTimeout(() => {
      const demoPage = generateDemoPage();
      setPage(demoPage);
      setVersions(generateDemoVersions(demoPage));
      setOutline(extractOutline(demoPage.blocks));
      setLoading(false);

      const demoCursors: Map<string, CursorPosition> = new Map();
      const demoOtherUsers = DEMO_USER_NAMES.filter(n => n !== userName).slice(0, 2);
      demoOtherUsers.forEach((name, idx) => {
        const initials = name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
        demoCursors.set(`demo-user-${idx}`, {
          userId: `demo-user-${idx}`,
          userName: name,
          userInitials: initials,
          color: USER_COLORS[(idx + 3) % USER_COLORS.length],
          blockId: demoPage.blocks[idx % demoPage.blocks.length].id,
          offset: 10,
          x: 150 + idx * 100,
          y: 200 + idx * 150,
        });
      });
      setRemoteCursors(demoCursors);
    }, 500);

    return () => clearTimeout(timer);
  }, [userName]);

  useEffect(() => {
    if (page) {
      setOutline(extractOutline(page.blocks));
    }
  }, [page?.blocks]);

  useEffect(() => {
    if (touchDragBlockId && editorContainerRef.current && page) {
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const blockEls = blockRefs.current;
      let targetIdx: number | null = null;

      for (let i = 0; i < page.blocks.length; i++) {
        const el = blockEls.get(page.blocks[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const blockMidY = rect.top + rect.height / 2;
        if (touchDragCurrentY < blockMidY) {
          targetIdx = i;
          break;
        }
      }

      if (targetIdx === null && page.blocks.length > 0) {
        targetIdx = page.blocks.length - 1;
      }
      setTouchDropTargetIndex(targetIdx);
    }
  }, [touchDragCurrentY, touchDragBlockId, page]);

  const handlePageUpdate = useCallback((newPage: WikiPage) => {
    setPage(newPage);
  }, []);

  const handleBlockUpdated = useCallback((blockId: string, content: string, remoteUserId: string) => {
    if (remoteUserId === userId) return;
    setPage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b =>
          b.id === blockId ? { ...b, content, updatedAt: Date.now() } : b
        ),
      };
    });
  }, [userId]);

  const handleBlockReordered = useCallback((blockId: string, newIndex: number, remoteUserId: string) => {
    if (remoteUserId === userId) return;
    setPage(prev => {
      if (!prev) return prev;
      const blocks = [...prev.blocks];
      const oldIndex = blocks.findIndex(b => b.id === blockId);
      if (oldIndex === -1) return prev;
      const [block] = blocks.splice(oldIndex, 1);
      blocks.splice(newIndex, 0, block);
      return { ...prev, blocks, updatedAt: Date.now() };
    });
  }, [userId]);

  const handleBlockCreated = useCallback((block: Block, index: number, remoteUserId: string) => {
    if (remoteUserId === userId) return;
    setPage(prev => {
      if (!prev) return prev;
      const blocks = [...prev.blocks];
      blocks.splice(index, 0, block);
      return { ...prev, blocks, updatedAt: Date.now() };
    });
  }, [userId]);

  const handleBlockDeleted = useCallback((blockId: string, remoteUserId: string) => {
    if (remoteUserId === userId) return;
    setPage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.filter(b => b.id !== blockId),
        connections: prev.connections.filter(c => c.fromBlockId !== blockId && c.toBlockId !== blockId),
        updatedAt: Date.now(),
      };
    });
  }, [userId]);

  const handleConnectionCreated = useCallback((connection: Connection, remoteUserId: string) => {
    if (remoteUserId === userId) return;
    setPage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        connections: [...prev.connections, connection],
        updatedAt: Date.now(),
      };
    });
  }, [userId]);

  const handleCursorUpdate = useCallback((cursor: CursorPosition) => {
    setRemoteCursors(prev => {
      const next = new Map(prev);
      next.set(cursor.userId, cursor);
      return next;
    });
  }, []);

  const handleUserJoined = useCallback((_userId: string, name: string, _color: string) => {
    console.log('User joined:', name);
  }, []);

  const handleUserLeft = useCallback((leftUserId: string) => {
    setRemoteCursors(prev => {
      const next = new Map(prev);
      next.delete(leftUserId);
      return next;
    });
  }, []);

  const handleVoteUpdated = useCallback((blockId: string, votes: VoteCounts, remoteUserId: string) => {
    setPage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b =>
          b.id === blockId ? { ...b, votes } : b
        ),
      };
    });
  }, []);

  const handlePageRolledBack = useCallback((rolledBackPage: WikiPage, _remoteUserId: string) => {
    setPage(rolledBackPage);
    setShowVersionPanel(false);
  }, []);

  const handleContentChange = useCallback((blockId: string, content: string) => {
    setPage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b =>
          b.id === blockId ? { ...b, content, updatedAt: Date.now() } : b
        ),
        updatedAt: Date.now(),
      };
    });
    sendBlockUpdate(blockId, content);
  }, [sendBlockUpdate]);

  const handleBlockSaved = useCallback((blockId: string) => {
    console.log('Block saved:', blockId);
  }, []);

  const handleLanguageChange = useCallback((blockId: string, language: string) => {
    setPage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b =>
          b.id === blockId ? { ...b, language } : b
        ),
      };
    });
  }, []);

  const handleImageUpload = useCallback(async (_blockId: string, file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    setDraggingBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (blockId !== draggingBlockId) {
      setDragOverBlockId(blockId);
    }
  }, [draggingBlockId]);

  const handleDrop = useCallback((e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    const sourceBlockId = e.dataTransfer.getData('text/plain');

    if (sourceBlockId && sourceBlockId !== targetBlockId && page) {
      const blocks = [...page.blocks];
      const sourceIndex = blocks.findIndex(b => b.id === sourceBlockId);
      const targetIndex = blocks.findIndex(b => b.id === targetBlockId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const [block] = blocks.splice(sourceIndex, 1);
        blocks.splice(targetIndex, 0, block);

        setPage(prev => prev ? { ...prev, blocks, updatedAt: Date.now() } : prev);
        sendBlockReorder(sourceBlockId, targetIndex);
      }
    }

    setDraggingBlockId(null);
    setDragOverBlockId(null);
  }, [page, sendBlockReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggingBlockId(null);
    setDragOverBlockId(null);
  }, []);

  const handleTouchDragStart = useCallback((blockId: string, startY: number) => {
    setTouchDragBlockId(blockId);
    setTouchDragStartY(startY);
    setTouchDragCurrentY(startY);
  }, []);

  const handleTouchDragMove = useCallback((currentY: number) => {
    setTouchDragCurrentY(currentY);
  }, []);

  const handleTouchDragEnd = useCallback(() => {
    if (touchDragBlockId && page && touchDropTargetIndex !== null) {
      const sourceIndex = page.blocks.findIndex(b => b.id === touchDragBlockId);
      if (sourceIndex !== -1 && sourceIndex !== touchDropTargetIndex) {
        const blocks = [...page.blocks];
        const [block] = blocks.splice(sourceIndex, 1);
        const adjustedIndex = touchDropTargetIndex > sourceIndex
          ? touchDropTargetIndex - 1
          : touchDropTargetIndex;
        blocks.splice(adjustedIndex, 0, block);

        setPage(prev => prev ? { ...prev, blocks, updatedAt: Date.now() } : prev);
        sendBlockReorder(touchDragBlockId, adjustedIndex);
      }
    }

    setTouchDragBlockId(null);
    setTouchDragStartY(0);
    setTouchDragCurrentY(0);
    setTouchDropTargetIndex(null);
  }, [touchDragBlockId, touchDropTargetIndex, page, sendBlockReorder]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    if (!page || page.blocks.length <= 1) return;

    setPage(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.filter(b => b.id !== blockId),
        connections: prev.connections.filter(c => c.fromBlockId !== blockId && c.toBlockId !== blockId),
        updatedAt: Date.now(),
      };
    });

    sendBlockDelete(blockId);
  }, [page, sendBlockDelete]);

  const handleVote = useCallback(async (blockId: string, type: VoteType) => {
    setUserVotes(prev => {
      const next = new Map(prev);
      const currentVote = next.get(blockId);
      if (currentVote === type) {
        next.delete(blockId);
      } else {
        next.set(blockId, type);
      }
      return next;
    });

    if (page) {
      const block = page.blocks.find(b => b.id === blockId);
      if (block) {
        const currentVote = userVotes.get(blockId);
        const newVotes = { ...block.votes };

        if (currentVote) {
          newVotes[currentVote] = Math.max(0, newVotes[currentVote] - 1);
        }
        if (currentVote !== type) {
          newVotes[type] = newVotes[type] + 1;
        }

        setPage(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            blocks: prev.blocks.map(b =>
              b.id === blockId ? { ...b, votes: newVotes } : b
            ),
          };
        });

        sendVote(blockId, type);

        try {
          await axios.post(`${API_BASE}/pages/${page.id}/blocks/${blockId}/vote`, { type });
        } catch {
          console.warn('Vote API call failed, using WebSocket fallback');
        }
      }
    }
  }, [page, userVotes, sendVote]);

  const handleAddConnection = useCallback((fromBlockId: string) => {
    if (connectingFromBlock === null) {
      setConnectingFromBlock(fromBlockId);
      setTimeout(() => setConnectingFromBlock(null), 5000);
    } else if (connectingFromBlock !== fromBlockId && page) {
      const existingConnection = page.connections.find(
        c => c.fromBlockId === connectingFromBlock && c.toBlockId === fromBlockId
      );

      if (!existingConnection) {
        const connection: Connection = {
          id: uuidv4(),
          fromBlockId: connectingFromBlock,
          toBlockId: fromBlockId,
          createdAt: Date.now(),
        };

        setPage(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            connections: [...prev.connections, connection],
            updatedAt: Date.now(),
          };
        });

        sendConnectionCreate(connection);
      }
      setConnectingFromBlock(null);
    } else {
      setConnectingFromBlock(null);
    }
  }, [connectingFromBlock, page, sendConnectionCreate]);

  const handleAddBlock = useCallback((index: number, type: BlockType) => {
    if (!page) return;

    const newBlock: Block = {
      id: uuidv4(),
      type,
      content: type === 'code' ? '// 在这里输入代码...' : '',
      language: type === 'code' ? 'javascript' : undefined,
      votes: { happy: 0, sad: 0, surprised: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const blocks = [...page.blocks];
    blocks.splice(index, 0, newBlock);

    setPage(prev => prev ? { ...prev, blocks, updatedAt: Date.now() } : prev);
    setNewBlockId(newBlock.id);
    setShowBlockTypeMenu(null);

    setTimeout(() => setNewBlockId(null), 500);

    sendBlockCreate(newBlock, index);
  }, [page, sendBlockCreate]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setPage(prev => prev ? { ...prev, title, updatedAt: Date.now() } : prev);
  }, []);

  const handleOutlineItemClick = useCallback((blockId: string) => {
    setActiveBlockId(blockId);
    setMobileSidebarOpen(false);

    const blockEl = blockRefs.current.get(blockId);
    if (blockEl && editorContainerRef.current) {
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const blockRect = blockEl.getBoundingClientRect();
      const scrollTop = blockRect.top - containerRect.top + editorContainerRef.current.scrollTop - 100;
      editorContainerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }, []);

  const handleToggleCollapse = useCallback((itemId: string) => {
    setOutline(prev => toggleCollapse(prev, itemId));
  }, []);

  const handleRollback = useCallback(async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version && page) {
      setPage(version.snapshot);
      setShowVersionPanel(false);
      sendRollback(versionId);

      try {
        await axios.post(`${API_BASE}/pages/${page.id}/versions/${versionId}/rollback`);
      } catch {
        console.warn('Rollback API call failed, using WebSocket fallback');
      }
    }
  }, [versions, page, sendRollback]);

  const handleShowVersionPanel = useCallback(async () => {
    setShowVersionPanel(true);
    if (page) {
      try {
        const res = await axios.get(`${API_BASE}/pages/${page.id}/versions`);
        if (res.data && res.data.length > 0) {
          setVersions(res.data);
        }
      } catch {
        console.warn('Failed to fetch versions from API, using local versions');
      }
    }
  }, [page]);

  const handleConnectionHover = useCallback((e: React.MouseEvent, connection: Connection) => {
    if (!page) return;
    const title = findBlockTitle(page.blocks, connection.toBlockId);
    setConnectionTooltip({
      x: e.clientX + 10,
      y: e.clientY + 10,
      title: `引用: ${title}`,
      targetBlockId: connection.toBlockId,
    });
  }, [page]);

  const handleConnectionLeave = useCallback(() => {
    setConnectionTooltip(null);
  }, []);

  const handleJumpToBlock = useCallback((blockId: string) => {
    setActiveBlockId(blockId);
    setHighlightedBlockId(blockId);
    setConnectionTooltip(null);

    const blockEl = blockRefs.current.get(blockId);
    if (blockEl && editorContainerRef.current) {
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const blockRect = blockEl.getBoundingClientRect();
      const scrollTop = blockRect.top - containerRect.top + editorContainerRef.current.scrollTop - 100;
      editorContainerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    setTimeout(() => setHighlightedBlockId(null), 3000);
  }, []);

  const getConnectionPath = useCallback((connection: Connection): string => {
    const fromEl = blockRefs.current.get(connection.fromBlockId);
    const toEl = blockRefs.current.get(connection.toBlockId);
    const container = editorContainerRef.current;

    if (!fromEl || !toEl || !container) return '';

    const containerRect = container.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const x1 = fromRect.right - containerRect.left - 20;
    const y1 = fromRect.top - containerRect.top + fromRect.height / 2 + container.scrollTop;
    const x2 = toRect.left - containerRect.left + 20;
    const y2 = toRect.top - containerRect.top + toRect.height / 2 + container.scrollTop;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const curveOffset = Math.min(Math.abs(y2 - y1) * 0.3, 100);

    return `M ${x1} ${y1} Q ${midX} ${midY - curveOffset}, ${x2} ${y2}`;
  }, []);

  const renderConnectionLines = useCallback(() => {
    if (!page || page.connections.length === 0) return null;

    return (
      <svg className="connections-svg">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-color)" />
          </marker>
        </defs>
        {page.connections.map((connection) => (
          <path
            key={connection.id}
            className="connection-line"
            d={getConnectionPath(connection)}
            markerEnd="url(#arrowhead)"
            onMouseEnter={(e) => handleConnectionHover(e, connection)}
            onMouseMove={(e) => handleConnectionHover(e, connection)}
            onMouseLeave={handleConnectionLeave}
          />
        ))}
      </svg>
    );
  }, [page, getConnectionPath, handleConnectionHover, handleConnectionLeave]);

  const renderRemoteCursors = useCallback(() => {
    return Array.from(remoteCursors.values()).map((cursor) => (
      <div
        key={cursor.userId}
        className="remote-cursor"
        style={{
          left: cursor.x,
          top: cursor.y,
        }}
      >
        <div
          className="remote-cursor-dot"
          style={{ backgroundColor: cursor.color }}
        />
        <div
          className="remote-cursor-label"
          style={{ backgroundColor: cursor.color }}
        >
          {cursor.userInitials}
        </div>
      </div>
    ));
  }, [remoteCursors]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="app-container">
        <div className="loading">页面加载失败</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        outline={outline}
        activeBlockId={activeBlockId}
        onItemClick={handleOutlineItemClick}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        currentUser={{ initials: userInitials, color: userColor }}
      />

      <div className="main-content">
        <header className="editor-header">
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <input
              type="text"
              className="page-title"
              value={page.title}
              onChange={handleTitleChange}
              placeholder="输入页面标题..."
            />
          </div>
          <div className="header-actions">
            <div className="online-users">
              <div
                className="user-avatar"
                style={{ backgroundColor: userColor }}
                title={userName}
              >
                {userInitials}
              </div>
              {Array.from(onlineUsers.entries()).slice(0, 3).map(([id, user]) => (
                <div
                  key={id}
                  className="user-avatar"
                  style={{ backgroundColor: user.color }}
                  title={user.userName}
                >
                  {user.userInitials}
                </div>
              ))}
              {Array.from(remoteCursors.values()).slice(0, 2).map((cursor) => (
                <div
                  key={cursor.userId}
                  className="user-avatar"
                  style={{ backgroundColor: cursor.color }}
                  title={cursor.userName}
                >
                  {cursor.userInitials}
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="editor-container" ref={editorContainerRef}>
          <div className="editor-content">
            {renderConnectionLines()}
            {renderRemoteCursors()}

            {connectingFromBlock && (
              <div style={{
                position: 'sticky',
                top: '10px',
                backgroundColor: 'rgba(139, 115, 85, 0.9)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                textAlign: 'center',
                zIndex: '10',
                marginBottom: '16px',
                fontSize: '0.9rem',
              }}>
                🔗 请点击另一个块来创建关联，或再次点击当前块取消
              </div>
            )}

            {page.blocks.map((block, index) => {
              const isTouchDrag = touchDragBlockId === block.id;
              const dragDelta = isTouchDrag ? touchDragCurrentY - touchDragStartY : 0;
              const dragTransform = isTouchDrag ? `translateY(${dragDelta}px)` : undefined;
              const isTouchDropTarget = touchDropTargetIndex === index && touchDragBlockId !== null && touchDragBlockId !== block.id;

              return (
                <React.Fragment key={block.id}>
                  <EditorBlock
                    block={block}
                    isNew={block.id === newBlockId}
                    dragTransform={dragTransform}
                    isTouchDragging={isTouchDrag}
                    onContentChange={handleContentChange}
                    onBlockSaved={handleBlockSaved}
                    onImageUpload={handleImageUpload}
                    onLanguageChange={handleLanguageChange}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onTouchDragStart={handleTouchDragStart}
                    onTouchDragMove={handleTouchDragMove}
                    onTouchDragEnd={handleTouchDragEnd}
                    onDelete={handleDeleteBlock}
                    onVote={handleVote}
                    onAddConnection={handleAddConnection}
                    isDragging={block.id === draggingBlockId}
                    isDragOver={block.id === dragOverBlockId || isTouchDropTarget}
                    userVote={userVotes.get(block.id) || null}
                    blockRef={(el) => {
                      if (el) {
                        blockRefs.current.set(block.id, el);
                        if (highlightedBlockId === block.id) {
                          el.classList.add('block-highlighted');
                          setTimeout(() => el.classList.remove('block-highlighted'), 3000);
                        }
                      } else {
                        blockRefs.current.delete(block.id);
                      }
                    }}
                  />
                  {showBlockTypeMenu === index && (
                    <div className="block-type-menu">
                      <button
                        className="block-type-btn"
                        onClick={() => handleAddBlock(index + 1, 'text')}
                      >
                        <span className="block-type-icon">📝</span>
                        <span>文本</span>
                      </button>
                      <button
                        className="block-type-btn"
                        onClick={() => handleAddBlock(index + 1, 'image')}
                      >
                        <span className="block-type-icon">🖼️</span>
                        <span>图片</span>
                      </button>
                      <button
                        className="block-type-btn"
                        onClick={() => handleAddBlock(index + 1, 'code')}
                      >
                        <span className="block-type-icon">💻</span>
                        <span>代码</span>
                      </button>
                    </div>
                  )}
                  <button
                    className="add-block-btn"
                    onClick={() => setShowBlockTypeMenu(showBlockTypeMenu === index ? null : index)}
                  >
                    {showBlockTypeMenu === index ? '✕ 取消' : '+ 添加新块'}
                  </button>
                </React.Fragment>
              );
            })}

            <div className="editor-bottom-bar">
              <button
                className="version-history-btn"
                onClick={handleShowVersionPanel}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>版本历史</span>
                <span className="version-count-badge">{versions.length}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {connectionTooltip && (
        <div
          className="connection-tooltip"
          style={{
            left: connectionTooltip.x,
            top: connectionTooltip.y,
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>{connectionTooltip.title}</div>
          <button
            className="connection-jump-btn"
            onClick={() => handleJumpToBlock(connectionTooltip.targetBlockId)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            跳转到该块
          </button>
        </div>
      )}

      {showVersionPanel && (
        <div className="version-panel">
          <div className="version-panel-header">
            <h2 className="version-panel-title">📜 版本历史</h2>
            <button
              className="version-panel-close"
              onClick={() => setShowVersionPanel(false)}
            >
              ✕
            </button>
          </div>
          <div className="version-list">
            {versions.map((version) => (
              <div key={version.id} className="version-item">
                <div className="version-item-header">
                  <div
                    className="version-item-author"
                    style={{
                      backgroundColor: USER_COLORS[
                        DEMO_USER_NAMES.indexOf(version.author) % USER_COLORS.length
                      ] || '#8b7355',
                    }}
                  >
                    {version.authorInitials}
                  </div>
                  <div className="version-item-info">
                    <div className="version-item-name">{version.author}</div>
                    <div className="version-item-time">
                      {formatTime(version.timestamp)} · 版本 {version.version}
                    </div>
                  </div>
                </div>
                <div className="version-item-summary">
                  {version.summary.length > 30 ? version.summary.slice(0, 30) + '…' : version.summary}
                </div>
                <button
                  className="version-item-rollback"
                  onClick={() => handleRollback(version.id)}
                >
                  回滚到此版本
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="connection-mode-indicator">
        <div className={`connection-status ${isConnected ? '' : 'disconnected'}`} />
        <span>{isConnected ? '已连接' : '离线模式'}</span>
      </div>
    </div>
  );
};

export default App;
