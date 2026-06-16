import { ChevronLeft, ChevronRight, BookMarked } from 'lucide-react';
import { ClubManager } from '@/modules/club/ClubManager';
import type { Book } from '@/types';
import './ChapterProgress.css';

interface ChapterProgressProps {
  clubId: string;
  currentChapter: number;
  book: Book | undefined;
  onChapterChange?: (chapter: number) => void;
}

const ChapterProgress = ({ clubId, currentChapter, book, onChapterChange }: ChapterProgressProps) => {
  const totalChapters = book?.totalChapters || 0;
  const percentage = totalChapters > 0 ? ((currentChapter - 1) / (totalChapters - 1)) * 100 : 0;

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      const newChapter = currentChapter - 1;
      ClubManager.updateCurrentChapter(clubId, newChapter);
      onChapterChange?.(newChapter);
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < totalChapters) {
      const newChapter = currentChapter + 1;
      ClubManager.updateCurrentChapter(clubId, newChapter);
      onChapterChange?.(newChapter);
    }
  };

  return (
    <div className="chapter-progress">
      <div className="chapter-progress-header">
        <span className="chapter-progress-title">
          <BookMarked size={18} style={{ marginRight: 6 }} />
          阅读进度
        </span>
        <span className="chapter-progress-info">
          第 {currentChapter} / {totalChapters} 章
        </span>
      </div>

      <div className="chapter-progress-bar">
        <div
          className="chapter-progress-fill"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="chapter-marker"
          style={{ left: `${percentage}%` }}
        />
      </div>

      <div className="chapter-labels">
        <span>第1章</span>
        <span>第{totalChapters}章</span>
      </div>

      <div className="chapter-controls">
        <button
          className="chapter-btn"
          onClick={handlePrevChapter}
          disabled={currentChapter <= 1}
          aria-label="上一章"
        >
          <ChevronLeft className="chapter-btn-icon" />
        </button>
        <button
          className="chapter-btn"
          onClick={handleNextChapter}
          disabled={currentChapter >= totalChapters}
          aria-label="下一章"
        >
          <ChevronRight className="chapter-btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default ChapterProgress;
