import { useState, useRef, useEffect } from 'react';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp, BookPlus } from 'lucide-react';
import { useStore } from '@/store/index';
import type { BookList } from '@/types';

const TYPE_MAP: Record<BookList['type'], { label: string; color: string }> = {
  want: { label: '想读', color: 'bg-orange/10 text-orange-dark' },
  reading: { label: '在读', color: 'bg-green-heatmap-1 text-green-heatmap-4' },
  read: { label: '已读', color: 'bg-blue-50 text-blue-600' },
};

export default function BookListManager() {
  const { bookLists: items, bookListsLoading: loading, fetchBookLists, createBookList, deleteBookList, addBookToList, reorderLists, books: recommendations } = useStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<BookList['type']>('want');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchBookLists();
  }, [fetchBookLists]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createBookList({ name: newName.trim(), type: newType });
    setNewName('');
    setNewType('want');
    setShowCreateForm(false);
  };

  const handleCancelCreate = () => {
    setNewName('');
    setNewType('want');
    setShowCreateForm(false);
  };

  const handleDelete = async (id: string) => {
    await deleteBookList(id);
    setDeleteConfirmId(null);
  };

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (dropIndex: number) => {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, moved);

    const orders = newItems.map((item, i) => ({ id: item.id, order: i }));
    await reorderLists(orders);

    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleAddBook = async (listId: string, bookId: string) => {
    await addBookToList(listId, bookId);
    setAddingToListId(null);
  };

  const getAvailableBooks = (listId: string) => {
    const list = items.find((l) => l.id === listId);
    if (!list) return recommendations;
    const existingIds = new Set(list.books.map((b) => b.id));
    return recommendations.filter((b) => !existingIds.has(b.id));
  };

  const firstBookCover = (list: BookList) => {
    if (list.books.length > 0 && list.books[0].cover) return list.books[0].cover;
    if (list.cover) return list.cover;
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        加载中...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-serif text-text">我的书单</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-orange text-white text-sm rounded-lg hover:bg-orange-dark transition-colors"
        >
          <Plus size={16} />
          新建书单
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 border border-orange-light">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="书单名称"
            className="w-full px-3 py-2 border border-cream-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-light"
            autoFocus
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as BookList['type'])}
            className="w-full px-3 py-2 border border-cream-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-light"
          >
            <option value="want">想读</option>
            <option value="reading">在读</option>
            <option value="read">已读</option>
          </select>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancelCreate}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 text-sm bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"
            >
              创建
            </button>
          </div>
        </div>
      )}

      {items.map((list, index) => {
        const isExpanded = expandedIds.has(list.id);
        const isDragOver = dragOverIndex === index;
        const typeInfo = TYPE_MAP[list.type];

        return (
          <div
            key={list.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-xl shadow-sm transition-all ${
              isDragOver ? 'border-t-2 border-t-orange-400' : ''
            }`}
            style={{ opacity: dragIndexRef.current === index ? 0.5 : 1 }}
          >
            <div
              className="flex items-center gap-3 p-4 cursor-pointer"
              onClick={() => toggleExpand(list.id)}
            >
              <div
                className="cursor-grab active:cursor-grabbing text-text-muted/50 hover:text-text-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical size={18} />
              </div>

              {firstBookCover(list) ? (
                <img
                  src={firstBookCover(list)}
                  alt={list.name}
                  className="w-10 h-14 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-14 bg-cream-dark/30 rounded flex items-center justify-center text-text-muted/50">
                  <BookPlus size={18} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text truncate">{list.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">{list.books.length} 本书</p>
              </div>

              <div className="flex items-center gap-2">
                {deleteConfirmId === list.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(list.id)}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      确认
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-xs px-2 py-1 bg-cream-dark/30 text-text-light rounded hover:bg-cream-dark transition-colors"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(list.id);
                    }}
                    className="text-text-muted/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {isExpanded ? (
                  <ChevronUp size={18} className="text-text-muted" />
                ) : (
                  <ChevronDown size={18} className="text-text-muted" />
                )}
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-4 pb-4 space-y-2">
                {list.books.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">暂无书籍</p>
                )}

                {list.books.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream-dark/20 transition-colors"
                  >
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-8 h-11 object-cover rounded"
                      />
                    ) : (
                      <div className="w-8 h-11 bg-cream-dark/30 rounded flex items-center justify-center">
                        <BookPlus size={14} className="text-text-muted/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text truncate">{book.title}</p>
                      <p className="text-xs text-text-muted truncate">{book.author}</p>
                    </div>
                  </div>
                ))}

                <div className="relative pt-2">
                  {addingToListId === list.id ? (
                    <div className="border border-cream-dark rounded-lg bg-cream-dark/20 max-h-48 overflow-y-auto">
                      {getAvailableBooks(list.id).length === 0 ? (
                        <p className="text-sm text-text-muted text-center py-3">暂无可添加的书籍</p>
                      ) : (
                        getAvailableBooks(list.id).map((book) => (
                          <button
                            key={book.id}
                            onClick={() => handleAddBook(list.id, book.id)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-cream-dark/30 transition-colors text-left"
                          >
                            {book.cover ? (
                              <img
                                src={book.cover}
                                alt={book.title}
                                className="w-7 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-7 h-10 bg-cream-dark rounded" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-text truncate">{book.title}</p>
                              <p className="text-xs text-text-muted truncate">{book.author}</p>
                            </div>
                          </button>
                        ))
                      )}
                      <button
                        onClick={() => setAddingToListId(null)}
                        className="w-full text-center text-xs text-text-muted py-2 hover:text-text-light transition-colors"
                      >
                        关闭
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToListId(list.id)}
                      className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      <BookPlus size={16} />
                      添加书籍
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {items.length === 0 && !showCreateForm && (
        <div className="text-center py-16 text-text-muted">
          <BookPlus size={40} className="mx-auto mb-3 opacity-40" />
          <p>还没有书单，点击上方按钮创建</p>
        </div>
      )}
    </div>
  );
}
