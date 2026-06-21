import { useState, useMemo, useCallback } from "react";
import { saveAs } from "file-saver";
import { Chapter } from "./data";
import { HighlightNote } from "./App";

interface ReportGeneratorProps {
  chapters: Chapter[];
  highlights: HighlightNote[];
  getChapterTitle: (chapterId: string) => string;
  getParagraphText: (chapterId: string, paragraphIndex: number) => string;
}

interface GroupedHighlights {
  chapterId: string;
  chapterTitle: string;
  items: Array<{
    highlight: HighlightNote;
    paragraphText: string;
  }>;
}

export default function ReportGenerator({
  chapters,
  highlights,
  getChapterTitle,
  getParagraphText,
}: ReportGeneratorProps) {
  const [showProgress, setShowProgress] = useState(false);
  const [progressActive, setProgressActive] = useState(false);

  const groupedHighlights = useMemo<GroupedHighlights[]>(() => {
    const map = new Map<string, GroupedHighlights>();

    chapters.forEach((chapter) => {
      map.set(chapter.id, {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        items: [],
      });
    });

    highlights.forEach((hl) => {
      const group = map.get(hl.chapterId);
      if (group) {
        group.items.push({
          highlight: hl,
          paragraphText: getParagraphText(hl.chapterId, hl.paragraphIndex),
        });
      }
    });

    const result = chapters
      .map((c) => map.get(c.id)!)
      .filter((g) => g.items.length > 0);

    result.forEach((g) => {
      g.items.sort((a, b) => a.highlight.paragraphIndex - b.highlight.paragraphIndex);
    });

    return result;
  }, [chapters, highlights, getParagraphText]);

  const totalHighlights = highlights.length;

  const generateHTMLContent = useCallback(() => {
    const today = new Date().toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let chaptersHTML = "";
    groupedHighlights.forEach((group) => {
      let itemsHTML = "";
      group.items.forEach((item) => {
        const safeParagraph = escapeHtml(item.paragraphText);
        const safeNote = escapeHtml(item.highlight.note);
        const hasNote = item.highlight.note.trim().length > 0;
        itemsHTML += `
          <div style="margin-bottom: 20px; padding: 16px; border-radius: 6px; background: #fafaf7; border: 1px solid rgba(0,0,0,0.04);">
            <div style="background: rgba(255, 235, 59, 0.3); padding: 12px 14px; border-radius: 4px; line-height: 1.7; font-size: 0.95rem; color: #333; margin-bottom: 12px;">
              ${safeParagraph}
            </div>
            ${
              hasNote
                ? `<div style="background: rgba(74, 144, 217, 0.06); border-left: 3px solid #4a90d9; padding: 10px 14px; border-radius: 0 4px 4px 0;">
              <div style="font-size: 0.75rem; color: #4a90d9; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">📝 笔记</div>
              <div style="font-size: 0.9rem; line-height: 1.6; color: #444;">${safeNote}</div>
            </div>`
                : ""
            }
          </div>
        `;
      });

      chaptersHTML += `
        <div style="background: #fff; border-radius: 8px; padding: 28px 32px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05);">
          <h3 style="font-size: 1.2rem; font-weight: 700; color: #4a90d9; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid rgba(74, 144, 217, 0.2);">
            📖 ${escapeHtml(group.chapterTitle)}
          </h3>
          ${itemsHTML}
        </div>
      `;
    });

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>阅读报告 - ${today}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: linear-gradient(135deg, #f5f5dc 0%, #e8e4d4 100%);
    margin: 0;
    padding: 40px 24px;
    color: #333;
  }
  .container { max-width: 860px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 40px; }
  .header h1 { font-size: 1.8rem; font-weight: 700; color: #222; margin-bottom: 8px; }
  .header p { font-size: 0.9rem; color: #888; }
  .footer { text-align: center; padding: 32px 0; color: #aaa; font-size: 0.8rem; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 阅读报告</h1>
      <p>生成日期：${today} · 共 ${totalHighlights} 处高亮笔记</p>
    </div>
    ${chaptersHTML || '<div style="text-align:center;padding:80px 20px;color:#999;">暂无高亮笔记</div>'}
    <div class="footer">由个性化阅读追踪器生成 · 保留所有阅读记忆</div>
  </div>
</body>
</html>`;
  }, [groupedHighlights, totalHighlights]);

  const handleExport = useCallback(() => {
    setShowProgress(true);
    setProgressActive(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setProgressActive(true);
      });
    });

    setTimeout(() => {
      const html = generateHTMLContent();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
      saveAs(blob, `阅读报告_${dateStr}.html`);

      setTimeout(() => {
        setShowProgress(false);
        setProgressActive(false);
      }, 400);
    }, 1550);
  }, [generateHTMLContent]);

  return (
    <div className="report-container">
      <div className="report-header">
        <h1 className="report-title">📚 阅读报告</h1>
        <p className="report-subtitle">
          共 {totalHighlights} 处高亮笔记 · 覆盖 {groupedHighlights.length} 个章节
        </p>
      </div>

      {groupedHighlights.length === 0 ? (
        <div className="report-empty">
          <div className="report-empty-icon">📝</div>
          <p>还没有任何高亮笔记</p>
          <p style={{ marginTop: 8, fontSize: "0.85rem" }}>
            返回阅读，双击任意段落即可添加高亮和笔记
          </p>
        </div>
      ) : (
        groupedHighlights.map((group) => (
          <div key={group.chapterId} className="report-chapter">
            <h3 className="report-chapter-title">📖 {group.chapterTitle}</h3>
            {group.items.map((item) => (
              <div key={item.highlight.id} className="report-item">
                <div className="report-paragraph">{item.paragraphText}</div>
                {item.highlight.note.trim().length > 0 && (
                  <div className="report-note">
                    <div className="report-note-label">📝 笔记</div>
                    <div className="report-note-content">
                      {item.highlight.note}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      <div className="report-footer">
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={totalHighlights === 0}
          style={totalHighlights === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          ⬇️ 导出为 HTML
        </button>
        {showProgress && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className={`progress-fill ${progressActive ? "active" : ""}`}
              />
            </div>
            <div className="progress-text">
              {progressActive ? "正在生成文件…" : "准备导出…"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
