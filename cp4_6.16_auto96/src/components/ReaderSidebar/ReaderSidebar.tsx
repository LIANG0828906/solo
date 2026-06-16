import { useState, useMemo } from 'react';
import { List, Highlighter } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ReaderEngine } from '@/modules/reader/ReaderEngine';
import type { Chapter, Highlight } from '@/types';
import './ReaderSidebar.css';

interface ReaderSidebarProps {
  chapters: Chapter[];
  currentChapterId: string;
  onChapterSelect: (chapterId: string) => void;
  memberId: string | null | undefined;
  clubId?: string;
}

type TabType = 'chapters' | 'highlights';

export default function ReaderSidebar({
  chapters,
  currentChapterId,
  onChapterSelect,
  memberId,
}: ReaderSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chapters');
  const { highlights, notes } = useAppStore();

  const chapterHighlightCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!memberId) return counts;
    
    highlights.forEach(h => {
      if (h.memberId === memberId) {
        counts[h.chapterId] = (counts[h.chapterId] || 0) + 1;
      }
    });
    return counts;
  }, [highlights, memberId]);

  const allHighlights = useMemo(() => {
    if (!memberId) return [] as Highlight[];
    return highlights
      .filter(h => h.memberId === memberId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [highlights, memberId]);

  const hasNote = (highlightId: string) => {
    if (!memberId) return false;
    return notes.some(n => n.highlightId === highlightId && n.memberId === memberId);
  };

  const getChapterByHighlight = (chapterId: string) => {
    return chapters.find(c => c.id === chapterId);
  };

  const handleHighlightClick = (highlight: Highlight) => {
    onChapterSelect(highlight.chapterId);
  };

  const getHighlightColorClass = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'background-color: var(--highlight-yellow)';
      case 'green':
        return 'background-color: var(--highlight-green)';
      case 'pink':
        return 'background-color: var(--highlight-pink)';
      default:
        return 'background-color: var(--highlight-yellow)';
    }
  };

  return (
    <aside className="reader-sidebar">
      <div className="reader-sidebar-tabs">
        <button
          className={`reader-sidebar-tab ${activeTab === 'chapters' ? 'active' : ''}`}
          onClick={() => setActiveTab('chapters')}
        >
          <List size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          目录
        </button>
        <button
          className={`reader-sidebar-tab ${activeTab === 'highlights' ? 'active' : ''}`}
          onClick={() => setActiveTab('highlights')}
        >
          <Highlighter size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          高亮
        </button>
      </div>

      <div className="reader-sidebar-content">
        {activeTab === 'chapters' && (
          <ul className="chapter-list">
            {chapters.map((chapter) => (
              <li
                key={chapter.id}
                className={`chapter-item ${chapter.id === currentChapterId ? 'active' : ''}`}
                onClick={() => onChapterSelect(chapter.id)}
              >
                <div className="chapter-item-info">
                  <span className="chapter-item-number">第 {chapter.chapterNumber} 章</span>
                  <span className="chapter-item-title">{chapter.title}</span>
                </div>
                {chapterHighlightCounts[chapter.id] > 0 && (
                  <span className="chapter-item-badge">
                    {chapterHighlightCounts[chapter.id]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'highlights' && (
          allHighlights.length > 0 ? (
            <ul className="highlight-list">
              {allHighlights.map((highlight) => {
                const chapter = getChapterByHighlight(highlight.chapterId);
                const noteExists = hasNote(highlight.id);
                return (
                  <li
                    key={highlight.id}
                    className={`highlight-item ${noteExists ? 'has-note' : ''}`}
                    onClick={() => handleHighlightClick(highlight)}
                  >
                    <div
                      className="highlight-item-color"
                      style={getHighlightColorClass(highlight.color)}
                    />
                    <div className="highlight-item-text">{highlight.text}</div>
                    <div className="highlight-item-chapter">
                      {chapter ? `第 ${chapter.chapterNumber} 章 · ${chapter.title}` : ''}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="sidebar-empty">
              <div className="sidebar-empty-icon">
                <Highlighter size={32} />
              </div>
              <div className="sidebar-empty-text">暂无高亮内容</div>
            </div>
          )
        )}
      </div>
    </aside>
  );
}
