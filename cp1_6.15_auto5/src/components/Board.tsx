import { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import axios from 'axios';
import Card from './Card';
import TagFilter from './TagFilter';
import { getSocket } from '../utils/socket';
import type { RecipeCard, User, ToastMessage, CuisineType } from '../types';
import { CUISINE_TAGS } from '../types';
import styles from './Board.module.css';

interface BoardProps {
  cards: RecipeCard[];
  user: User;
  onCardAdd: (card: RecipeCard) => void;
  onReorder: (cards: RecipeCard[]) => void;
  onAnnotationAdd: (cardId: string, annotation: import('../types').Annotation) => void;
  addToast: (message: string, type?: ToastMessage['type']) => void;
}

function Board({ cards, user, onCardAdd, onReorder, onAnnotationAdd, addToast }: BoardProps) {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualImage, setManualImage] = useState('');
  const [manualCuisine, setManualCuisine] = useState<CuisineType>('家常菜');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const socket = getSocket();

  const filteredCards = useMemo(() => {
    let result = [...cards];
    if (activeFilter) {
      result = result.filter(card => card.cuisine === activeFilter);
    }
    return result.sort((a, b) => a.order - b.order);
  }, [cards, activeFilter]);

  const handleScrape = useCallback(async () => {
    if (!url.trim()) return;

    setIsScraping(true);
    try {
      const response = await axios.post('/api/scrape', { url: url.trim() });
      const { success, data, error } = response.data;

      if (success && data) {
        const newCard: RecipeCard = {
          id: Date.now().toString(),
          title: data.title,
          coverImage: data.coverImage,
          cuisine: '其他',
          url: url.trim(),
          order: cards.length,
          createdAt: Date.now(),
          annotations: [],
        };

        onCardAdd(newCard);
        socket.emit('card:add', { boardId: 'family-board', card: newCard, user });
        addToast(`成功添加「${newCard.title}」`, 'success');
        setUrl('');
      } else {
        throw new Error(error || '抓取失败');
      }
    } catch {
      addToast('自动抓取失败，请手动输入', 'warning');
      setShowManualForm(true);
    } finally {
      setIsScraping(false);
    }
  }, [url, cards.length, onCardAdd, socket, user, addToast]);

  const handleManualAdd = useCallback(() => {
    if (!manualTitle.trim()) return;

    const newCard: RecipeCard = {
      id: Date.now().toString(),
      title: manualTitle.trim(),
      coverImage: manualImage.trim() || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(manualTitle.trim())}&image_size=square_hd`,
      cuisine: manualCuisine,
      url: url.trim() || '#',
      order: cards.length,
      createdAt: Date.now(),
      annotations: [],
    };

    onCardAdd(newCard);
    socket.emit('card:add', { boardId: 'family-board', card: newCard, user });
    addToast(`成功添加「${newCard.title}」`, 'success');

    setShowManualForm(false);
    setManualTitle('');
    setManualImage('');
    setManualCuisine('家常菜');
    setUrl('');
  }, [manualTitle, manualImage, manualCuisine, url, cards.length, onCardAdd, socket, user, addToast]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = [...cards.sort((a, b) => a.order - b.order)];
    const reorderedItem = items[result.source.index];
    items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedCards = items.map((card, index) => ({ ...card, order: index }));

    onReorder(reorderedCards);
    socket.emit('card:reorder', { boardId: 'family-board', cards: reorderedCards, user });
  }, [cards, onReorder, socket, user]);

  const handleAnnotationAdd = useCallback((cardId: string, annotation: import('../types').Annotation) => {
    onAnnotationAdd(cardId, annotation);
    socket.emit('annotation:add', { boardId: 'family-board', cardId, annotation, user });
  }, [onAnnotationAdd, socket, user]);

  return (
    <div className={styles.board}>
      <div className={styles.inputSection}>
        <h2 className={styles.sectionTitle}>添加食谱灵感</h2>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.urlInput}
            placeholder="粘贴食谱网址，自动抓取标题和封面"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isScraping && handleScrape()}
            disabled={isScraping}
          />
          <button
            className={styles.scrapeBtn}
            onClick={handleScrape}
            disabled={isScraping || !url.trim()}
          >
            {isScraping ? '抓取中...' : '抓取食谱'}
          </button>
          <button
            className={styles.manualBtn}
            onClick={() => setShowManualForm(!showManualForm)}
          >
            {showManualForm ? '取消' : '手动添加'}
          </button>
        </div>

        {showManualForm && (
          <div className={styles.manualForm}>
            <input
              type="text"
              className={styles.manualInput}
              placeholder="食谱标题"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
            />
            <input
              type="text"
              className={styles.manualInput}
              placeholder="封面图片URL（可选）"
              value={manualImage}
              onChange={(e) => setManualImage(e.target.value)}
            />
            <select
              className={styles.manualSelect}
              value={manualCuisine}
              onChange={(e) => setManualCuisine(e.target.value as CuisineType)}
            >
              {CUISINE_TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <button className={styles.addBtn} onClick={handleManualAdd} disabled={!manualTitle.trim()}>
              添加卡片
            </button>
          </div>
        )}
      </div>

      <TagFilter
        tags={CUISINE_TAGS}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="cards" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles.cardGrid}
            >
              {filteredCards.map((card, index) => (
                <Draggable key={card.id} draggableId={card.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        transform: snapshot.isDragging
                          ? provided.draggableProps.style?.transform
                          : undefined,
                        transition: snapshot.isDragging
                          ? 'none'
                          : 'transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                      }}
                      className={`${styles.draggableWrapper} ${snapshot.isDragging ? styles.dragging : ''}`}
                    >
                      <Card
                        card={card}
                        user={user}
                        onAnnotationAdd={handleAnnotationAdd}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {filteredCards.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            {activeFilter ? '该分类暂无食谱' : '还没有添加任何食谱'}
          </p>
          <p className={styles.emptyHint}>
            {activeFilter ? '试试其他分类或添加新食谱吧' : '在上方输入网址或手动添加第一个食谱吧 🍳'}
          </p>
        </div>
      )}
    </div>
  );
}

export default Board;
