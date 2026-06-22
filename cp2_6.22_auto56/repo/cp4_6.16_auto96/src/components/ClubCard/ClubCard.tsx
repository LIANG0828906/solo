import { Users, BookOpen, Award } from 'lucide-react';
import BookCover from '@/components/BookCover/BookCover';
import { useAppStore } from '@/store/useAppStore';
import type { Club } from '@/types';
import './ClubCard.css';

interface ClubCardProps {
  club: Club;
  onClick?: () => void;
}

export default function ClubCard({ club, onClick }: ClubCardProps) {
  const books = useAppStore(state => state.books);
  const members = useAppStore(state => state.members);

  const currentBook = books.find(b => b.id === club.currentBookId);
  const memberCount = members.filter(m => m.clubId === club.id).length;

  const progress = currentBook
    ? Math.round((club.currentChapter / currentBook.totalChapters) * 100)
    : 0;

  return (
    <div className="club-card" onClick={onClick}>
      <div className="club-card-cover">
        {currentBook ? (
          <BookCover seed={currentBook.coverSeed} title={currentBook.title} size="md" />
        ) : (
          <div className="club-card-cover-placeholder">
            <BookOpen size={28} />
            <span>暂无书籍</span>
          </div>
        )}
      </div>

      <div className="club-card-content">
        <h3 className="club-card-name">{club.name}</h3>

        <div className="club-card-info">
          <div className="club-card-info-item">
            <Users size={14} />
            <span>{memberCount} 位成员</span>
          </div>
        </div>

        {currentBook && (
          <div className="club-card-book">
            <div className="club-card-book-title">
              <BookOpen size={13} />
              <span>{currentBook.title}</span>
            </div>
            <div className="club-card-progress">
              <div className="club-card-progress-bar">
                <div
                  className="club-card-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="club-card-progress-text">
                第 {club.currentChapter} 章 / 共 {currentBook.totalChapters} 章
              </span>
            </div>
          </div>
        )}

        {!currentBook && (
          <div className="club-card-empty-book">
            <Award size={14} />
            <span>等待开启第一本书</span>
          </div>
        )}
      </div>
    </div>
  );
}
