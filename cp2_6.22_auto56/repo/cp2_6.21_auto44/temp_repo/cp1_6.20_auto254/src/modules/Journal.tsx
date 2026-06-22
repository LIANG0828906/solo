import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Cover from '@/modules/Cover';
import PageEditor from '@/modules/PageEditor';
import { useJournalStore } from '@/store/useJournalStore';

type ViewMode = 'cover' | 'pages';

const BookmarkRibbon = ({ active }: { active: boolean }) => (
  <svg
    className="h-7 w-5 transition-transform duration-200 hover:scale-110"
    viewBox="0 0 24 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="bookmark-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF69B4" />
        <stop offset="100%" stopColor="#9C27B0" />
      </linearGradient>
    </defs>
    <path
      d="M2 0 H22 V30 L12 22 L2 30 Z"
      fill="url(#bookmark-gradient)"
      opacity={active ? 1 : 0.35}
    />
  </svg>
);

export default function Journal() {
  const [viewMode, setViewMode] = useState<ViewMode>('cover');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionOpacity, setTransitionOpacity] = useState(1);

  const present = useJournalStore((state) => state.present);
  const setCurrentPage = useJournalStore((state) => state.setCurrentPage);
  const toggleBookmark = useJournalStore((state) => state.toggleBookmark);

  const { title, coverTemplate, pages, currentPageId } = present;

  const currentPageIndex = pages.findIndex((p) => p.id === currentPageId);
  const currentPage = currentPageIndex >= 0 ? pages[currentPageIndex] : pages[0];

  const mapTemplate = (tpl: string): 'fabric' | 'starry' | 'gradient' => {
    if (tpl === 'starry' || tpl === 'gradient') return tpl;
    return 'fabric';
  };

  const handleFlipCover = useCallback(() => {
    setIsTransitioning(true);
    setTransitionOpacity(0);
    setTimeout(() => {
      setViewMode('pages');
      setTransitionOpacity(1);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }, 200);
  }, []);

  const handleBackToCover = useCallback(() => {
    setIsTransitioning(true);
    setTransitionOpacity(0);
    setTimeout(() => {
      setViewMode('cover');
      setTransitionOpacity(1);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }, 200);
  }, []);

  const goToPage = useCallback(
    (index: number) => {
      if (index < 0 || index >= pages.length || index === currentPageIndex) return;
      setIsTransitioning(true);
      setTransitionOpacity(0);
      setTimeout(() => {
        setCurrentPage(pages[index].id);
        setTransitionOpacity(1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 200);
      }, 200);
    },
    [pages, currentPageIndex, setCurrentPage]
  );

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      goToPage(currentPageIndex - 1);
    }
  }, [currentPageIndex, goToPage]);

  const handleNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      goToPage(currentPageIndex + 1);
    }
  }, [currentPageIndex, pages.length, goToPage]);

  const handleToggleBookmark = useCallback(() => {
    if (currentPage) {
      toggleBookmark(currentPage.id);
    }
  }, [currentPage, toggleBookmark]);

  const goToBookmark = useCallback(() => {
    if (!currentPage?.bookmarked) {
      const nextBookmarked = pages.findIndex(
        (p, idx) => idx > currentPageIndex && p.bookmarked
      );
      if (nextBookmarked >= 0) {
        goToPage(nextBookmarked);
        return;
      }
      const firstBookmarked = pages.findIndex((p) => p.bookmarked);
      if (firstBookmarked >= 0 && firstBookmarked !== currentPageIndex) {
        goToPage(firstBookmarked);
      }
    }
  }, [pages, currentPageIndex, currentPage, goToPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'pages') return;
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'Escape') {
        handleBackToCover();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handlePrevPage, handleNextPage, handleBackToCover]);

  const coverDate =
    pages.length > 0
      ? pages[0].date
      : new Date().toISOString().split('T')[0];

  return (
    <div className="relative">
      <div
        className={cn(
          'transition-opacity duration-200 ease-in-out'
        )}
        style={{ opacity: transitionOpacity }}
      >
        {viewMode === 'cover' ? (
          <Cover
            template={mapTemplate(coverTemplate)}
            title={title}
            date={coverDate}
            onFlip={handleFlipCover}
          />
        ) : (
          <div className="flex flex-col">
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={handleBackToCover}
                className="text-sm text-[#5a7d5a]/70 underline-offset-4 transition-colors duration-200 hover:text-[#3d4f3d] hover:underline"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                返回封面
              </button>
            </div>
            {currentPage && <PageEditor />}
          </div>
        )}
      </div>

      {viewMode === 'pages' && (
        <nav
          className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#D7CCC8] bg-[#FFF8E1]/95 px-4 py-2 shadow-lg backdrop-blur"
          aria-label="页面导航"
        >
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPageIndex <= 0 || isTransitioning}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200',
              currentPageIndex <= 0 || isTransitioning
                ? 'text-[#5a7d5a]/20 cursor-not-allowed'
                : 'text-[#5a7d5a] hover:bg-[#E8DCC8]'
            )}
            aria-label="上一页"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="min-w-[60px] text-center text-sm font-medium text-[#3d4f3d] tabular-nums" style={{ fontFamily: "'Patrick Hand', cursive" }}>
            {currentPageIndex + 1} / {pages.length}
          </span>

          <button
            type="button"
            onClick={() => {
              handleToggleBookmark();
              goToBookmark();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 hover:bg-[#E8DCC8]"
            aria-label={currentPage?.bookmarked ? '取消书签 / 跳转到下一个书签' : '添加书签'}
          >
            <BookmarkRibbon active={currentPage?.bookmarked ?? false} />
          </button>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPageIndex >= pages.length - 1 || isTransitioning}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200',
              currentPageIndex >= pages.length - 1 || isTransitioning
                ? 'text-[#5a7d5a]/20 cursor-not-allowed'
                : 'text-[#5a7d5a] hover:bg-[#E8DCC8]'
            )}
            aria-label="下一页"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      )}
    </div>
  );
}
