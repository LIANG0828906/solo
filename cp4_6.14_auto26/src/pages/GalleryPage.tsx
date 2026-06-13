import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, SortAsc } from 'lucide-react';
import { useGalleryStore } from '@/store/galleryStore';
import { ExhibitionCard } from '@/components/ExhibitionCard';
import { CreateExhibitionModal } from '@/components/CreateExhibitionModal';
import { useDebounce } from '@/hooks/useDebounce';
import type { SortKey, Exhibition } from '@/data/mockData';

export function GalleryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const exhibitions = useGalleryStore((s) => s.exhibitions);
  const addExhibition = useGalleryStore((s) => s.addExhibition);

  const [keywordInput, setKeywordInput] = useState(searchParams.get('theme') || '');
  const [sortBy, setSortBy] = useState<SortKey>(
    (searchParams.get('sort') as SortKey) || 'createdAt'
  );

  const debouncedKeyword = useDebounce(keywordInput, 300);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedKeyword) params.theme = debouncedKeyword;
    if (sortBy !== 'createdAt') params.sort = sortBy;
    setSearchParams(params, { replace: true });
  }, [debouncedKeyword, sortBy, setSearchParams]);

  const filteredExhibitions = useMemo(() => {
    const keyword = debouncedKeyword.trim().toLowerCase();
    let list: Exhibition[] = exhibitions;

    if (keyword) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(keyword) ||
          e.theme.toLowerCase().includes(keyword)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      return b.createdAt - a.createdAt;
    });
  }, [exhibitions, debouncedKeyword, sortBy]);

  const handleCreateExhibition = (data: { name: string; theme: string; coverUrl: string }) => {
    const newExh = addExhibition(data);
    setCreateOpen(false);
    navigate(`/exhibition/${newExh.id}`);
  };

  return (
    <div className="gallery-page">
      <section className="hero">
        <div className="container hero__container">
          <h1 className="hero__title">
            虚拟<span className="hero__title-accent">艺术</span>展馆
          </h1>
          <p className="hero__subtitle">
            突破空间界限，让艺术触手可及 · 策展人专属创作平台
          </p>
          <button className="btn btn--primary btn--lg hero__cta" onClick={() => setCreateOpen(true)}>
            <Plus size={20} />
            创建我的展厅
          </button>
        </div>
      </section>

      <section className="gallery-section">
        <div className="container">
          <div className="gallery-toolbar">
            <div className="gallery-toolbar__search">
              <Search size={18} strokeWidth={2} />
              <input
                type="text"
                className="gallery-toolbar__input"
                placeholder="搜索展厅主题或名称..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
              {keywordInput && (
                <button
                  className="gallery-toolbar__clear"
                  onClick={() => setKeywordInput('')}
                  aria-label="清除搜索"
                >
                  ×
                </button>
              )}
            </div>

            <div className="gallery-toolbar__right">
              <div className="gallery-toolbar__sort">
                <SortAsc size={16} strokeWidth={2} />
                <select
                  className="gallery-toolbar__select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                >
                  <option value="createdAt">按创建时间</option>
                  <option value="name">按名称排序</option>
                </select>
              </div>

              <button
                className="btn btn--primary gallery-toolbar__create"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} />
                创建展厅
              </button>
            </div>
          </div>

          <div className="gallery-result-info">
            共 <strong>{filteredExhibitions.length}</strong> 个展厅
            {debouncedKeyword && (
              <> ，关键词：<em>"{debouncedKeyword}"</em></>
            )}
          </div>

          {filteredExhibitions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🎨</div>
              <h3 className="empty-state__title">
                {debouncedKeyword ? '没有找到匹配的展厅' : '还没有任何展厅'}
              </h3>
              <p className="empty-state__desc">
                {debouncedKeyword ? '试试其他关键词' : '点击上方按钮，创建你的第一个艺术展厅'}
              </p>
              {!debouncedKeyword && (
                <button className="btn btn--primary mt-6" onClick={() => setCreateOpen(true)}>
                  <Plus size={16} /> 立即创建
                </button>
              )}
            </div>
          ) : (
            <div className="exhibition-grid">
              {filteredExhibitions.map((exhibition) => (
                <ExhibitionCard
                  key={exhibition.id}
                  exhibition={exhibition}
                  onClick={() => navigate(`/exhibition/${exhibition.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <CreateExhibitionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateExhibition}
      />
    </div>
  );
}
