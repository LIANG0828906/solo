import { useState, useCallback, useMemo } from "react";
import Reader from "./Reader";
import NoteDrawer from "./NoteDrawer";
import ReportGenerator from "./ReportGenerator";
import { sampleChapters, Chapter } from "./data";

export interface HighlightNote {
  id: string;
  chapterId: string;
  paragraphIndex: number;
  note: string;
}

type ViewMode = "reader" | "report";

export default function App() {
  const [chapters] = useState<Chapter[]>(sampleChapters);
  const [currentChapterId, setCurrentChapterId] = useState<string>(sampleChapters[0].id);
  const [highlights, setHighlights] = useState<HighlightNote[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("reader");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<{
    chapterId: string;
    paragraphIndex: number;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentHighlight = useMemo(() => {
    if (!activeTarget) return null;
    return (
      highlights.find(
        (h) =>
          h.chapterId === activeTarget.chapterId &&
          h.paragraphIndex === activeTarget.paragraphIndex
      ) || null
    );
  }, [activeTarget, highlights]);

  const handleParagraphDoubleClick = useCallback(
    (chapterId: string, paragraphIndex: number) => {
      setActiveTarget({ chapterId, paragraphIndex });
      setDrawerOpen(true);
    },
    []
  );

  const handleSaveNote = useCallback(
    (noteText: string) => {
      if (!activeTarget) return;

      setHighlights((prev) => {
        const existingIndex = prev.findIndex(
          (h) =>
            h.chapterId === activeTarget.chapterId &&
            h.paragraphIndex === activeTarget.paragraphIndex
        );

        if (noteText.trim() === "" && existingIndex >= 0) {
          return prev.filter((_, i) => i !== existingIndex);
        }

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            note: noteText,
          };
          return updated;
        }

        return [
          ...prev,
          {
            id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            chapterId: activeTarget.chapterId,
            paragraphIndex: activeTarget.paragraphIndex,
            note: noteText,
          },
        ];
      });

      setDrawerOpen(false);
      setActiveTarget(null);
    },
    [activeTarget]
  );

  const handleDeleteHighlight = useCallback(() => {
    if (!activeTarget) return;

    setHighlights((prev) =>
      prev.filter(
        (h) =>
          !(
            h.chapterId === activeTarget.chapterId &&
            h.paragraphIndex === activeTarget.paragraphIndex
          )
      )
    );
    setDrawerOpen(false);
    setActiveTarget(null);
  }, [activeTarget]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveTarget(null);
  }, []);

  const handleChapterSelect = useCallback((chapterId: string) => {
    setCurrentChapterId(chapterId);
    setSidebarOpen(false);
  }, []);

  const getChapterTitle = useCallback(
    (chapterId: string) => {
      return chapters.find((c) => c.id === chapterId)?.title || "";
    },
    [chapters]
  );

  const getParagraphText = useCallback(
    (chapterId: string, paragraphIndex: number) => {
      const chapter = chapters.find((c) => c.id === chapterId);
      return chapter?.paragraphs[paragraphIndex] || "";
    },
    [chapters]
  );

  const activeParagraphText = activeTarget
    ? getParagraphText(activeTarget.chapterId, activeTarget.paragraphIndex)
    : "";

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="菜单"
          >
            ☰
          </button>
          <h1 className="app-title">个性化阅读追踪器</h1>
        </div>
        <div className="header-actions">
          {viewMode === "reader" ? (
            <button
              className="generate-report-btn"
              onClick={() => setViewMode("report")}
            >
              📊 生成报告
            </button>
          ) : (
            <button
              className="back-btn"
              onClick={() => setViewMode("reader")}
            >
              ← 返回阅读
            </button>
          )}
        </div>
      </header>

      {viewMode === "reader" ? (
        <div className="main-layout">
          <div
            className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
            <div className="sidebar-title">目录</div>
            <ul className="toc-list">
              {chapters.map((chapter) => {
                const highlightCount = highlights.filter(
                  (h) => h.chapterId === chapter.id
                ).length;
                return (
                  <li
                    key={chapter.id}
                    className={`toc-item ${
                      currentChapterId === chapter.id ? "active" : ""
                    }`}
                    onClick={() => handleChapterSelect(chapter.id)}
                  >
                    <span>{chapter.title}</span>
                    {highlightCount > 0 && (
                      <span className="toc-badge">{highlightCount}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>

          <main className="reader-container">
            <Reader
              chapters={chapters}
              currentChapterId={currentChapterId}
              highlights={highlights}
              onParagraphDoubleClick={handleParagraphDoubleClick}
              onChapterChange={setCurrentChapterId}
            />
          </main>
        </div>
      ) : (
        <ReportGenerator
          chapters={chapters}
          highlights={highlights}
          getChapterTitle={getChapterTitle}
          getParagraphText={getParagraphText}
        />
      )}

      <NoteDrawer
        open={drawerOpen}
        paragraphText={activeParagraphText}
        existingNote={currentHighlight?.note || ""}
        onSave={handleSaveNote}
        onDelete={currentHighlight ? handleDeleteHighlight : undefined}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
