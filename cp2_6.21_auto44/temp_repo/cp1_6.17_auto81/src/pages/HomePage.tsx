import { useState, useRef, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { PaletteGrid } from '../components/PaletteGrid';
import { CreatePaletteModal } from '../components/CreatePaletteModal';
import { SegmentedControl } from '../components/SegmentedControl';
import { usePaletteStore } from '../store/usePaletteStore';
import type { SortMode } from '../types';
import './HomePage.css';

export function HomePage() {
  const { sortMode, setSortMode, addPalette, deletePalette, updatePalette, getFilteredPalettes, searchQuery } =
    usePaletteStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPalette, setEditingPalette] = useState<{
    id: string;
    name: string;
    colors: string[];
  } | null>(null);
  const [sortKey, setSortKey] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleIdRef = useRef(0);

  const filteredPalettes = useMemo(() => getFilteredPalettes(), [getFilteredPalettes]);

  const handleCreateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    setIsCreateModalOpen(true);
  };

  const handleSortChange = (value: string) => {
    setSortMode(value as SortMode);
    setSortKey((prev) => prev + 1);
  };

  const handleCreateSubmit = (name: string, colors: string[]) => {
    addPalette({ name, colors });
  };

  const handleEditSubmit = (name: string, colors: string[]) => {
    if (editingPalette) {
      updatePalette(editingPalette.id, { name, colors });
      setEditingPalette(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个色板吗？')) {
      deletePalette(id);
    }
  };

  const sortOptions = [
    { value: 'latest', label: '最新优先' },
    { value: 'popular', label: '最热优先' },
  ];

  return (
    <div className="home-page">
      <Navbar onCreateClick={() => setIsCreateModalOpen(true)} />

      <main className="main-content">
        <div className="content-wrapper">
          <div className="toolbar">
            <button className="create-palette-button" onClick={handleCreateClick}>
              {ripples.map((ripple) => (
                <span
                  key={ripple.id}
                  className="ripple"
                  style={{ left: ripple.x, top: ripple.y }}
                />
              ))}
              <Plus size={18} />
              <span>新建色板</span>
            </button>

            <SegmentedControl
              options={sortOptions}
              value={sortMode}
              onChange={handleSortChange}
            />
          </div>

          <div className="grid-info">
            <h2 className="page-title">色板库</h2>
            <span className="palette-count">{filteredPalettes.length} 个色板</span>
          </div>

          <PaletteGrid
            sortKey={sortKey}
            onEdit={(palette) => setEditingPalette(palette)}
            onDelete={handleDelete}
          />

          {filteredPalettes.length === 0 && (
            <div className="empty-state">
              <p className="empty-text">
                {searchQuery.trim() ? '没有找到匹配的色板' : '暂无色板，点击右上角按钮创建第一个吧'}
              </p>
            </div>
          )}
        </div>
      </main>

      <CreatePaletteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <CreatePaletteModal
        isOpen={!!editingPalette}
        onClose={() => setEditingPalette(null)}
        onSubmit={handleEditSubmit}
        initialData={editingPalette || undefined}
        title="编辑色板"
      />
    </div>
  );
}
