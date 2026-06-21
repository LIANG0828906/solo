import { useState, useMemo, useEffect, useCallback } from "react";
import { Chapter } from "./data";
import { HighlightNote } from "./App";

interface ReaderProps {
  chapters: Chapter[];
  currentChapterId: string;
  highlights: HighlightNote[];
  onParagraphDoubleClick: (chapterId: string, paragraphIndex: number) => void;
  onChapterChange: (chapterId: string) => void;
}

const PARAGRAPHS_PER_PAGE = 4;

export default function Reader({
  chapters,
  currentChapterId,
  highlights,
  onParagraphDoubleClick,
  onChapterChange,
}: ReaderProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const currentChapter = useMemo(
    () => chapters.find((c) => c.id === currentChapterId) || chapters[0],
    [chapters, currentChapterId]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(currentChapter.paragraphs.length / PARAGRAPHS_PER_PAGE)
  );

  const currentChapterIndex = chapters.findIndex(
    (c) => c.id === currentChapterId
  );

  useEffect(() => {
    setCurrentPage(0);
    setAnimationKey((k) => k + 1);
  }, [currentChapterId]);

  const visibleParagraphs = useMemo(() => {
    const start = currentPage * PARAGRAPHS_PER_PAGE;
    return currentChapter.paragraphs
      .slice(start, start + PARAGRAPHS_PER_PAGE)
      .map((text, i) => ({
        text,
        globalIndex: start + i,
      }));
  }, [currentChapter.paragraphs, currentPage]);

  const scrollToTop = useCallback(() => {
    const container = document.querySelector(".reader-container");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      setAnimationKey((k) => k + 1);
      scrollToTop();
    },
    [scrollToTop]
  );

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    } else if (currentChapterIndex > 0) {
      const prevChapter = chapters[currentChapterIndex - 1];
      const prevTotalPages = Math.ceil(
        prevChapter.paragraphs.length / PARAGRAPHS_PER_PAGE
      );
      onChapterChange(prevChapter.id);
      setTimeout(() => {
        setCurrentPage(prevTotalPages - 1);
        setAnimationKey((k) => k + 1);
        scrollToTop();
      }, 50);
    }
  }, [currentPage, currentChapterIndex, chapters, onChapterChange, goToPage, scrollToTop]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    } else if (currentChapterIndex < chapters.length - 1) {
      onChapterChange(chapters[currentChapterIndex + 1].id);
      setTimeout(() => {
        setCurrentPage(0);
        setAnimationKey((k) => k + 1);
        scrollToTop();
      }, 50);
    }
  }, [currentPage, totalPages, currentChapterIndex, chapters, onChapterChange, goToPage, scrollToTop]);

  const isHighlighted = useCallback(
    (paragraphIndex: number) => {
      return highlights.some(
        (h) =>
          h.chapterId === currentChapterId && h.paragraphIndex === paragraphIndex
      );
    },
    [highlights, currentChapterId]
  );

  const getNoteForParagraph = useCallback(
    (paragraphIndex: number) => {
      const hl = highlights.find(
        (h) =>
          h.chapterId === currentChapterId && h.paragraphIndex === paragraphIndex
      );
      return hl?.note || "";
    },
    [highlights, currentChapterId]
  );

  const isFirstPage = currentPage === 0 && currentChapterIndex === 0;
  const isLastPage =
    currentPage === totalPages - 1 &&
    currentChapterIndex === chapters.length - 1;

  return (
    <div className="reader-content">
      <h2 className="chapter-title">{currentChapter.title}</h2>

      <div className="paragraphs-wrapper" key={animationKey}>
        {visibleParagraphs.map(({ text, globalIndex }) => {
          const highlighted = isHighlighted(globalIndex);
          const note = getNoteForParagraph(globalIndex);
          const hasNote = note.length > 0;
          return (
            <div
              key={globalIndex}
              className={`paragraph ${highlighted ? "highlighted" : ""}`}
              onDoubleClick={() =>
                onParagraphDoubleClick(currentChapterId, globalIndex)
              }
            >
              {hasNote && (
                <>
                  <div className="note-indicator" />
                  <div className="note-tooltip">
                    {note.slice(0, 30)}
                    {note.length > 30 ? "…" : ""}
                  </div>
                </>
              )}
              {text}
            </div>
          );
        })}
      </div>

      <div className="pagination">
        <button
          className="page-btn"
          onClick={goToPrevPage}
          disabled={isFirstPage}
        >
          ‹ 上一页
        </button>
        <div className="page-info">
          第 {currentPage + 1} / {totalPages} 页
        </div>
        <button
          className="page-btn"
          onClick={goToNextPage}
          disabled={isLastPage}
        >
          下一页 ›
        </button>
      </div>
    </div>
  );
}
