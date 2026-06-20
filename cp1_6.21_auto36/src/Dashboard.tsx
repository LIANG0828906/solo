import { useState, useEffect, useMemo } from 'react';
import { Recipe, InventoryItem, Comment } from './types';
import { api } from './api';
import RecipeCardEditor from './RecipeCardEditor';
import InventoryManager from './InventoryManager';
import './Dashboard.css';

type View = 'list' | 'detail' | 'editor';

interface Props {
  onRefresh?: () => void;
}

export default function Dashboard({ onRefresh }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, i] = await Promise.all([api.getRecipes(), api.getInventory()]);
      setRecipes(r);
      setInventory(i);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const recipe = await api.getRecipe(id);
      setSelectedRecipe(recipe);
      setView('detail');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleBackToList = () => {
    setSelectedRecipe(null);
    setView('list');
  };

  const handleNewRecipe = () => {
    setEditingRecipe(null);
    setShowEditor(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowEditor(true);
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm('确定删除此食谱？')) return;
    try {
      await api.deleteRecipe(id);
      setRecipes(recipes.filter(r => r.id !== id));
      showToast('食谱已删除');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRecipeSaved = async () => {
    await loadAll();
    showToast('食谱保存成功！');
  };

  const handleStartCook = async (recipeId: string) => {
    try {
      const result = await api.consumeRecipe(recipeId);
      setInventory(result.remainingInventory);
      const updatedRecipe = recipes.find(r => r.id === recipeId);
      showToast(`🍳 开始制作「${updatedRecipe?.name || ''}」！已扣除食材: ${result.consumed.map(c => c.name).join(', ')}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredRecipes = useMemo(() => {
    if (!search.trim()) return recipes;
    const s = search.toLowerCase();
    return recipes.filter(
      r =>
        r.name.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.tags.some(t => t.toLowerCase().includes(s)) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(s))
    );
  }, [recipes, search]);

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="logo">
          <span className="logo-icon">🍅</span>
          <h1>美食厨房</h1>
          <span className="logo-sub">食谱与食材管理</span>
        </div>
        <div className="header-actions">
          {view === 'list' && (
            <button className="btn-primary" onClick={handleNewRecipe}>
              + 创建食谱
            </button>
          )}
          {view === 'detail' && (
            <button className="btn-secondary" onClick={handleBackToList}>
              ← 返回列表
            </button>
          )}
        </div>
      </header>

      <div className={`dash-body ${view === 'detail' ? 'detail-mode' : ''}`}>
        {view !== 'detail' && (
          <aside className="left-pane">
            <div className="pane-header">
              <h2>📖 食谱库</h2>
              <div className="search-wrap">
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索食谱、食材、标签..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <span className="search-count">{filteredRecipes.length}/{recipes.length}</span>
              </div>
            </div>
            <div className="recipe-grid">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="recipe-card skeleton-card">
                    <div className="skeleton cover-skel" />
                    <div className="card-body">
                      <div className="skeleton title-skel" />
                      <div className="skeleton meta-skel" />
                      <div className="skeleton desc-skel" />
                    </div>
                  </div>
                ))
              ) : filteredRecipes.length === 0 ? (
                <div className="empty-state full">
                  <svg viewBox="0 0 200 160" width="180" height="140">
                    <rect x="30" y="20" width="140" height="110" rx="12" fill="#FFF" stroke="#E8DFD0" strokeWidth="2" strokeDasharray="6,4"/>
                    <circle cx="100" cy="65" r="20" fill="none" stroke="#DDD" strokeWidth="2"/>
                    <path d="M85 65 Q92 55 100 65 Q108 75 115 65" stroke="#DDD" strokeWidth="2" fill="none"/>
                    <rect x="70" y="95" width="60" height="8" rx="4" fill="#EEE"/>
                    <rect x="75" y="110" width="50" height="6" rx="3" fill="#EEE"/>
                  </svg>
                  <p>{search ? '没有找到匹配的食谱' : '还没有食谱，点击右上角创建第一个吧！'}</p>
                </div>
              ) : (
                filteredRecipes.map(r => (
                  <div key={r.id} className="recipe-card fade-in" onClick={() => handleOpenDetail(r.id)}>
                    <div className="card-cover">
                      <img src={r.coverImage || 'https://via.placeholder.com/400x250?text=Recipe'} alt={r.name} onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=No+Image'; }} />
                      <div className="card-overlay">
                        <button className="mini-btn edit" onClick={e => { e.stopPropagation(); handleEditRecipe(r); }}>编辑</button>
                        <button className="mini-btn del" onClick={e => { e.stopPropagation(); handleDeleteRecipe(r.id); }}>删除</button>
                      </div>
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{r.name}</h3>
                      <div className="card-meta">
                        <span>⏱ {r.totalTime}分</span>
                        <span>⭐ {r.averageRating.toFixed(1)} <small>({r.totalRatings})</small></span>
                        <span className={`diff diff-${r.difficulty}`}>
                          {r.difficulty === 'easy' ? '简单' : r.difficulty === 'medium' ? '中' : '难'}
                        </span>
                      </div>
                      <p className="card-desc">{r.description}</p>
                      {r.tags.length > 0 && (
                        <div className="card-tags">
                          {r.tags.slice(0, 3).map(t => <span key={t} className="tag-sm">#{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {view === 'detail' && selectedRecipe ? (
          <section className="detail-pane fade-in">
            <RecipeDetail
              recipe={selectedRecipe}
              inventory={inventory}
              onBack={handleBackToList}
              onEdit={() => { handleEditRecipe(selectedRecipe); }}
              onDelete={() => handleDeleteRecipe(selectedRecipe.id)}
              onStartCook={handleStartCook}
              onCommentAdded={() => handleOpenDetail(selectedRecipe.id)}
              recipes={recipes}
            />
          </section>
        ) : (
          <section className="right-pane">
            <InventoryManager
              inventory={inventory}
              setInventory={setInventory}
              onStartCook={handleStartCook}
              recipes={recipes}
            />
          </section>
        )}
      </div>

      {showEditor && (
        <RecipeCardEditor
          recipe={editingRecipe || undefined}
          onClose={() => setShowEditor(false)}
          onSaved={handleRecipeSaved}
          inventory={inventory}
        />
      )}

      {toast && (
        <div className="toast fade-in">{toast}</div>
      )}
    </div>
  );
}

function RecipeDetail({
  recipe, inventory, onEdit, onDelete, onStartCook, onCommentAdded, recipes,
}: {
  recipe: Recipe;
  inventory: InventoryItem[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStartCook: (id: string) => Promise<void>;
  onCommentAdded: () => void;
  recipes?: Recipe[];
}) {
  const [comments, setComments] = useState<Comment[]>(recipe.comments || []);
  const [userName, setUserName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [cooking, setCooking] = useState(false);

  const canMakeStatus = useMemo(() => {
    const status = recipe.ingredients.map(ri => {
      const inv = inventory.find(i => i.name === ri.name);
      return { ...ri, available: inv?.quantity || 0, enough: (inv?.quantity || 0) >= ri.quantity };
    });
    return { canMake: status.every(s => s.enough), items: status };
  }, [recipe.ingredients, inventory]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.addComment(recipe.id, {
        userName: userName.trim() || '匿名用户',
        content: newComment,
        rating,
      });
      setNewComment('');
      setRating(0);
      onCommentAdded();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    try {
      await api.addComment(recipe.id, {
        userName: userName.trim() || '匿名用户',
        content: replyContent,
        parentId,
      });
      setReplyContent('');
      setReplyingTo(null);
      onCommentAdded();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCook = async () => {
    setCooking(true);
    try {
      await onStartCook(recipe.id);
    } finally {
      setCooking(false);
    }
  };

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="recipe-detail">
      <div className="detail-cover">
        <img src={recipe.coverImage || 'https://via.placeholder.com/800x400?text=Recipe'} alt={recipe.name} onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=No+Image'; }} />
        <div className="detail-cover-overlay">
          <div className="detail-actions">
            <button className="btn-secondary detail-act-btn" onClick={onEdit}>✏️ 编辑</button>
            <button className="btn-danger detail-act-btn" onClick={onDelete}>🗑️ 删除</button>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-head">
          <h1 className="detail-title">{recipe.name}</h1>
          <div className="detail-meta-row">
            <div className="meta-chip">⏱ 总 {recipe.totalTime} 分钟 <small>(准备{recipe.prepTime} / 烹饪{recipe.cookTime})</small></div>
            <div className="meta-chip">👥 {recipe.servings} 人份</div>
            <div className={`meta-chip diff-${recipe.difficulty}`}>
              {recipe.difficulty === 'easy' ? '🟢 简单' : recipe.difficulty === 'medium' ? '🟡 中等' : '🔴 困难'}
            </div>
            <div className="meta-chip rating-chip">⭐ {recipe.averageRating.toFixed(1)} <small>({recipe.totalRatings}评价)</small></div>
          </div>
          {recipe.tags.length > 0 && (
            <div className="detail-tags">
              {recipe.tags.map(t => <span key={t} className="tag">#{t}</span>)}
            </div>
          )}
          <p className="detail-desc">{recipe.description}</p>
          <div className="cook-section">
            <button
              className={`btn-primary cook-action-btn ${canMakeStatus.canMake ? 'ready' : 'not-ready'}`}
              onClick={handleCook}
              disabled={!canMakeStatus.canMake || cooking}
            >
              {cooking ? '制作中...' : canMakeStatus.canMake ? '🍳 开始制作（自动扣除食材）' : '食材不足，无法制作'}
            </button>
          </div>
        </div>

        <div className="detail-body-grid">
          <div className="detail-section">
            <h3>🥕 食材清单</h3>
            <div className="ingredients-table">
              {canMakeStatus.items.map(item => (
                <div key={item.id} className={`ing-row ${item.enough ? 'ok' : 'miss'}`}>
                  <span className="ing-dot" />
                  <span className="ing-n">{item.name}</span>
                  <span className="ing-am">{item.quantity} {item.unit}</span>
                  <span className={`ing-check ${item.enough ? 'has' : 'no'}`}>
                    {item.enough ? `✓ 库存${item.available}` : `✗ 缺${item.quantity - item.available}(库存${item.available})`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3>👨‍🍳 制作步骤</h3>
            <ol className="steps-ordered">
              {recipe.steps.map(s => (
                <li key={s.id}>
                  <span className="step-num">{s.order}</span>
                  <span className="step-desc">{s.description}</span>
                </li>
              ))}
              {recipe.steps.length === 0 && <li className="empty-steps">暂无步骤</li>}
            </ol>
          </div>

          <div className="detail-section full-width">
            <h3>💬 评价与评论</h3>

            <div className="comment-form">
              <div className="cf-header">
                <input
                  type="text"
                  className="cf-name"
                  placeholder="你的昵称"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                />
                <StarRating value={rating} hover={hoverRating} onChange={setRating} onHover={setHoverRating} />
              </div>
              <textarea
                rows={3}
                placeholder="分享一下你对这道菜的感受..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <div className="cf-actions">
                <button className="btn-primary" onClick={handleSubmitComment} disabled={!newComment.trim()}>
                  发表评论
                </button>
              </div>
            </div>

            <div className="comments-list">
              {sortedComments.length === 0 ? (
                <div className="empty-tip">暂无评论，快来第一个分享吧~</div>
              ) : (
                sortedComments.map(c => (
                  <div key={c.id} className="comment-item fade-in">
                    <div className="ci-head">
                      <span className="ci-avatar">{c.userName[0] || '?'}</span>
                      <div className="ci-info">
                        <div className="ci-name-row">
                          <span className="ci-name">{c.userName}</span>
                          {c.rating > 0 && <StarRating value={c.rating} readOnly small />}
                        </div>
                        <span className="ci-time">{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                    <div className="ci-content">{c.content}</div>
                    <div className="ci-actions">
                      <button className="link-btn" onClick={() => setReplyingTo(c.id === replyingTo ? null : c.id)}>
                        {replyingTo === c.id ? '取消回复' : '回复'}
                      </button>
                    </div>
                    {replyingTo === c.id && (
                      <div className="reply-form">
                        <textarea rows={2} placeholder={`回复 @${c.userName}...`} value={replyContent} onChange={e => setReplyContent(e.target.value)} />
                        <div className="rf-actions">
                          <button className="btn-primary" onClick={() => handleReply(c.id)}>发送回复</button>
                        </div>
                      </div>
                    )}
                    {c.replies && c.replies.length > 0 && (
                      <div className="replies">
                        {c.replies.map(r => (
                          <div key={r.id} className="reply-item">
                            <div className="ri-head">
                              <span className="ci-avatar small">{r.userName[0]}</span>
                              <span className="ci-name">{r.userName}</span>
                              <span className="ci-time">{new Date(r.createdAt).toLocaleString('zh-CN')}</span>
                            </div>
                            <div className="ri-content">{r.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarRating({
  value, onChange, hover, onHover, readOnly, small,
}: {
  value: number;
  onChange?: (v: number) => void;
  hover?: number;
  onHover?: (v: number) => void;
  readOnly?: boolean;
  small?: boolean;
}) {
  const display = (hover ?? 0) > 0 ? hover! : value;
  const size = small ? 14 : 22;
  return (
    <div className={`star-rating ${readOnly ? 'readonly' : ''}`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(n => {
        const half = n - 0.5;
        const isFull = display >= n;
        const isHalf = !isFull && display >= half;
        return (
          <span
            key={n}
            className="star"
            style={{ width: size, height: size }}
            onMouseMove={e => {
              if (readOnly || !onHover) return;
              const rect = (e.currentTarget as HTMLSpanElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              onHover(x < rect.width / 2 ? n - 0.5 : n);
            }}
            onMouseLeave={() => !readOnly && onHover && onHover(0)}
            onClick={() => {
              if (readOnly || !onChange) return;
              onChange(display);
            }}
          >
            <svg viewBox="0 0 24 24" width={size} height={size}>
              <defs>
                <linearGradient id={`half-${n}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#DDD" />
                </linearGradient>
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={isFull ? '#FFD700' : isHalf ? `url(#half-${n})` : '#DDD'}
                stroke="#E8BE00"
                strokeWidth="0.5"
              />
            </svg>
          </span>
        );
      })}
      {!readOnly && <span className="rating-val" style={{ marginLeft: 6, fontSize: small ? 11 : 13 }}>{value || 0}/5</span>}
    </div>
  );
}
