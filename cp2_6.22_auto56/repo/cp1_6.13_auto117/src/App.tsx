import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Board, Card, SortOrder } from './types';
import BoardList from './components/BoardList';
import CardList from './components/CardList';
import DigestCard from './components/DigestCard';
import './styles.css';

type View = 'boards' | 'cards';

export default function App() {
  const [view, setView] = useState<View>('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [randomCard, setRandomCard] = useState<Card | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showEditBoard, setShowEditBoard] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [showDeleteBoardConfirm, setShowDeleteBoardConfirm] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showDeleteCardConfirm, setShowDeleteCardConfirm] = useState(false);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      const res = await axios.get<Board[]>('/api/boards');
      setBoards(res.data);
    } catch (e) {
      console.error('获取主题板失败', e);
    }
  }, []);

  const fetchCards = useCallback(async (boardId: string) => {
    try {
      const res = await axios.get<Card[]>(`/api/boards/${boardId}/cards`);
      setCards(res.data);
    } catch (e) {
      console.error('获取卡片失败', e);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const enterBoard = (board: Board) => {
    setCurrentBoard(board);
    setView('cards');
    setFilterTag(null);
    setSortOrder('desc');
    fetchCards(board.id);
  };

  const goBack = () => {
    setView('boards');
    setCurrentBoard(null);
    setFilterTag(null);
    setCards([]);
  };

  const handleCreateBoard = async (name: string) => {
    try {
      await axios.post<Board>('/api/boards', { name });
      await fetchBoards();
      setShowCreateBoard(false);
    } catch (e) {
      console.error('创建主题板失败', e);
    }
  };

  const handleEditBoard = async (name: string) => {
    if (!editingBoard) return;
    try {
      await axios.put(`/api/boards/${editingBoard.id}`, { name });
      await fetchBoards();
      if (currentBoard && currentBoard.id === editingBoard.id) {
        setCurrentBoard({ ...currentBoard, name });
      }
      setShowEditBoard(false);
      setEditingBoard(null);
    } catch (e) {
      console.error('编辑主题板失败', e);
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoard) return;
    try {
      await axios.delete(`/api/boards/${deletingBoard.id}`);
      await fetchBoards();
      if (currentBoard && currentBoard.id === deletingBoard.id) {
        goBack();
      }
      setShowDeleteBoardConfirm(false);
      setDeletingBoard(null);
    } catch (e) {
      console.error('删除主题板失败', e);
    }
  };

  const handleCreateCard = async (data: Omit<Card, 'id' | 'boardId' | 'createdAt'>) => {
    if (!currentBoard) return;
    try {
      await axios.post<Card>('/api/cards', { ...data, boardId: currentBoard.id });
      await fetchCards(currentBoard.id);
      await fetchBoards();
      setShowCardModal(false);
      setEditingCard(null);
    } catch (e) {
      console.error('创建卡片失败', e);
    }
  };

  const handleEditCard = async (data: Omit<Card, 'id' | 'boardId' | 'createdAt'>) => {
    if (!editingCard || !currentBoard) return;
    try {
      await axios.put(`/api/cards/${editingCard.id}`, data);
      await fetchCards(currentBoard.id);
      setShowCardModal(false);
      setEditingCard(null);
    } catch (e) {
      console.error('编辑卡片失败', e);
    }
  };

  const handleDeleteCard = async () => {
    if (!deletingCard || !currentBoard) return;
    try {
      await axios.delete(`/api/cards/${deletingCard.id}`);
      await fetchCards(currentBoard.id);
      await fetchBoards();
      setShowDeleteCardConfirm(false);
      setDeletingCard(null);
    } catch (e) {
      console.error('删除卡片失败', e);
    }
  };

  const handleRandom = async () => {
    try {
      let pool: Card[];
      if (currentBoard) {
        const res = await axios.get<Card[]>(`/api/boards/${currentBoard.id}/cards`);
        pool = res.data;
      } else {
        const res = await axios.get<Card[]>('/api/cards');
        pool = res.data;
      }
      if (pool.length === 0) {
        alert('还没有任何书摘卡片，快去添加吧！');
        return;
      }
      const idx = Math.floor(Math.random() * pool.length);
      setRandomCard(pool[idx]);
    } catch (e) {
      console.error('获取随机卡片失败', e);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRandomCard(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openEditBoardModal = (board: Board) => {
    setEditingBoard(board);
    setShowEditBoard(true);
  };

  const openDeleteBoardConfirm = (board: Board) => {
    setDeletingBoard(board);
    setShowDeleteBoardConfirm(true);
  };

  const openAddCardModal = () => {
    setEditingCard(null);
    setShowCardModal(true);
  };

  const openEditCardModal = (card: Card) => {
    setEditingCard(card);
    setShowCardModal(true);
  };

  const openDeleteCardConfirm = (card: Card) => {
    setDeletingCard(card);
    setShowDeleteCardConfirm(true);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-left" onClick={goBack} style={{ cursor: view === 'cards' ? 'pointer' : 'default' }}>
          {view === 'cards' && <span className="back-arrow">←</span>}
          <h1 className="app-title">我的书摘</h1>
        </div>
        <button className="random-btn" onClick={handleRandom}>
          ✨ 今日随机
        </button>
      </nav>

      <main className="main-content">
        {view === 'boards' && (
          <BoardList
            boards={boards}
            onEnter={enterBoard}
            onCreate={() => setShowCreateBoard(true)}
            onEdit={openEditBoardModal}
            onDelete={openDeleteBoardConfirm}
          />
        )}
        {view === 'cards' && currentBoard && (
          <CardList
            board={currentBoard}
            cards={cards}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onAddCard={openAddCardModal}
            onEditCard={openEditCardModal}
            onDeleteCard={openDeleteCardConfirm}
          />
        )}
      </main>

      {showCreateBoard && (
        <InputModal
          title="新建主题板"
          placeholder="请输入主题板名称"
          defaultValue=""
          maxLength={30}
          onClose={() => setShowCreateBoard(false)}
          onSubmit={handleCreateBoard}
        />
      )}

      {showEditBoard && editingBoard && (
        <InputModal
          title="编辑主题板"
          placeholder="请输入主题板名称"
          defaultValue={editingBoard.name}
          maxLength={30}
          onClose={() => { setShowEditBoard(false); setEditingBoard(null); }}
          onSubmit={handleEditBoard}
        />
      )}

      {showDeleteBoardConfirm && deletingBoard && (
        <ConfirmModal
          title="删除主题板"
          message={
            deletingBoard.cardCount && deletingBoard.cardCount > 0
              ? `确定要删除「${deletingBoard.name}」吗？板内 ${deletingBoard.cardCount} 张卡片也将被删除。`
              : `确定要删除「${deletingBoard.name}」吗？`
          }
          confirmText="删除"
          danger
          onClose={() => { setShowDeleteBoardConfirm(false); setDeletingBoard(null); }}
          onConfirm={handleDeleteBoard}
        />
      )}

      {showCardModal && (
        <CardModal
          initialData={editingCard}
          onClose={() => { setShowCardModal(false); setEditingCard(null); }}
          onSubmit={editingCard ? handleEditCard : handleCreateCard}
        />
      )}

      {showDeleteCardConfirm && deletingCard && (
        <ConfirmModal
          title="删除书摘卡片"
          message={`确定要删除《${deletingCard.title}》的书摘吗？`}
          confirmText="删除"
          danger
          onClose={() => { setShowDeleteCardConfirm(false); setDeletingCard(null); }}
          onConfirm={handleDeleteCard}
        />
      )}

      {randomCard && (
        <div className="random-overlay" onClick={() => setRandomCard(null)}>
          <div className="random-card-wrapper" onClick={(e) => e.stopPropagation()}>
            <DigestCard card={randomCard} mode="random" />
          </div>
        </div>
      )}
    </div>
  );
}

interface InputModalProps {
  title: string;
  placeholder: string;
  defaultValue: string;
  maxLength: number;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

function InputModal({ title, placeholder, defaultValue, maxLength, onClose, onSubmit }: InputModalProps) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById('modal-input') as HTMLInputElement | null;
      input?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content input-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className={`input-wrapper ${focused ? 'focused' : ''}`}>
          <input
            id="modal-input"
            type="text"
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
          <span className="char-count">{value.length}/{maxLength}</span>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!value.trim()} onClick={handleSubmit}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ title, message, confirmText, danger, onClose, onConfirm }: ConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CardModalProps {
  initialData: Card | null;
  onClose: () => void;
  onSubmit: (data: Omit<Card, 'id' | 'boardId' | 'createdAt'>) => void;
}

function CardModal({ initialData, onClose, onSubmit }: CardModalProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [author, setAuthor] = useState(initialData?.author ?? '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '');
  const [insight, setInsight] = useState(initialData?.insight ?? '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') ?? '');

  const handleSubmit = () => {
    if (!title.trim() || !excerpt.trim()) return;
    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    onSubmit({
      title: title.trim(),
      author: author.trim(),
      excerpt: excerpt.trim(),
      insight: insight.trim(),
      tags,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{initialData ? '编辑书摘卡片' : '添加书摘卡片'}</h3>
        <div className="form-group">
          <label>书名 <span className="required">*</span></label>
          <input
            type="text"
            value={title}
            placeholder="请输入书名"
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>作者</label>
          <input
            type="text"
            value={author}
            placeholder="请输入作者"
            maxLength={50}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>摘录内容 <span className="required">*</span></label>
          <textarea
            value={excerpt}
            placeholder="请输入摘录内容"
            maxLength={500}
            rows={5}
            onChange={(e) => setExcerpt(e.target.value)}
          />
          <div className="char-count-right">
            <span className={excerpt.length >= 450 ? 'warn' : ''}>{excerpt.length}/500</span>
          </div>
        </div>
        <div className="form-group">
          <label>个人感悟</label>
          <textarea
            value={insight}
            placeholder="请输入个人感悟"
            maxLength={200}
            rows={3}
            onChange={(e) => setInsight(e.target.value)}
          />
          <div className="char-count-right">
            <span className={insight.length >= 180 ? 'warn' : ''}>{insight.length}/200</span>
          </div>
        </div>
        <div className="form-group">
          <label>标签</label>
          <input
            type="text"
            value={tagsInput}
            placeholder="多个标签用逗号分隔，如：哲学,人生,思考"
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            className="btn btn-primary"
            disabled={!title.trim() || !excerpt.trim()}
            onClick={handleSubmit}
          >
            {initialData ? '保存' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
