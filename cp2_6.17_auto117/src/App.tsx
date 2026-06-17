import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useKBStore } from './store';
import {
  Card,
  CardType,
  TagNode,
} from './modules/data';
import {
  calculateMasonryLayout,
  estimateCardHeight,
  formatDate,
  renderMarkdownShort,
  stripMarkdown,
  getCardTypeLabel,
  getAnimationDelay,
  truncateText,
} from './modules/ui';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const Icon = ({ name, style }: { name: string; style?: React.CSSProperties }) => {
  const icons: Record<string, React.ReactNode> = {
    search: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    ),
    close: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    ),
    plus: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    ),
    edit: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
    ),
    trash: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    ),
    export: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    ),
    import: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
    ),
    filter: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
    ),
    tag: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
    ),
    folder: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
    ),
    book: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
    ),
    check: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    ),
    chevron: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    ),
    empty: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
    ),
    copy: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    ),
    expand: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    ),
    collapse: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
    ),
  };
  return <span style={{ display: 'inline-flex', ...style }}>{icons[name] || null}</span>;
};

const TagTreeItem: React.FC<{
  tag: TagNode;
  level: number;
  selectedTags: string[];
  expandedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAddSubTag: (parentId: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  dragOverTagId: string | null;
}> = ({ tag, level, selectedTags, expandedIds, onToggleSelect, onToggleExpand, onAddSubTag, onDragOver, onDragLeave, onDrop, dragOverTagId }) => {
  const hasChildren = tag.children.length > 0;
  const expanded = expandedIds.has(tag.id);
  const selected = selectedTags.includes(tag.id);
  const isDragOver = dragOverTagId === tag.id;

  return (
    <li className="tag-item">
      <div
        className={`tag-row level-${level + 1} ${selected ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => onDragOver(e, tag.id)}
        onDragLeave={(e) => onDragLeave(e, tag.id)}
        onDrop={(e) => onDrop(e, tag.id)}
      >
        {hasChildren ? (
          <span
            className={`tag-expand ${expanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(tag.id);
            }}
          >
            <Icon name="chevron" />
          </span>
        ) : (
          <span className="tag-expand placeholder"></span>
        )}
        <span className="tag-icon">
          <Icon name={level === 0 ? 'folder' : 'tag'} />
        </span>
        <span className="tag-name" onClick={() => onToggleSelect(tag.id)}>
          {tag.name}
        </span>
        {selected ? (
          <button
            className="tag-remove"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(tag.id);
            }}
            title="取消选择"
          >
            <Icon name="close" />
          </button>
        ) : null}
        {level < 2 ? (
          <button
            className="tag-remove"
            style={{ opacity: 1, background: 'transparent', color: '#6C6C80' }}
            onClick={(e) => {
              e.stopPropagation();
              onAddSubTag(tag.id);
            }}
            title="添加子标签"
          >
            <Icon name="plus" />
          </button>
        ) : null}
      </div>
      {hasChildren ? (
        <ul className={`tag-children ${expanded ? 'expanded' : ''}`}>
          {tag.children.map((child) => (
            <TagTreeItem
              key={child.id}
              tag={child}
              level={level + 1}
              selectedTags={selectedTags}
              expandedIds={expandedIds}
              onToggleSelect={onToggleSelect}
              onToggleExpand={onToggleExpand}
              onAddSubTag={onAddSubTag}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              dragOverTagId={dragOverTagId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const CardEditorModal: React.FC<{
  card: Card | null;
  tags: TagNode[];
  onSave: (data: Partial<Card> & { title: string; content: string }) => void;
  onClose: () => void;
}> = ({ card, tags, onSave, onClose }) => {
  const [title, setTitle] = useState(card?.title || '');
  const [content, setContent] = useState(card?.content || '');
  const [type, setType] = useState<CardType>((card?.type as CardType) || 'note');
  const [selectedTags, setSelectedTags] = useState<string[]>(card?.tags || []);

  const flatTags: Array<{ tag: TagNode; level: number }> = useMemo(() => {
    const result: Array<{ tag: TagNode; level: number }> = [];
    const walk = (nodes: TagNode[], level: number) => {
      nodes.forEach((n) => {
        result.push({ tag: n, level });
        walk(n.children, level + 1);
      });
    };
    walk(tags, 0);
    return result;
  }, [tags]);

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ title: title.trim(), content: content.trim(), type, tags: selectedTags });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{card ? '编辑知识卡片' : '新建知识卡片'}</div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">标题 *</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入卡片标题"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">内容 * (支持 Markdown 短语法)</label>
              <textarea
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"使用 **粗体**、*斜体*、`代码`、[链接](url)、# 标题等"}
              />
              <div className="form-hint">支持 **粗体** / *斜体* / `行内代码` / [链接](url) / # 标题</div>
            </div>
            <div className="form-group">
              <label className="form-label">卡片类型</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as CardType)}
              >
                <option value="note">📝 笔记</option>
                <option value="bookmark">🔖 书签</option>
                <option value="inspiration">💡 灵感</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">标签 (可多选)</label>
              <div className="tags-picker">
                {flatTags.length === 0 ? (
                  <span style={{ fontSize: 12, color: '#6C6C80', padding: '4px 8px' }}>暂无标签，请先在左侧添加</span>
                ) : (
                  flatTags.map(({ tag, level }) => {
                    const selected = selectedTags.includes(tag.id);
                    return (
                      <span
                        key={tag.id}
                        className={`tag-option level-${level + 1} ${selected ? 'selected' : 'available'}`}
                        onClick={() => {
                          setSelectedTags((prev) =>
                            selected ? prev.filter((t) => t !== tag.id) : [...prev, tag.id],
                          );
                        }}
                      >
                        {tag.name}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSave}>
              {card ? '保存修改' : '创建卡片'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ImportModal: React.FC<{
  onImport: (json: string, onDup?: (card: Card) => 'overwrite' | 'skip') => any;
  onClose: () => void;
  onToast: (msg: string, type?: Toast['type']) => void;
}> = ({ onImport, onClose, onToast }) => {
  const [dragging, setDragging] = useState(false);
  const [duplicates, setDuplicates] = useState<Card[] | null>(null);
  const [pendingJson, setPendingJson] = useState<string>('');
  const [decisions, setDecisions] = useState<Record<string, 'overwrite' | 'skip'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        JSON.parse(json);
        setPendingJson(json);
        const preview = onImport(json, (card) => {
          if (!duplicates) {
            setTimeout(() => setDuplicates([card]), 0);
          }
          return 'skip';
        });
        if (preview.duplicates && preview.duplicates.length > 0) {
          setDuplicates(preview.duplicates);
        } else {
          onToast(`导入成功：新增 ${preview.added.length} 张卡片`, 'success');
          onClose();
        }
      } catch {
        onToast('JSON 文件格式错误', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) {
      handleFile(file);
    } else {
      onToast('请上传 .json 格式的文件', 'error');
    }
  };

  const finalizeImport = () => {
    const result = onImport(pendingJson, (card) => decisions[card.title] || 'skip');
    const added = result.added.length;
    const updated = result.updated.length;
    if (added || updated) {
      onToast(`导入完成：新增 ${added}，更新 ${updated}`, 'success');
    }
    onClose();
  };

  if (duplicates && duplicates.length > 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">发现同名卡片 ({duplicates.length})</div>
            <button className="modal-close" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: '#B0B0C0', marginBottom: 16 }}>
              以下卡片标题已存在，请选择处理方式：
            </p>
            {duplicates.map((d) => (
              <div key={d.title} className="duplicate-modal-item">
                <div className="duplicate-modal-info">
                  <div className="duplicate-modal-title">{truncateText(d.title, 40)}</div>
                  <div className="duplicate-modal-sub">类型: {getCardTypeLabel(d.type).label} · {formatDate(d.createdAt)}</div>
                </div>
                <div className="duplicate-modal-actions">
                  <button
                    className={`duplicate-modal-btn ${decisions[d.title] === 'overwrite' ? 'overwrite' : ''}`}
                    style={decisions[d.title] === 'overwrite' ? { background: 'rgba(108,99,255,0.15)', color: '#fff', borderColor: 'rgba(108,99,255,0.4)' } : {}}
                    onClick={() => setDecisions((p) => ({ ...p, [d.title]: 'overwrite' }))}
                  >
                    覆盖
                  </button>
                  <button
                    className={`duplicate-modal-btn skip ${decisions[d.title] === 'skip' ? 'active' : ''}`}
                    style={!decisions[d.title] || decisions[d.title] === 'skip' ? { background: 'rgba(255,101,132,0.1)', color: '#FF6584', borderColor: 'rgba(255,101,132,0.25)' } : {}}
                    onClick={() => setDecisions((p) => ({ ...p, [d.title]: 'skip' }))}
                  >
                    跳过
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>取消</button>
            <button
              className="btn btn-primary"
              onClick={finalizeImport}
              disabled={Object.keys(decisions).length < duplicates.length}
            >
              确认导入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">导入知识卡片</div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">
          <div
            className={`import-drop-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="import-icon">
              <Icon name="import" />
            </div>
            <div className="import-title">拖拽 JSON 文件到此处，或点击选择文件</div>
            <div className="import-desc">支持 .json 格式的知识库导出文件</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const {
    cards,
    tags,
    filteredCards,
    totalCount,
    resultCount,
    selectedCardIds,
    expandedTagIds,
    filters,
    isLoading,
    editingCard,
    showEditor,
    showFilterPanel,
    initData,
    setFilters,
    resetFilters,
    toggleTagSelection,
    toggleTagExpand,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    saveCard,
    removeCard,
    addCardTag,
    removeCardTag,
    addNewTag,
    toggleCardSelection,
    selectAllCards,
    clearCardSelection,
    setShowFilterPanel,
    doExport,
    doImport,
  } = useKBStore();

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dragOverTagId, setDragOverTagId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.keyword);
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const searchTimerRef = useRef<number | null>(null);

  const masonryContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    const updateWidth = () => {
      if (wrapperRef.current) {
        setContainerWidth(wrapperRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const toggleCardExpand = useCallback((cardId: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }, []);

  const handleCopyContent = useCallback((text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      addToast('已复制到剪贴板', 'success');
    }).catch(() => {
      addToast('复制失败', 'error');
    });
  }, [addToast]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      setFilters({ keyword: val });
    }, 250);
  };

  const masonry = useMemo(() => {
    const heights = filteredCards.map((c) => estimateCardHeight(c.title, c.content, c.tags.length));
    return calculateMasonryLayout(heights, containerWidth, 280, 20);
  }, [filteredCards, containerWidth]);

  const tagNameMap = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (nodes: TagNode[]) => {
      nodes.forEach((n) => {
        map.set(n.id, n.name);
        walk(n.children);
      });
    };
    walk(tags);
    return map;
  }, [tags]);

  const allFlatTags = useMemo(() => {
    const result: Array<{ tag: TagNode; level: number }> = [];
    const walk = (nodes: TagNode[], level: number) => {
      nodes.forEach((n) => {
        result.push({ tag: n, level });
        walk(n.children, level + 1);
      });
    };
    walk(tags, 0);
    return result;
  }, [tags]);

  const handleExport = () => {
    const json = doExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `knowledge-base-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const count = selectedCardIds.size || totalCount;
    addToast(`已导出 ${count} 张卡片`, 'success');
  };

  const handleAddRootTag = () => {
    const name = prompt('请输入新标签名称:');
    if (name && name.trim()) {
      addNewTag(null, name.trim());
      addToast('标签已添加', 'success');
    }
  };

  const handleAddSubTag = (parentId: string) => {
    const name = prompt('请输入子标签名称:');
    if (name && name.trim()) {
      addNewTag(parentId, name.trim());
      addToast('子标签已添加', 'success');
    }
  };

  const handleTagDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverTagId !== id) setDragOverTagId(id);
  };

  const handleTagDragLeave = (_e: React.DragEvent, id: string) => {
    if (dragOverTagId === id) setDragOverTagId(null);
  };

  const handleTagDrop = (e: React.DragEvent, tagId: string) => {
    e.preventDefault();
    setDragOverTagId(null);
    if (draggedCardId) {
      addCardTag(draggedCardId, tagId);
      addToast('已添加标签', 'success');
      setDraggedCardId(null);
    }
  };

  const handleDeleteCard = (id: string, title: string) => {
    if (confirm(`确定删除卡片"${truncateText(title, 30)}"吗？此操作不可恢复。`)) {
      removeCard(id);
      addToast('卡片已删除', 'success');
    }
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6C63FF', fontSize: 18, fontWeight: 500 }}>加载中...</div>
      </div>
    );
  }

  const dateFromStr = filters.dateFrom
    ? new Date(filters.dateFrom).toISOString().slice(0, 10)
    : '';
  const dateToStr = filters.dateTo
    ? new Date(filters.dateTo + 86400000 - 1).toISOString().slice(0, 10)
    : '';

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span className="sidebar-title-icon">
              <Icon name="book" />
            </span>
            知识库
          </div>
        </div>
        <div className="sidebar-tags-section">
          <div className="sidebar-tags-title">
            标签分类
            <button className="add-tag-btn" onClick={handleAddRootTag} title="添加顶级标签">
              <Icon name="plus" />
            </button>
          </div>
          <ul className="tag-tree">
            {tags.map((tag) => (
              <TagTreeItem
                key={tag.id}
                tag={tag}
                level={0}
                selectedTags={filters.tags}
                expandedIds={expandedTagIds}
                onToggleSelect={toggleTagSelection}
                onToggleExpand={toggleTagExpand}
                onAddSubTag={handleAddSubTag}
                onDragOver={handleTagDragOver}
                onDragLeave={handleTagDragLeave}
                onDrop={handleTagDrop}
                dragOverTagId={dragOverTagId}
              />
            ))}
            {tags.length === 0 && (
              <li style={{ padding: '12px 20px', fontSize: 12, color: '#6C6C80' }}>
                暂无标签，点击上方 + 添加
              </li>
            )}
          </ul>
        </div>
      </aside>

      <div className="content-area">
        <div className="topbar">
          <div className="search-bar">
            <span className="search-icon">
              <Icon name="search" />
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索标题、内容或标签..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchValue ? (
              <button
                className="search-clear"
                onClick={() => {
                  setSearchValue('');
                  setFilters({ keyword: '' });
                }}
              >
                <Icon name="close" />
              </button>
            ) : null}
          </div>
          <div className="topbar-actions">
            <button
              className={`action-btn ${showFilterPanel ? 'primary' : ''}`}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              title="高级筛选"
            >
              <span className="action-btn-icon">
                <Icon name="filter" />
              </span>
              筛选
            </button>
            <button className="action-btn" onClick={() => setShowImportModal(true)} title="导入卡片">
              <span className="action-btn-icon">
                <Icon name="import" />
              </span>
              导入
            </button>
            <button
              className="action-btn"
              onClick={handleExport}
              disabled={totalCount === 0}
              title="导出卡片"
            >
              <span className="action-btn-icon">
                <Icon name="export" />
              </span>
              导出
              {selectedCardIds.size > 0 && ` (${selectedCardIds.size})`}
            </button>
            <button className="action-btn primary" onClick={openCreateEditor}>
              <span className="action-btn-icon">
                <Icon name="plus" />
              </span>
              新建卡片
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="card-area">
            <div className="card-area-header">
              <div className="result-info">
                共 <strong>{totalCount}</strong> 张卡片
                {filters.keyword || filters.tags.length > 0 || filters.type !== 'all' || filters.dateFrom || filters.dateTo ? (
                  <>，匹配 <strong>{resultCount}</strong> 条结果</>
                ) : null}
              </div>
              <div className="result-actions">
                {selectedCardIds.size > 0 && (
                  <span className="selection-info">
                    已选择 {selectedCardIds.size} 张
                  </span>
                )}
                {filteredCards.length > 0 && (
                  <>
                    <button
                      className="action-btn"
                      style={{ padding: '5px 10px', fontSize: 12 }}
                      onClick={() => {
                        if (selectedCardIds.size === filteredCards.length) {
                          clearCardSelection();
                        } else {
                          selectAllCards();
                        }
                      }}
                    >
                      {selectedCardIds.size === filteredCards.length ? '取消全选' : '全选'}
                    </button>
                    {selectedCardIds.size > 0 && (
                      <button
                        className="action-btn danger"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => {
                          if (confirm(`确定删除选中的 ${selectedCardIds.size} 张卡片吗？`)) {
                            const ids = Array.from(selectedCardIds);
                            ids.forEach((id) => removeCard(id));
                            addToast(`已删除 ${ids.length} 张卡片`, 'success');
                          }
                        }}
                      >
                        删除选中
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="cards-container-wrapper">
              {filteredCards.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon name="empty" />
                  </div>
                  <div className="empty-title">
                    {totalCount === 0 ? '还没有任何知识卡片' : '没有匹配的结果'}
                  </div>
                  <div className="empty-desc">
                    {totalCount === 0
                      ? '点击"新建卡片"按钮开始记录您的知识'
                      : '尝试修改搜索关键词或筛选条件'}
                  </div>
                  {totalCount === 0 && (
                    <button className="action-btn primary" onClick={openCreateEditor}>
                      <span className="action-btn-icon">
                        <Icon name="plus" />
                      </span>
                      立即创建
                    </button>
                  )}
                </div>
              ) : (
                <div
                  ref={wrapperRef}
                  style={{ width: '100%', minHeight: masonry.totalHeight }}
                >
                  <div
                    ref={masonryContainerRef}
                    className="masonry-container"
                    style={{ height: masonry.totalHeight }}
                  >
                    {filteredCards.map((card, idx) => {
                      const pos = masonry.positions[idx];
                      if (!pos) return null;
                      const typeInfo = getCardTypeLabel(card.type);
                      const isSelected = selectedCardIds.has(card.id);
                      const isExpanded = expandedCardIds.has(card.id);
                      const plainContent = stripMarkdown(card.content);
                      const isLongContent = plainContent.length > 120;
                      return (
                        <div
                          key={card.id}
                          className={`kb-card ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                          style={{
                            left: pos.left,
                            top: pos.top,
                            width: masonry.columnWidth,
                            height: isExpanded ? 'auto' : pos.height,
                            animationDelay: getAnimationDelay(idx, 30),
                          }}
                          draggable={!isExpanded}
                          onDragStart={(e) => {
                            if (isExpanded) { e.preventDefault(); return; }
                            setDraggedCardId(card.id);
                            e.dataTransfer.effectAllowed = 'link';
                          }}
                          onDragEnd={() => setDraggedCardId(null)}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (
                              !target.closest('.card-checkbox') &&
                              !target.closest('.card-action-btn') &&
                              !target.closest('.card-tag-remove') &&
                              !target.closest('.card-expand-btn') &&
                              !target.closest('.card-copy-btn')
                            ) {
                              openEditEditor(card);
                            }
                          }}
                        >
                          <div
                            className="card-checkbox"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardSelection(card.id);
                            }}
                          >
                            {isSelected && <Icon name="check" />}
                          </div>
                          <div
                            className="card-type-badge"
                            style={{
                              background: `${typeInfo.color}1A`,
                              color: typeInfo.color,
                            }}
                          >
                            {typeInfo.label}
                          </div>
                          <button
                            className="card-copy-btn"
                            title="复制内容"
                            onClick={(e) => handleCopyContent(card.content, e)}
                          >
                            <Icon name="copy" />
                          </button>
                          <div className="card-title">{card.title}</div>
                          {isExpanded ? (
                            <div
                              className="card-content card-content-expanded"
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdownShort(card.content),
                              }}
                            />
                          ) : (
                            <div className="card-content">
                              {isLongContent
                                ? truncateText(plainContent, 120)
                                : plainContent}
                            </div>
                          )}
                          {isLongContent && (
                            <button
                              className="card-expand-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCardExpand(card.id);
                              }}
                            >
                              <Icon name={isExpanded ? 'collapse' : 'expand'} />
                              <span>{isExpanded ? '收起预览' : '展开预览'}</span>
                            </button>
                          )}
                          {card.tags.length > 0 && (
                            <div className="card-tags">
                              {card.tags.map((tid) => {
                                const tName = tagNameMap.get(tid);
                                if (!tName) return null;
                                return (
                                  <span key={tid} className="card-tag">
                                    {tName}
                                    <span
                                      className="card-tag-remove"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeCardTag(card.id, tid);
                                      }}
                                      title="移除标签"
                                    >
                                      <Icon name="close" />
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <div className="card-footer">
                            <span>{formatDate(card.updatedAt)}</span>
                            <div className="card-actions">
                              <button
                                className="card-action-btn"
                                title="编辑"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditEditor(card);
                                }}
                              >
                                <Icon name="edit" />
                              </button>
                              <button
                                className="card-action-btn delete"
                                title="删除"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCard(card.id, card.title);
                                }}
                              >
                                <Icon name="trash" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {showFilterPanel && (
            <div className="filter-panel">
              <div className="filter-panel-title">
                <Icon name="filter" />
                高级筛选
              </div>
              <div className="filter-section">
                <div className="filter-section-title">卡片类型</div>
                <div className="filter-type-options">
                  {[
                    { value: 'all', label: '全部类型', color: '#808090' },
                    { value: 'note', label: '笔记', color: '#6C63FF' },
                    { value: 'bookmark', label: '书签', color: '#4ECDC4' },
                    { value: 'inspiration', label: '灵感', color: '#FF6584' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`filter-type-btn ${filters.type === opt.value ? 'active' : ''}`}
                      onClick={() => setFilters({ type: opt.value as any })}
                    >
                      <span className="filter-type-dot" style={{ background: opt.color }}></span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-section">
                <div className="filter-section-title">创建时间</div>
                <label className="filter-date-label">从</label>
                <input
                  type="date"
                  className="filter-date-input"
                  value={dateFromStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFilters({ dateFrom: v ? new Date(v).getTime() : undefined });
                  }}
                />
                <label className="filter-date-label">到</label>
                <input
                  type="date"
                  className="filter-date-input"
                  value={dateToStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFilters({ dateTo: v ? new Date(v).getTime() : undefined });
                  }}
                />
              </div>
              <div className="filter-section">
                <div className="filter-section-title">标签组合</div>
                <div className="filter-tags-list">
                  {allFlatTags.length === 0 ? (
                    <span style={{ fontSize: 11, color: '#6C6C80' }}>暂无标签</span>
                  ) : (
                    allFlatTags.slice(0, 40).map(({ tag }) => {
                      const active = filters.tags.includes(tag.id);
                      return (
                        <span
                          key={tag.id}
                          className={`filter-tag-chip ${active ? 'active' : ''}`}
                          onClick={() => toggleTagSelection(tag.id)}
                        >
                          {tag.name}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
              <button className="filter-reset-btn" onClick={resetFilters}>
                重置所有筛选
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <CardEditorModal
          card={editingCard}
          tags={tags}
          onSave={saveCard}
          onClose={closeEditor}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImport={doImport}
          onClose={() => setShowImportModal(false)}
          onToast={addToast}
        />
      )}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
