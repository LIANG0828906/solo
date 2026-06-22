import { useState, useMemo, useCallback } from 'react';
import { RadarChart } from './components/RadarChart';
import { useIdeaStore, type Idea } from './store/useIdeaStore';
import {
  TECH_TAGS,
  type TechTag,
  calculateScore,
  generateComment,
} from './utils/scoreCalculator';
import './styles/global.css';

interface FormState {
  name: string;
  description: string;
  techTags: TechTag[];
  developmentMonths: number;
  targetUsers: number;
  initialFunding: number;
}

const INITIAL_FORM: FormState = {
  name: '',
  description: '',
  techTags: [],
  developmentMonths: 3,
  targetUsers: 10000,
  initialFunding: 50000,
};

function IdeaCard({
  idea,
  index,
  onToggleFavorite,
  listKey,
}: {
  idea: Idea;
  index: number;
  onToggleFavorite: (id: string) => void;
  listKey: number;
}) {
  const [animating, setAnimating] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    onToggleFavorite(idea.id);
    setTimeout(() => setAnimating(false), 200);
  };

  return (
    <div
      key={`${idea.id}-${listKey}-${index}`}
      className={`card-fade-in idea-card ${idea.isFavorite ? 'favorite' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="card-header">
        <div className="card-title">{idea.name}</div>
        <button
          className={`favorite-btn ${idea.isFavorite ? 'active' : ''} ${animating ? 'heartbeat-animation' : ''}`}
          onClick={handleFavoriteClick}
          type="button"
        >
          {idea.isFavorite ? '★' : '☆'}
        </button>
      </div>
      <div className="card-tags">
        {idea.tags.map((tag) => (
          <span key={tag} className="card-tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="card-score">
        <span className="score-value">{idea.scores.total}</span>
        <span className="score-label">综合得分</span>
      </div>
      <div className="card-comment">{generateComment(idea.scores.total)}</div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<TechTag | null>(null);
  const [listVersion, setListVersion] = useState(0);
  const { ideas, addIdea, toggleFavorite, currentPreview } = useIdeaStore();

  const handleTagToggle = useCallback((tag: TechTag) => {
    setForm((prev) => {
      if (prev.techTags.includes(tag)) {
        return { ...prev, techTags: prev.techTags.filter((t) => t !== tag) };
      }
      if (prev.techTags.length >= 3) {
        return prev;
      }
      return { ...prev, techTags: [...prev.techTags, tag] };
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name.trim() || !form.description.trim()) {
        return;
      }
      if (form.techTags.length < 1 || form.techTags.length > 3) {
        return;
      }

      const scores = calculateScore({
        techTags: form.techTags,
        developmentMonths: form.developmentMonths,
        targetUsers: form.targetUsers,
        initialFunding: form.initialFunding,
      });

      addIdea({
        name: form.name.trim(),
        description: form.description.trim(),
        tags: form.techTags,
        devTime: form.developmentMonths,
        userScale: form.targetUsers,
        budget: form.initialFunding,
        scores,
      });

      setListVersion((v) => v + 1);
      setForm((prev) => ({ ...prev, name: '', description: '', techTags: [] }));
    },
    [form, addIdea]
  );

  const sortedIdeas = useMemo(() => {
    let filtered = ideas;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (idea) =>
          idea.name.toLowerCase().includes(q) ||
          idea.description.toLowerCase().includes(q)
      );
    }

    if (filterTag) {
      filtered = filtered.filter((idea) => idea.tags.includes(filterTag));
    }

    return [...filtered].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return b.scores.total - a.scores.total;
    });
  }, [ideas, searchQuery, filterTag]);

  const isFormValid =
    form.name.trim() !== '' &&
    form.description.trim() !== '' &&
    form.techTags.length >= 1 &&
    form.techTags.length <= 3;

  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="left-panel">
          <div className="panel-card">
            <h2 className="section-title">创意输入</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">项目名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="为你的创意起个名字..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">创意描述（200字内）</label>
                <textarea
                  className="form-textarea"
                  placeholder="简要描述你的项目创意..."
                  maxLength={200}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div className="char-count">{form.description.length}/200</div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  技术标签（选择1-3个）
                  <span
                    style={{
                      color:
                        form.techTags.length >= 1 && form.techTags.length <= 3
                          ? 'var(--accent-end)'
                          : 'var(--text-muted)',
                      marginLeft: 8,
                    }}
                  >
                    已选 {form.techTags.length}/3
                  </span>
                </label>
                <div className="tags-container">
                  {TECH_TAGS.map((tag) => {
                    const isSelected = form.techTags.includes(tag);
                    const isDisabled = !isSelected && form.techTags.length >= 3;
                    return (
                      <div
                        key={tag}
                        className={`tag-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => {
                          if (!isDisabled) {
                            handleTagToggle(tag);
                          }
                        }}
                      >
                        {tag}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">预估开发时长</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={form.developmentMonths}
                    onChange={(e) =>
                      setForm({ ...form, developmentMonths: Number(e.target.value) })
                    }
                    className="slider"
                  />
                  <div className="slider-value">
                    <span>1 个月</span>
                    <span>{form.developmentMonths} 个月</span>
                    <span>12 个月</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">目标用户规模</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min={100}
                    max={100000}
                    step={100}
                    value={form.targetUsers}
                    onChange={(e) =>
                      setForm({ ...form, targetUsers: Number(e.target.value) })
                    }
                    className="slider"
                  />
                  <div className="slider-value">
                    <span>100 人</span>
                    <span>{form.targetUsers.toLocaleString()} 人</span>
                    <span>100,000 人</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">初始资金</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min={0}
                    max={500000}
                    step={10000}
                    value={form.initialFunding}
                    onChange={(e) =>
                      setForm({ ...form, initialFunding: Number(e.target.value) })
                    }
                    className="slider"
                  />
                  <div className="slider-value">
                    <span>0 元</span>
                    <span>¥ {form.initialFunding.toLocaleString()}</span>
                    <span>50 万元</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={!isFormValid}
                style={{
                  opacity: isFormValid ? 1 : 0.5,
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                }}
              >
                提交评估
              </button>
            </form>
          </div>
        </div>

        <div className="right-panel">
          <div className="panel-card">
            <h2 className="section-title">可行性雷达图</h2>
            <RadarChart scores={currentPreview} />
          </div>

          <div
            className="panel-card"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <h2 className="section-title">创意排行榜</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                placeholder="搜索项目名称或描述..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setListVersion((v) => v + 1);
                }}
                style={{ flex: 1, minWidth: 200 }}
              />
              <div className="tags-container">
                <div
                  className={`tag-chip ${!filterTag ? 'selected' : ''}`}
                  onClick={() => {
                    setFilterTag(null);
                    setListVersion((v) => v + 1);
                  }}
                >
                  全部
                </div>
                {TECH_TAGS.slice(0, 5).map((tag) => (
                  <div
                    key={tag}
                    className={`tag-chip ${filterTag === tag ? 'selected' : ''}`}
                    onClick={() => {
                      setFilterTag(filterTag === tag ? null : tag);
                      setListVersion((v) => v + 1);
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            <div className="cards-list">
              {sortedIdeas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💡</div>
                  <div className="empty-state-text">
                    {ideas.length === 0
                      ? '还没有创意，填写左侧表单开始孵化你的第一个想法吧！'
                      : '没有匹配的创意，换个搜索词或筛选条件试试~'}
                  </div>
                </div>
              ) : (
                <div className="cards-grid">
                  {sortedIdeas.map((idea, index) => (
                    <IdeaCard
                      key={`${idea.id}-${listVersion}`}
                      idea={idea}
                      index={index}
                      onToggleFavorite={(id) => {
                        toggleFavorite(id);
                        setListVersion((v) => v + 1);
                      }}
                      listKey={listVersion}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
