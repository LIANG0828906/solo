import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Card, Connection, CardTag, ConnectionType } from './types';
import { api } from './api';
import { exportToJson, readJsonFile, validateProjectData, filterCards } from './utils';
import Canvas from './components/Canvas';
import CardEditor from './components/CardEditor';
import GraphViewer from './components/GraphViewer';
import { CARD_TAGS } from './types';
import './App.css';

const App: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'graph'>('canvas');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<CardTag[]>([]);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await api.getProject();
        setCards(data.cards);
        setConnections(data.connections);
      } catch (error) {
        console.error('加载项目数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, []);

  const handleCreateCard = useCallback(async () => {
    try {
      const newCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
        title: '新卡片',
        content: '',
        tags: [],
        priority: 'P2',
        position: { x: window.innerWidth / 2 - 120, y: window.innerHeight / 2 - 80 },
      };
      const created = await api.createCard(newCard);
      setCards(prev => [...prev, created]);
      setSelectedCardId(created.id);
      setShowEditor(true);
    } catch (error) {
      console.error('创建卡片失败:', error);
    }
  }, []);

  const handleUpdateCard = useCallback(async (card: Card) => {
    try {
      const updated = await api.updateCard(card.id, card);
      setCards(prev => prev.map(c => (c.id === card.id ? updated : c)));
      setShowEditor(false);
    } catch (error) {
      console.error('更新卡片失败:', error);
    }
  }, []);

  const handleDeleteCard = useCallback(async (id: string) => {
    try {
      await api.deleteCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
      setConnections(prev => prev.filter(c => c.sourceId !== id && c.targetId !== id));
      setSelectedCardId(null);
      setShowEditor(false);
    } catch (error) {
      console.error('删除卡片失败:', error);
    }
  }, []);

  const handleSelectCard = useCallback((id: string) => {
    setSelectedCardId(id);
    setShowEditor(true);
  }, []);

  const handleCreateConnection = useCallback(async (sourceId: string, targetId: string) => {
    const exists = connections.some(
      c => (c.sourceId === sourceId && c.targetId === targetId) ||
         (c.sourceId === targetId && c.targetId === sourceId)
    );
    if (exists) return;

    try {
      const newConnection: Omit<Connection, 'id' | 'createdAt'> = {
        sourceId,
        targetId,
        type: '关联',
      };
      const created = await api.createConnection(newConnection);
      setConnections(prev => [...prev, created]);
    } catch (error) {
      console.error('创建连接失败:', error);
    }
  }, [connections]);

  const handleUpdateConnection = useCallback(async (id: string, type: ConnectionType) => {
    try {
      const updated = await api.updateConnection(id, { type });
      setConnections(prev => prev.map(c => (c.id === id ? updated : c)));
    } catch (error) {
      console.error('更新连接失败:', error);
    }
  }, []);

  const handleDeleteConnection = useCallback(async (id: string) => {
    try {
      await api.deleteConnection(id);
      setConnections(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('删除连接失败:', error);
    }
  }, []);

  const handleMoveCard = useCallback(async (id: string, position: { x: number; y: number }) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, position } : c)));
    try {
      await api.updateCard(id, { position });
    } catch (error) {
      console.error('更新卡片位置失败:', error);
    }
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const data = await api.exportProject();
      exportToJson(data);
    } catch (error) {
      console.error('导出项目失败:', error);
    }
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readJsonFile(file);
      if (!validateProjectData(data)) {
        alert('无效的项目数据文件');
        return;
      }
      await api.updateProject(data);
      setCards(data.cards);
      setConnections(data.connections);
      alert('导入成功');
    } catch (error) {
      console.error('导入项目失败:', error);
      alert('导入失败');
    } finally {
      e.target.value = '';
    }
  }, []);

  const handleToggleTag = useCallback((tag: CardTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const handleViewMode = useCallback((mode: 'canvas' | 'graph') => {
    setViewMode(mode);
    setHighlightedCardId(null);
  }, []);

  const handleHighlightCard = useCallback((cardId: string) => {
    setHighlightedCardId(cardId);
    setViewMode('canvas');
    setSelectedCardId(cardId);
    setTimeout(() => setHighlightedCardId(null), 2000);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setSelectedCardId(null);
  }, []);

  const filteredCards = useMemo(() => {
    return filterCards(cards, searchKeyword, selectedTags);
  }, [cards, searchKeyword, selectedTags]);

  const selectedCard = useMemo(() => {
    return cards.find(c => c.id === selectedCardId) || null;
  }, [cards, selectedCardId]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="app">
      <header className="toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            className="search-input"
            placeholder="搜索卡片..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <div className="tag-filter">
            {CARD_TAGS.map(tag => (
              <button
                key={tag}
                className={`tag-filter-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleToggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'canvas' ? 'active' : ''}`}
              onClick={() => handleViewMode('canvas')}
            >
              画布
            </button>
            <button
              className={`view-btn ${viewMode === 'graph' ? 'active' : ''}`}
              onClick={() => handleViewMode('graph')}
            >
              图谱
            </button>
          </div>
          <button className="btn btn-create" onClick={handleCreateCard}>
            + 新建卡片
          </button>
          <button className="btn btn-export" onClick={handleExport}>
            导出
          </button>
          <button className="btn btn-import" onClick={handleImport}>
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </header>

      <main className="main-content">
        {viewMode === 'canvas' ? (
          <Canvas
            cards={filteredCards}
            connections={connections}
            selectedCardId={selectedCardId}
            highlightedCardId={highlightedCardId}
            searchKeyword={searchKeyword}
            onSelectCard={handleSelectCard}
            onMoveCard={handleMoveCard}
            onCreateConnection={handleCreateConnection}
            onUpdateConnection={handleUpdateConnection}
            onDeleteConnection={handleDeleteConnection}
          />
        ) : (
          <GraphViewer
            cards={filteredCards}
            connections={connections}
            onHighlightCard={handleHighlightCard}
          />
        )}
      </main>

      {showEditor && (
        <CardEditor
          card={selectedCard}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
};

export default App;
