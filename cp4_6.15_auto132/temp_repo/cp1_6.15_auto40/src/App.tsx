import { useState, useEffect, useMemo } from 'react';
import ThemeToggle from './components/ThemeToggle';
import WorksGrid from './components/WorksGrid';
import WorkDetail from './components/WorkDetail';
import { works, allTags, type Work } from './data/works';
import { Aperture } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterKey, setFilterKey] = useState(0);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
    setFilterKey((prev) => prev + 1);
  };

  const clearTags = () => {
    setSelectedTags([]);
    setFilterKey((prev) => prev + 1);
  };

  const filteredWorks = useMemo(() => {
    if (selectedTags.length === 0) return works;
    return works.filter((work) =>
      selectedTags.every((tag) => work.tags.includes(tag))
    );
  }, [selectedTags]);

  const handleWorkClick = (work: Work) => {
    setSelectedWork(work);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300 ease-in-out"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <header
        className="sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ease-in-out"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-color)' }}
              >
                <Aperture size={20} color="#ffffff" />
              </div>
              <h1
                className="text-xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                创意作品集
              </h1>
            </div>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        <section className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            发现创意之美
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            探索摄影师与插画师们的精彩作品，感受每一幅作品背后的故事与情感
          </p>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              标签筛选
            </h3>
            {selectedTags.length > 0 && (
              <button
                onClick={clearTags}
                className="text-sm font-medium transition-colors duration-300 hover:opacity-80"
                style={{ color: 'var(--accent-color)' }}
              >
                清除全部
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--accent-color)'
                      : 'var(--bg-secondary)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {selectedTags.length > 0 && (
            <p
              className="mt-3 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              已选择 {selectedTags.length} 个标签，共 {filteredWorks.length} 个作品
            </p>
          )}
        </section>

        <WorksGrid
          works={filteredWorks}
          onWorkClick={handleWorkClick}
          filterKey={filterKey}
        />
      </main>

      <footer
        className="mt-16 py-8 border-t transition-colors duration-300 ease-in-out"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            © 2024 创意作品集 · 用镜头和画笔记录美好
          </p>
        </div>
      </footer>

      <WorkDetail
        work={selectedWork}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
