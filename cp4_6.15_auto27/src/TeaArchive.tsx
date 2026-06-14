import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Filter, Search, X } from 'lucide-react';
import { useTeaStore } from '@/store/useTeaStore';
import type { TeaVariety, TeaFilters } from '@/types';
import TeaCard from '@/components/TeaCard';
import TeaForm from '@/components/TeaForm';
import Modal from '@/components/Modal';
import { getProvinces, getCities } from '@/lib/regions';

const VARIETIES: (TeaVariety | '')[] = [
  '', '绿茶', '红茶', '乌龙茶', '白茶', '黄茶', '黑茶', '普洱', '再加工茶',
];

export default function TeaArchive() {
  const { teas, loading, loadTeas, addTea, filters, setFilters } = useTeaStore();
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [search, setSearch] = useState('');
  const [localFilters, setLocalFilters] = useState<TeaFilters>(filters);

  useEffect(() => {
    loadTeas();
  }, [loadTeas]);

  const handleFilterChange = useCallback(
    (patch: Partial<TeaFilters>) => {
      const next: TeaFilters = { ...localFilters, ...patch };
      if (patch.province !== undefined && patch.province !== localFilters.province) {
        next.city = '';
        next.region = '';
      }
      setLocalFilters(next);
    },
    [localFilters]
  );

  const applyFilters = useCallback(() => {
    setAnimKey((k) => k + 1);
    setFilters(localFilters);
    loadTeas(localFilters);
    setShowFilters(false);
  }, [localFilters, setFilters, loadTeas]);

  const clearFilters = () => {
    const empty: TeaFilters = { variety: '', province: '', city: '', region: '', year: '' };
    setLocalFilters(empty);
    setFilters(empty);
    loadTeas(empty);
    setAnimKey((k) => k + 1);
  };

  const filteredTeas = useMemo(() => {
    if (!search.trim()) return teas;
    const s = search.toLowerCase();
    return teas.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.variety.toLowerCase().includes(s) ||
        t.province.includes(search)
    );
  }, [teas, search]);

  const years = useMemo(() => {
    const set = new Set(teas.map((t) => t.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [teas]);

  const hasActiveFilters =
    filters.variety || filters.province || filters.city || filters.region || filters.year;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">茶叶档案</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
            共 {teas.length} 款茶叶 · 筛选后 {filteredTeas.length} 款
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="tea-btn tea-btn-secondary !py-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span
                className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center ml-1"
                style={{ backgroundColor: 'var(--color-tea)' }}
              >
                !
              </span>
            )}
          </button>
          <button className="tea-btn tea-btn-primary !py-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            添加茶叶
          </button>
        </div>
      </div>

      {showFilters && (
        <div
          className="tea-card p-5 mb-5"
          style={{ animation: 'slideDown 250ms ease-out' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">筛选条件</h3>
            {hasActiveFilters && (
              <button
                className="text-xs flex items-center gap-1"
                style={{ color: 'var(--color-text-light)' }}
                onClick={clearFilters}
              >
                <X className="w-3.5 h-3.5" />
                清空
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="tea-label">品种</label>
              <select
                className="tea-input"
                value={localFilters.variety || ''}
                onChange={(e) => handleFilterChange({ variety: e.target.value as TeaVariety | '' })}
              >
                {VARIETIES.map((v) => (
                  <option key={v} value={v}>
                    {v || '全部品种'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="tea-label">省份</label>
              <select
                className="tea-input"
                value={localFilters.province || ''}
                onChange={(e) => handleFilterChange({ province: e.target.value })}
              >
                <option value="">全部省份</option>
                {getProvinces().map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="tea-label">城市</label>
              <select
                className="tea-input"
                value={localFilters.city || ''}
                disabled={!localFilters.province}
                onChange={(e) => handleFilterChange({ city: e.target.value })}
              >
                <option value="">全部城市</option>
                {getCities(localFilters.province || '').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="tea-label">年份</label>
              <select
                className="tea-input"
                value={localFilters.year || ''}
                onChange={(e) =>
                  handleFilterChange({ year: e.target.value ? Number(e.target.value) : '' })
                }
              >
                <option value="">全部年份</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="tea-btn tea-btn-secondary !py-1.5 !px-4 !text-sm"
              onClick={() => setShowFilters(false)}
            >
              取消
            </button>
            <button
              className="tea-btn tea-btn-primary !py-1.5 !px-4 !text-sm"
              onClick={applyFilters}
            >
              应用筛选
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search
          className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-light)' }}
        />
        <input
          className="tea-input !pl-10"
          placeholder="搜索茶叶名称、品种或产地..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--color-text-light)' }}>
          加载中...
        </div>
      ) : filteredTeas.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-3" style={{ opacity: 0.4 }}>🍵</div>
          <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
            {teas.length === 0 ? '还没有茶叶档案，点击右上角添加第一款' : '没有符合条件的茶叶'}
          </p>
        </div>
      ) : (
        <div
          key={animKey}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredTeas.map((tea, idx) => (
            <div
              key={tea.id}
              style={{
                animation: 'fadeInUp 400ms ease-out both',
                animationDelay: `${Math.min(idx, 12) * 40}ms`,
              }}
            >
              <TeaCard tea={tea} />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="添加茶叶档案"
        maxWidth="680px"
      >
        <TeaForm
          onSubmit={async (data) => {
            await addTea(data);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
