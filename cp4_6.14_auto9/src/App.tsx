import React, { useState, useEffect, useCallback, useRef } from 'react';
import Board from './Board';
import Modal from './Modal';
import { wsManager, generateId } from './websocket';
import { getRandomAvatarIndex, getAvatar, getRandomUserName } from './avatars';
import type {
  Board as BoardType,
  KanbanCard,
  Lane,
  WSMessage,
  CardMovePayload,
  CardAddPayload,
  CardUpdatePayload
} from './types';

const createInitialBoard = (userName: string, userAvatar: string): BoardType => {
  const now = Date.now();

  const sampleCards: KanbanCard[] = [
    {
      id: generateId(),
      title: '设计用户登录页面',
      description: '需要包含邮箱密码登录和第三方登录方式，注意移动端适配',
      assignee: '张伟',
      priority: 'high',
      dueDate: '2026-06-20',
      status: 'todo',
      lastEditor: '张伟',
      lastEditorAvatar: getAvatar(0),
      lastEditTime: now - 120000
    },
    {
      id: generateId(),
      title: '编写API接口文档',
      description: '使用Swagger规范编写，确保所有接口都有完整的参数说明和示例',
      assignee: '王芳',
      priority: 'medium',
      dueDate: '2026-06-25',
      status: 'todo',
      lastEditor: '王芳',
      lastEditorAvatar: getAvatar(1),
      lastEditTime: now - 3600000
    },
    {
      id: generateId(),
      title: '数据库表结构优化',
      description: '对用户表和订单表添加索引，优化查询性能',
      assignee: '刘洋',
      priority: 'high',
      dueDate: '2026-06-18',
      status: 'in_progress',
      lastEditor: '刘洋',
      lastEditorAvatar: getAvatar(3),
      lastEditTime: now - 60000
    },
    {
      id: generateId(),
      title: '实现拖拽排序功能',
      description: '使用HTML5原生拖拽API，支持跨列表移动',
      assignee: userName,
      priority: 'medium',
      dueDate: '2026-06-22',
      status: 'in_progress',
      lastEditor: userName,
      lastEditorAvatar: userAvatar,
      lastEditTime: now - 180000
    },
    {
      id: generateId(),
      title: '单元测试覆盖率达标',
      description: '核心模块测试覆盖率需达到80%以上',
      assignee: '陈静',
      priority: 'low',
      dueDate: '2026-06-30',
      status: 'todo',
      lastEditor: '陈静',
      lastEditorAvatar: getAvatar(4),
      lastEditTime: now - 7200000
    },
    {
      id: generateId(),
      title: '项目初始化配置',
      description: 'Vite + React + TypeScript + Tailwind CSS 基础配置完成',
      assignee: userName,
      priority: 'low',
      dueDate: '2026-06-10',
      status: 'done',
      lastEditor: userName,
      lastEditorAvatar: userAvatar,
      lastEditTime: now - 86400000
    },
    {
      id: generateId(),
      title: 'WebSocket连接模块',
      description: '实现断线重连、消息队列、事件派发等功能',
      assignee: '李娜',
      priority: 'high',
      dueDate: '2026-06-15',
      status: 'done',
      lastEditor: '李娜',
      lastEditorAvatar: getAvatar(2),
      lastEditTime: now - 172800000
    }
  ];

  const lanes: Lane[] = [
    {
      id: 'todo',
      title: '待办',
      cards: sampleCards.filter(c => c.status === 'todo')
    },
    {
      id: 'in_progress',
      title: '进行中',
      cards: sampleCards.filter(c => c.status === 'in_progress')
    },
    {
      id: 'done',
      title: '已完成',
      cards: sampleCards.filter(c => c.status === 'done')
    }
  ];

  return {
    id: 'board_1',
    title: '产品开发看板',
    lanes
  };
};

