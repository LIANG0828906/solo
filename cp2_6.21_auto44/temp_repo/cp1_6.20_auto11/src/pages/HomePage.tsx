import { useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import CodeCard from '../components/CodeCard';
import { useSnippets } from '../hooks/useSnippets';
import type { CreateSnippetDto } from '../types';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS', 'Java', 'Go', 'Rust', 'React', 'Vue', 'Shell', 'SQL'];
const POPULAR_TAGS = ['算法', 'React', 'Vue', '工具函数', '性能优化', '设计模式', 'Node.js', 'CSS技巧'];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLang, setNewLang] = useState('JavaScript');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { snippets, loading, hasMore, loadMore, createSnippet, likeSnippet, favoriteSnippet } = useSnippets(search, selectedTag, selectedLang);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore, loadMore]);

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !newTags.includes(trimmed)) {
      setNewTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  }, [tagInput, newTags]);

  const removeTag = useCallback((tag: string) => {
    setNewTags(prev => prev.filter(t => t !== tag));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    setSubmitting(true);
    const dto: CreateSnippetDto = {
      title: newTitle.trim(),
      code: newCode,
      language: newLang,
      tags: newTags,
    };
    const created = await createSnippet(dto);
    if (created) {
      setNewTitle('');
      setNewCode('');
      setNewLang('JavaScript');
      setNewTags([]);
      setTagInput('');
      setShowCreate(false);
    }
    setSubmitting(false);
  }, [newTitle, newCode, newLang, newTags, createSnippet]);

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">代码片段</h1>
        <SearchBar value={search} onChange={setSearch} />

        <div className="filter-section">
          <span className="filter-label">语言：</span>
          <div className="filter-chips">
            <button
              className={`filter-chip ${!selectedLang ? 'active' : ''}`}
              onClick={() => setSelectedLang('')}
            >
              全部
            </button>
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                className={`filter-chip ${selectedLang === lang ? 'active' : ''}`}
                onClick={() => setSelectedLang(lang === selectedLang ? '' : lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">标签：</span>
          <div className="filter-chips">
            <button
              className={`filter-chip ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag('')}
            >
              全部
            </button>
            {POPULAR_TAGS.map(tag => (
              <button
                key={tag}
                className={`filter-chip ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="create-section">
        <div className="create-header">
          <h2 className="create-title">分享新片段</h2>
          <button className="toggle-btn" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '收起' : '展开'}
          </button>
        </div>

        {showCreate && (
          <form className="create-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                className="form-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="给代码片段起个名字"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">语言</label>
              <select className="form-select" value={newLang} onChange={(e) => setNewLang(e.target.value)}>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">代码</label>
              <textarea
                className="form-textarea"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="粘贴或输入你的代码..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">标签（回车添加）</label>
              <div className="tags-input">
                {newTags.map((tag, i) => (
                  <span key={i} className="tag-item">
                    {tag}
                    <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
                <input
                  className="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="输入标签..."
                />
              </div>
            </div>

            <button className="submit-btn" type="submit" disabled={submitting}>
              {submitting ? '保存中...' : '保存片段'}
            </button>
          </form>
        )}
      </div>

      {snippets.length === 0 && !loading ? (
        <div className="empty-state">
          <h3>暂无代码片段</h3>
          <p>展开上方表单，分享你的第一个代码片段吧！</p>
        </div>
      ) : (
        <div className="snippets-grid">
          {snippets.map((snippet, i) => (
            <CodeCard
              key={snippet.id}
              snippet={snippet}
              onLike={likeSnippet}
              onFavorite={favoriteSnippet}
              index={i}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} style={{ height: '20px' }} />

      {loading && <div className="loading">加载中...</div>}
      {!loading && !hasMore && snippets.length > 0 && (
        <div className="no-more">— 已加载全部 —</div>
      )}
    </div>
  );
}
