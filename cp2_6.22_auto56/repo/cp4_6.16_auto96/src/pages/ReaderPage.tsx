import { useState, useEffect, useMemo } from 'react';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import ReaderSidebar from '@/components/ReaderSidebar/ReaderSidebar';
import ReadingArea from '@/components/ReadingArea/ReadingArea';
import type { Chapter } from '@/types';
import './ReaderPage.css';

interface ReaderPageProps {
  bookId?: string;
  chapterId?: string;
  clubId?: string;
}

export default function ReaderPage({ bookId, chapterId, clubId }: ReaderPageProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(chapterId || null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');

  const { chapters, books, currentMemberMap } = useAppStore();

  const currentBook = useMemo(() => {
    if (bookId) {
      return books.find(b => b.id === bookId);
    }
    return books[0];
  }, [books, bookId]);

  const bookChapters = useMemo(() => {
    if (!currentBook) return [] as Chapter[];
    return chapters
      .filter(c => c.bookId === currentBook.id)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }, [chapters, currentBook]);

  const currentChapter = useMemo(() => {
    if (currentChapterId) {
      return chapters.find(c => c.id === currentChapterId);
    }
    return bookChapters[0];
  }, [chapters, currentChapterId, bookChapters]);

  const currentChapterIndex = useMemo(() => {
    if (!currentChapter) return -1;
    return bookChapters.findIndex(c => c.id === currentChapter.id);
  }, [currentChapter, bookChapters]);

  const memberId = useMemo(() => {
    if (clubId) {
      return currentMemberMap[clubId];
    }
    return null;
  }, [clubId, currentMemberMap]);

  useEffect(() => {
    if (!currentChapterId && bookChapters.length > 0) {
      setCurrentChapterId(bookChapters[0].id);
    }
  }, [currentChapterId, bookChapters]);

  const handleChapterSelect = (chapterId: string) => {
    if (chapterId === currentChapterId) return;

    const targetIndex = bookChapters.findIndex(c => c.id === chapterId);
    const direction = targetIndex > currentChapterIndex ? 'left' : 'right';
    
    setTransitionDirection(direction);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentChapterId(chapterId);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 10);
    }, 150);
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex <= 0) return;
    const prevChapter = bookChapters[currentChapterIndex - 1];
    handleChapterSelect(prevChapter.id);
  };

  const handleNextChapter = () => {
    if (currentChapterIndex >= bookChapters.length - 1) return;
    const nextChapter = bookChapters[currentChapterIndex + 1];
    handleChapterSelect(nextChapter.id);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="reader-page">
      <div
        className={`reader-sidebar-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{ width: sidebarCollapsed ? 0 : 300 }}
      >
        {!sidebarCollapsed && (
          <ReaderSidebar
            chapters={bookChapters}
            currentChapterId={currentChapter?.id || ''}
            onChapterSelect={handleChapterSelect}
            memberId={memberId}
            clubId={clubId}
          />
        )}
      </div>

      <div className="reader-main">
        <header className="reader-header">
          <div className="reader-header-left">
            <button className="reader-toggle-btn" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <div>
              <div className="reader-book-title">
                {currentBook?.title || '阅读器'}
              </div>
              <div className="reader-chapter-title">
                {currentChapter?.title || ''}
              </div>
            </div>
          </div>
          <div className="reader-header-right">
            <button
              className="reader-nav-btn"
              onClick={handlePrevChapter}
              disabled={currentChapterIndex <= 0}
            >
              <ChevronLeft size={18} />
              上一章
            </button>
            <button
              className="reader-nav-btn"
              onClick={handleNextChapter}
              disabled={currentChapterIndex >= bookChapters.length - 1}
            >
              下一章
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        <div className="reader-content">
          {currentChapter && memberId && (
            <ReadingArea
              chapter={currentChapter}
              memberId={memberId}
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
