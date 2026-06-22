import { useState } from 'react';
import { useBookStore } from '../store';
import { BookOpen, BookMarked, BookCheck, Sparkles, Plus, Library, type LucideIcon } from 'lucide-react';
import { FilterType } from '../types';

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

function createRipple(
  event: React.MouseEvent<HTMLElement>,
  setRipples: React.Dispatch<React.SetStateAction<Ripple[]>>
) {
  const button = event.currentTarget;
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  const rect = button.getBoundingClientRect();

  const rippleData: Ripple = {
    x: event.clientX - rect.left - radius,
    y: event.clientY - rect.top - radius,
    size: diameter,
    id: Date.now() + Math.random(),
  };

  setRipples((prev) => [...prev, rippleData]);

  setTimeout(() => {
    setRipples((prev) => prev.filter((r) => r.id !== rippleData.id));
  }, 400);
}

interface Props {
  onAddBook: () => void;
}

const FILTERS: { key: FilterType; label: string; icon: LucideIcon }[] = [
  { key: 'all', label: '全部书籍', icon: Library },
  { key: 'reading', label: '正在阅读', icon: BookOpen },
  { key: 'finished', label: '已读完', icon: BookCheck },
  { key: 'wishlist', label: '想读', icon: Sparkles },
];

export default function Sidebar({ onAddBook }: Props) {
  const currentFilter = useBookStore((s) => s.currentFilter);
  const setFilter = useBookStore((s) => s.setFilter);
  const books = useBookStore((s) => s.books);
  const [filterRipples, setFilterRipples] = useState<Record<string, Ripple[]>>({});
  const [addRipples, setAddRipples] = useState<Ripple[]>([]);

  const getCount = (key: FilterType) => {
    if (key === 'all') return books.length;
    return books.filter((b) => b.status === key).length;
  };

  const handleFilterClick = (e: React.MouseEvent<HTMLButtonElement>, key: FilterType) => {
    const button = e.currentTarget;
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();
    const ripple: Ripple = {
      x: e.clientX - rect.left - radius,
      y: e.clientY - rect.top - radius,
      size: diameter,
      id: Date.now() + Math.random(),
    };
    setFilterRipples((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), ripple],
    }));
    setTimeout(() => {
      setFilterRipples((prev) => ({
        ...prev,
        [key]: (prev[key] || []).filter((r) => r.id !== ripple.id),
      }));
    }, 400);
    setFilter(key);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <BookMarked size={24} color="#7CB77F" />
        <span className="sidebar-title">阅读管理</span>
      </div>

      <span className="sidebar-section-label">阅读状态</span>

      {FILTERS.map(({ key, label, icon: Icon }) => {
        const ripples = filterRipples[key] || [];
        return (
          <button
            key={key}
            className={`filter-btn ${currentFilter === key ? 'active' : ''}`}
            onClick={(e) => handleFilterClick(e, key)}
          >
            <Icon size={18} />
            <span>{label}</span>
            <span className="filter-count">{getCount(key)}</span>
            {ripples.map((r) => (
              <span
                key={r.id}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
        );
      })}

      <button
        className="add-book-btn"
        onClick={(e) => {
          createRipple(e, setAddRipples);
          onAddBook();
        }}
      >
        <Plus size={18} />
        添加书籍
        {addRipples.map((r) => (
          <span
            key={r.id}
            className="ripple"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}
      </button>
    </aside>
  );
}
