import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, ArrowUpDown, Disc3 } from 'lucide-react';
import { useStore } from '../store';
import type { SortField } from '../types';
import { computePieceProgress } from './engine';
import { PieceCard } from './PieceCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { PieceForm } from './PieceForm';

export const RepertoirePage = () => {
  const pieces = useStore((s) => s.pieces);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortField>('bpm-asc');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...pieces];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.composer.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sort) {
        case 'bpm-asc':
          return a.bpm - b.bpm;
        case 'bpm-desc':
          return b.bpm - a.bpm;
        case 'key':
          return a.key.localeCompare(b.key);
        case 'progress':
          return computePieceProgress(b) - computePieceProgress(a);
        default:
          return 0;
      }
    });
    return list;
  }, [pieces, query, sort]);

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'bpm-asc', label: 'BPM 升序' },
    { value: 'bpm-desc', label: 'BPM 降序' },
    { value: 'key', label: '调号' },
    { value: 'progress', label: '完成度' },
  ];

  const avgProgress =
    pieces.length > 0
      ? Math.round(
          pieces.reduce((sum, p) => sum + computePieceProgress(p), 0) / pieces.length,
        )
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-white font-semibold"
            style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22 }}
          >
            曲目库
          </h2>
          <p className="text-white/50 text-xs mt-1">
            共 {pieces.length} 首曲目 · 平均练习完成度 {avgProgress}%
          </p>
        </div>

        <Button icon={<Plus size={16} />} onClick={() => { setEditId(null); setShowForm(true); }}>
          添加曲目
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索曲目名称、作曲家、调号..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 text-white text-sm border border-white/10 focus:border-[#FFD54F] focus:outline-none focus:ring-1 focus:ring-[#FFD54F]/50 transition-all placeholder:text-white/30"
          />
        </div>

        <div className="relative">
          <ArrowUpDown
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortField)}
            className="pl-10 pr-10 py-2.5 rounded-xl bg-black/30 text-white text-sm border border-white/10 focus:border-[#FFD54F] focus:outline-none focus:ring-1 focus:ring-[#FFD54F]/50 transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff66' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#263238]">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl py-20 flex flex-col items-center justify-center"
          style={{
            backgroundColor: 'rgba(38,50,56,0.5)',
            border: '1px dashed rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Disc3 size={40} className="text-white/15 mb-3" />
          <div className="text-white/40 text-sm mb-1">未找到匹配的曲目</div>
          <div className="text-white/25 text-xs">尝试调整搜索关键词或排序方式</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
            >
              <PieceCard piece={p} onEdit={() => { setEditId(p.id); setShowForm(true); }} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? '编辑曲目' : '添加新曲目'}
        maxWidth={560}
      >
        <PieceForm
          initial={editId ? pieces.find((p) => p.id === editId) : undefined}
          onSubmit={() => setShowForm(false)}
        />
      </Modal>
    </motion.div>
  );
};
