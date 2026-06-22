import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Link as LinkIcon, Search } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useStore } from '@/store';
import { fetchCards } from '@/api';
import { CATEGORY_COLORS, CATEGORY_LABELS, VALID_INTERVALS, INTERVAL_LABELS, type Card, type Category, type ReviewInterval } from '@/types';
import '@/components/CardEditor.css';

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['code-block'],
    ['clean'],
  ],
};

const CATEGORIES: Category[] = ['programming', 'history', 'life', 'other'];

export default function CardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cards, addCard, editCard } = useStore();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [content, setContent] = useState('');
  const [reviewInterval, setReviewInterval] = useState<ReviewInterval>(1);
  const [linkedCardIds, setLinkedCardIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const card = cards.find((c) => c.id === id);
      if (card) {
        setTitle(card.title);
        setCategory(card.category);
        setContent(card.content);
        setReviewInterval(card.reviewInterval);
        setLinkedCardIds([...card.linkedCardIds]);
      }
    }
  }, [isEditing, id, cards]);

  const handleSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q);
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      const allCards = await fetchCards(q);
      setSearchResults(allCards.filter((c) => c.id !== id && !linkedCardIds.includes(c.id)));
    },
    [id, linkedCardIds]
  );

  const handleLinkCard = (cardId: string) => {
    setLinkedCardIds((prev) => [...prev, cardId]);
    setSearchResults((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleUnlinkCard = (cardId: string) => {
    setLinkedCardIds((prev) => prev.filter((id) => id !== cardId));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      if (isEditing && id) {
        await editCard(id, { title, category, content, reviewInterval, linkedCardIds });
      } else {
        await addCard({ title, category, content, reviewInterval, linkedCardIds });
      }
      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-editor">
      <div className="editor-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          返回
        </button>
        <h2>{isEditing ? '编辑卡片' : '创建新卡片'}</h2>
        <button className="save-btn" onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
          <Save size={16} />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className={`editor-body ${focused ? 'editor-focused' : ''}`}>
        <div className="editor-field">
          <label>标题</label>
          <input
            type="text"
            placeholder="输入卡片标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
          />
        </div>

        <div className="editor-field">
          <label>主题分类</label>
          <div className="category-selector">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`cat-select-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
                style={
                  category === cat
                    ? { backgroundColor: CATEGORY_COLORS[cat], color: '#fff' }
                    : { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat] }
                }
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-field">
          <label>复习周期</label>
          <div className="interval-selector">
            {VALID_INTERVALS.map((interval) => (
              <button
                key={interval}
                className={`interval-btn ${reviewInterval === interval ? 'active' : ''}`}
                onClick={() => setReviewInterval(interval)}
              >
                {INTERVAL_LABELS[interval]}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-field">
          <label>核心知识点</label>
          <div className="quill-wrapper">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={QUILL_MODULES}
              placeholder="输入知识点内容，支持加粗、列表和代码块..."
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </div>
        </div>

        <div className="editor-field">
          <label>
            <LinkIcon size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            关联卡片
          </label>
          <div className="linked-cards-area">
            {linkedCardIds.map((linkId) => {
              const linked = cards.find((c) => c.id === linkId);
              if (!linked) return null;
              return (
                <div
                  key={linkId}
                  className="linked-bubble"
                  style={{ borderColor: CATEGORY_COLORS[linked.category] }}
                >
                  <span
                    className="bubble-dot"
                    style={{ backgroundColor: CATEGORY_COLORS[linked.category] }}
                  />
                  {linked.title}
                  <button className="unlink-btn" onClick={() => handleUnlinkCard(linkId)}>
                    <X size={12} />
                  </button>
                </div>
              );
            })}
            <button className="add-link-btn" onClick={() => setShowSearch(!showSearch)}>
              <Search size={14} />
              搜索关联
            </button>
          </div>

          {showSearch && (
            <div className="search-overlay">
              <input
                type="text"
                placeholder="搜索卡片名称..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="link-search-input"
              />
              <div className="search-results">
                {searchResults.map((card) => (
                  <div
                    key={card.id}
                    className="search-result-bubble"
                    style={{ borderColor: CATEGORY_COLORS[card.category] }}
                    onClick={() => handleLinkCard(card.id)}
                  >
                    <span
                      className="bubble-dot"
                      style={{ backgroundColor: CATEGORY_COLORS[card.category] }}
                    />
                    {card.title}
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <p className="no-results">未找到匹配的卡片</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