const App: React.FC = () => {
  const [currentUser] = useState(() => {
    const avatarIndex = getRandomAvatarIndex();
    return {
      id: wsManager.getClientId(),
      name: getRandomUserName(),
      avatarIndex,
      avatar: getAvatar(avatarIndex)
    };
  });

  const [board, setBoard] = useState<BoardType>(() =>
    createInitialBoard(currentUser.name, currentUser.avatar)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const recentMovesRef = useRef<CardMovePayload[]>([]);
  const recentUpdatesRef = useRef<CardUpdatePayload[]>([]);
  const recentAddsRef = useRef<CardAddPayload[]>([]);
  const [, forceUpdate] = useState(0);

  const triggerRefresh = useCallback(() => {
    forceUpdate(prev => prev + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (recentMovesRef.current.length > 0) {
        recentMovesRef.current = [];
        triggerRefresh();
      }
      if (recentUpdatesRef.current.length > 0) {
        recentUpdatesRef.current = [];
        triggerRefresh();
      }
      if (recentAddsRef.current.length > 0) {
        recentAddsRef.current = [];
        triggerRefresh();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [triggerRefresh]);

  useEffect(() => {
    wsManager.onConnect(() => {
      setIsWsConnected(true);
    });

    const handleCardMove = (message: WSMessage) => {
      const payload = message.payload as CardMovePayload;
      setBoard(prevBoard => {
        const newLanes = prevBoard.lanes.map(lane => ({ ...lane, cards: [...lane.cards] }));
        const fromLane = newLanes.find(l => l.id === payload.fromLaneId);
        const toLane = newLanes.find(l => l.id === payload.toLaneId);

        if (!fromLane || !toLane) return prevBoard;

        const cardIndex = fromLane.cards.findIndex(c => c.id === payload.cardId);
        if (cardIndex === -1) return prevBoard;

        const [card] = fromLane.cards.splice(cardIndex, 1);
        const updatedCard: KanbanCard = {
          ...card,
          status: payload.toLaneId,
          lastEditor: payload.lastEditor,
          lastEditorAvatar: payload.lastEditorAvatar,
          lastEditTime: message.timestamp
        };

        const insertIndex = Math.min(payload.newIndex, toLane.cards.length);
        if (payload.fromLaneId === payload.toLaneId) {
          const adjustedIndex = cardIndex < insertIndex ? insertIndex - 1 : insertIndex;
          toLane.cards.splice(adjustedIndex, 0, updatedCard);
        } else {
          toLane.cards.splice(insertIndex, 0, updatedCard);
        }

        recentMovesRef.current.push(payload);
        setTimeout(() => triggerRefresh(), 50);

        return { ...prevBoard, lanes: newLanes };
      });
    };

    const handleCardAdd = (message: WSMessage) => {
      const payload = message.payload as CardAddPayload;
      setBoard(prevBoard => {
        const newLanes = prevBoard.lanes.map(lane => ({ ...lane, cards: [...lane.cards] }));
        const lane = newLanes.find(l => l.id === payload.laneId);
        if (!lane) return prevBoard;

        lane.cards.push(payload.card);
        recentAddsRef.current.push(payload);
        setTimeout(() => triggerRefresh(), 50);

        return { ...prevBoard, lanes: newLanes };
      });
    };

    const handleCardUpdate = (message: WSMessage) => {
      const payload = message.payload as CardUpdatePayload;
      setBoard(prevBoard => {
        const newLanes = prevBoard.lanes.map(lane => ({
          ...lane,
          cards: lane.cards.map(c =>
            c.id === payload.card.id ? payload.card : c
          )
        }));
        recentUpdatesRef.current.push(payload);
        setTimeout(() => triggerRefresh(), 50);
        return { ...prevBoard, lanes: newLanes };
      });
    };

    const handleAddLane = (message: WSMessage) => {
      setBoard(prevBoard => {
        if (prevBoard.lanes.length >= 6) return prevBoard;
        const newLane: Lane = {
          id: message.payload.laneId,
          title: message.payload.title,
          cards: []
        };
        return {
          ...prevBoard,
          lanes: [...prevBoard.lanes, newLane]
        };
      });
    };

    const handleRemoveLane = (message: WSMessage) => {
      setBoard(prevBoard => {
        if (prevBoard.lanes.length <= 2) return prevBoard;
        return {
          ...prevBoard,
          lanes: prevBoard.lanes.filter(l => l.id !== message.payload.laneId)
        };
      });
    };

    const handleUpdateLaneTitle = (message: WSMessage) => {
      setBoard(prevBoard => ({
        ...prevBoard,
        lanes: prevBoard.lanes.map(l =>
          l.id === message.payload.laneId
            ? { ...l, title: message.payload.title }
            : l
        )
      }));
    };

    const unsub1 = wsManager.on('card:move', handleCardMove);
    const unsub2 = wsManager.on('card:add', handleCardAdd);
    const unsub3 = wsManager.on('card:update', handleCardUpdate);
    const unsub4 = wsManager.on('board:addLane', handleAddLane);
    const unsub5 = wsManager.on('board:removeLane', handleRemoveLane);
    const unsub6 = wsManager.on('board:updateLaneTitle', handleUpdateLaneTitle);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [triggerRefresh]);

  const handleCardMove = useCallback((
    fromLaneId: string,
    toLaneId: string,
    cardId: string,
    newIndex: number
  ) => {
    const payload: CardMovePayload = {
      cardId,
      fromLaneId,
      toLaneId,
      newIndex,
      lastEditor: currentUser.name,
      lastEditorAvatar: currentUser.avatar
    };

    wsManager.send('card:move', payload);

    setBoard(prevBoard => {
      const newLanes = prevBoard.lanes.map(lane => ({ ...lane, cards: [...lane.cards] }));
      const fromLane = newLanes.find(l => l.id === fromLaneId);
      const toLane = newLanes.find(l => l.id === toLaneId);

      if (!fromLane || !toLane) return prevBoard;

      const cardIndex = fromLane.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return prevBoard;

      const [card] = fromLane.cards.splice(cardIndex, 1);
      const updatedCard: KanbanCard = {
        ...card,
        status: toLaneId,
        lastEditor: currentUser.name,
        lastEditorAvatar: currentUser.avatar,
        lastEditTime: Date.now()
      };

      const insertIndex = Math.min(newIndex, toLane.cards.length);
      if (fromLaneId === toLaneId) {
        const adjustedIndex = cardIndex < insertIndex ? insertIndex - 1 : insertIndex;
        toLane.cards.splice(adjustedIndex, 0, updatedCard);
      } else {
        toLane.cards.splice(insertIndex, 0, updatedCard);
      }

      recentMovesRef.current.push(payload);
      setTimeout(() => triggerRefresh(), 50);

      return { ...prevBoard, lanes: newLanes };
    });
  }, [currentUser, triggerRefresh]);

  const handleCardAdd = useCallback((laneId: string, card: KanbanCard) => {
    const payload: CardAddPayload = { card, laneId };
    wsManager.send('card:add', payload);

    setBoard(prevBoard => {
      const newLanes = prevBoard.lanes.map(lane => ({ ...lane, cards: [...lane.cards] }));
      const lane = newLanes.find(l => l.id === laneId);
      if (!lane) return prevBoard;

      lane.cards.push(card);
      recentAddsRef.current.push(payload);
      setTimeout(() => triggerRefresh(), 50);

      return { ...prevBoard, lanes: newLanes };
    });
  }, [triggerRefresh]);

  const handleCardUpdate = useCallback((laneId: string, card: KanbanCard) => {
    const updatedCard: KanbanCard = {
      ...card,
      lastEditor: currentUser.name,
      lastEditorAvatar: currentUser.avatar,
      lastEditTime: Date.now()
    };

    const payload: CardUpdatePayload = { card: updatedCard, laneId };
    wsManager.send('card:update', payload);

    setBoard(prevBoard => ({
      ...prevBoard,
      lanes: prevBoard.lanes.map(lane => ({
        ...lane,
        cards: lane.cards.map(c =>
          c.id === card.id ? updatedCard : c
        )
      }))
    }));

    recentUpdatesRef.current.push(payload);
    setTimeout(() => triggerRefresh(), 50);
  }, [currentUser, triggerRefresh]);

  const handleLaneAdd = useCallback(() => {
    const laneId = `lane_${generateId()}`;
    const titles = ['待评审', '已阻塞', '待测试', '已上线', '待发布'];
    const existingTitles = board.lanes.map(l => l.title);
    const availableTitle = titles.find(t => !existingTitles.includes(t)) || `新泳道 ${board.lanes.length + 1}`;

    wsManager.send('board:addLane', { laneId, title: availableTitle });

    setBoard(prevBoard => {
      if (prevBoard.lanes.length >= 6) return prevBoard;
      const newLane: Lane = {
        id: laneId,
        title: availableTitle,
        cards: []
      };
      return {
        ...prevBoard,
        lanes: [...prevBoard.lanes, newLane]
      };
    });
  }, [board.lanes]);

  const handleLaneRemove = useCallback((laneId: string) => {
    wsManager.send('board:removeLane', { laneId });
    setBoard(prevBoard => {
      if (prevBoard.lanes.length <= 2) return prevBoard;
      return {
        ...prevBoard,
        lanes: prevBoard.lanes.filter(l => l.id !== laneId)
      };
    });
  }, []);

  const handleLaneTitleUpdate = useCallback((laneId: string, title: string) => {
    wsManager.send('board:updateLaneTitle', { laneId, title });
    setBoard(prevBoard => ({
      ...prevBoard,
      lanes: prevBoard.lanes.map(l =>
        l.id === laneId ? { ...l, title } : l
      )
    }));
  }, []);

  const handleCardDoubleClick = useCallback((card: KanbanCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  }, []);

  const handleModalSave = useCallback((card: KanbanCard) => {
    if (!card.id) {
      const newCard: KanbanCard = {
        ...card,
        id: generateId(),
        lastEditor: currentUser.name,
        lastEditorAvatar: currentUser.avatar,
        lastEditTime: Date.now()
      };
      handleCardAdd(card.status, newCard);
    } else {
      const lane = board.lanes.find(l => l.cards.some(c => c.id === card.id));
      handleCardUpdate(lane?.id || card.status, card);
    }
    setIsModalOpen(false);
    setEditingCard(null);
  }, [currentUser, board.lanes, handleCardAdd, handleCardUpdate]);

  const totalCards = board.lanes.reduce((sum, lane) => sum + lane.cards.length, 0);

  return (
    <div className="h-screen flex flex-col bg-app-bg overflow-hidden">
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1.5" />
                <rect x="14" y="3" width="7" height="12" rx="1.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">{board.title}</h1>
              <p className="text-xs text-gray-400">
                {board.lanes.length} 个泳道 · {totalCards} 张卡片
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">
              {isWsConnected ? '实时同步中' : '离线模式'}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm avatar-online"
              style={{
                clipPath: 'circle(50% at 50% 50%)',
                boxShadow: '0 0 0 1px #ffffff'
              }}
            />
            <div>
              <p className="text-sm font-medium text-gray-700 leading-tight">{currentUser.name}</p>
              <p className="text-xs text-gray-400">当前用户</p>
            </div>
          </div>
        </div>
      </header>

      <Board
        board={board}
        onCardAdd={handleCardAdd}
        onCardMove={handleCardMove}
        onLaneAdd={handleLaneAdd}
        onLaneRemove={handleLaneRemove}
        onLaneTitleUpdate={handleLaneTitleUpdate}
        onCardDoubleClick={handleCardDoubleClick}
        moves={recentMovesRef.current}
        cardAdds={recentAddsRef.current}
        currentUserName={currentUser.name}
        currentUserAvatar={currentUser.avatar}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCard(null);
        }}
        onSave={handleModalSave}
        card={editingCard}
      />
    </div>
  );
};

export default App;
