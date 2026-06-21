import React, { useEffect } from 'react';
import Editor from './components/Editor';
import { useAppStore } from './store';
import { syncManager } from './syncManager';
import { HIGHLIGHT_COLORS } from './types';
import { Download, Users, FileText, Hash } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, Color } from 'pdf-lib';

interface CharPosition {
  xStart: number;
  xEnd: number;
}

interface LineOnPage {
  pageIndex: number;
  y: number;
  fontSize: number;
  chars: CharPosition[];
  startOffset: number;
  endOffset: number;
}

type FontMap = {
  regular: PDFFont;
  bold: PDFFont;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const LINE_HEIGHT_RATIO = 1.65;
const DEFAULT_FSIZE = 11;

async function exportToPDF() {
  const state = useAppStore.getState();
  state.setIsExporting(true);

  try {
    const pdfDoc = await PDFDocument.create();
    const fontMap: FontMap = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    };

    const pages: PDFPage[] = [];

    const getFont = (bold: boolean) => (bold ? fontMap.bold : fontMap.regular);

    const newPage = (): PDFPage => {
      const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
      pages.push(p);
      return p;
    };

    const pageY = new WeakMap<PDFPage, number>();
    const getY = (p: PDFPage) => pageY.get(p) ?? PAGE_H - MARGIN;
    const setY = (p: PDFPage, y: number) => pageY.set(p, y);

    const firstPage = newPage();
    setY(firstPage, PAGE_H - MARGIN);

    const linesOnPage: LineOnPage[] = [];
    let globalOffset = 0;

    const ensureSpace = (page: PDFPage, needHeight: number): { page: PDFPage; y: number } => {
      let y = getY(page);
      if (y - needHeight < MARGIN) {
        const np = newPage();
        setY(np, PAGE_H - MARGIN);
        return { page: np, y: PAGE_H - MARGIN };
      }
      return { page, y };
    };

    const wrapAndDrawLine = (
      text: string,
      opts: { bold?: boolean; size?: number; noCount?: boolean } = {}
    ) => {
      if (text.length === 0) {
        const cp = pages[pages.length - 1];
        const lh = (opts.size ?? DEFAULT_FSIZE) * LINE_HEIGHT_RATIO;
        const halfGap = lh / 2;
        const before = ensureSpace(cp, halfGap);
        setY(before.page, before.y - halfGap);
        return;
      }

      const fsize = opts.size ?? DEFAULT_FSIZE;
      const font = getFont(opts.bold ?? false);
      const contentW = PAGE_W - MARGIN * 2;
      const lh = fsize * LINE_HEIGHT_RATIO;

      const segments: string[] = [];
      let seg = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ' || ch === '　' || /[，。、！？；：,.!?;:]/.test(ch)) {
          seg += ch;
          segments.push(seg);
          seg = '';
        } else {
          seg += ch;
        }
      }
      if (seg) segments.push(seg);

      let currentPage = pages[pages.length - 1];
      let y = getY(currentPage);
      if (y - lh < MARGIN) {
        currentPage = newPage();
        y = PAGE_H - MARGIN;
      }

      let lineText = '';
      let lineXPositions: CharPosition[] = [];
      let xCursor = MARGIN;
      const lineStartOffset = opts.noCount ? -1 : globalOffset;
      let lineCharsCounted = 0;

      const flushVisualLine = () => {
        if (!lineText) return;
        currentPage.drawText(lineText, {
          x: MARGIN,
          y,
          size: fsize,
          font,
          color: rgb(0, 0, 0),
        });

        if (!opts.noCount) {
          linesOnPage.push({
            pageIndex: pages.indexOf(currentPage),
            y,
            fontSize: fsize,
            chars: lineXPositions,
            startOffset: lineStartOffset + lineCharsCounted - lineText.length,
            endOffset: lineStartOffset + lineCharsCounted,
          });
        }

        y -= lh;
        lineText = '';
        lineXPositions = [];
        xCursor = MARGIN;

        if (y - lh < MARGIN) {
          currentPage = newPage();
          y = PAGE_H - MARGIN;
        }
      };

      for (let k = 0; k < segments.length; k++) {
        const part = segments[k];
        const partW = font.widthOfTextAtSize(part, fsize);

        if (xCursor + partW > MARGIN + contentW && lineText) {
          flushVisualLine();
        }

        for (let ci = 0; ci < part.length; ci++) {
          const ch = part[ci];
          const cw = font.widthOfTextAtSize(ch, fsize);
          lineXPositions.push({ xStart: xCursor, xEnd: xCursor + cw });
          xCursor += cw;
          lineText += ch;
          if (!opts.noCount) {
            globalOffset++;
            lineCharsCounted++;
          }
        }
      }
      flushVisualLine();

      setY(currentPage, y);
    };

    const sectionGap = (gap: number) => {
      const cp = pages[pages.length - 1];
      const before = ensureSpace(cp, gap);
      setY(before.page, before.y - gap);
    };

    const renderParagraph = (raw: string) => {
      const line = raw.trimEnd();
      if (line.startsWith('# ')) {
        sectionGap(DEFAULT_FSIZE * LINE_HEIGHT_RATIO);
        wrapAndDrawLine(line.slice(2), { bold: true, size: 20 });
        sectionGap(8);
      } else if (line.startsWith('## ')) {
        sectionGap(DEFAULT_FSIZE * LINE_HEIGHT_RATIO * 0.6);
        wrapAndDrawLine(line.slice(3), { bold: true, size: 16 });
        sectionGap(6);
      } else if (line.startsWith('### ')) {
        sectionGap(DEFAULT_FSIZE * LINE_HEIGHT_RATIO * 0.4);
        wrapAndDrawLine(line.slice(4), { bold: true, size: 13 });
        sectionGap(4);
      } else if (line === '') {
        wrapAndDrawLine('');
      } else if (/^[-*] /.test(line)) {
        wrapAndDrawLine('• ' + line.replace(/^[-*] /, ''));
      } else {
        wrapAndDrawLine(line);
      }
    };

    const sourceLines = state.documentContent.split('\n');
    for (const line of sourceLines) {
      renderParagraph(line);
    }

    const hlColorMap = (hex: string): Color => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return rgb(r, g, b);
    };

    const sortedHighlights = [...state.highlights].sort(
      (a, b) => a.range.startOffset - b.range.startOffset
    );

    const highlightPageMap = new Map<string, number>();

    for (const hl of sortedHighlights) {
      const color = hlColorMap(HIGHLIGHT_COLORS[hl.color]);

      let firstPageForHighlight: number | null = null;

      for (const lr of linesOnPage) {
        if (hl.range.endOffset <= lr.startOffset) break;
        if (hl.range.startOffset >= lr.endOffset) continue;

        if (lr.pageIndex >= pages.length) continue;

        const localStart = Math.max(0, hl.range.startOffset - lr.startOffset);
        const localEnd = Math.min(lr.chars.length, hl.range.endOffset - lr.startOffset);
        if (localEnd <= localStart) continue;

        const startCh = lr.chars[localStart];
        const endCh = lr.chars[localEnd - 1];
        if (!startCh || !endCh) continue;

        const page = pages[lr.pageIndex];
        if (firstPageForHighlight === null) {
          firstPageForHighlight = lr.pageIndex;
        }

        const rectX = startCh.xStart;
        const rectY = lr.y - 2;
        const rectW = Math.max(endCh.xEnd - startCh.xStart, 0.5);
        const rectH = lr.fontSize + 4;

        page.drawRectangle({
          x: rectX,
          y: rectY,
          width: rectW,
          height: rectH,
          color,
          opacity: 0.3,
          borderWidth: 0,
        });
      }

      if (firstPageForHighlight !== null) {
        highlightPageMap.set(hl.id, firstPageForHighlight);
      }
    }

    const commentsByHl = new Map<string, typeof state.comments>();
    for (const c of state.comments) {
      if (!commentsByHl.has(c.highlightId)) commentsByHl.set(c.highlightId, []);
      commentsByHl.get(c.highlightId)!.push(c);
    }

    const footnoteHls = sortedHighlights.filter((hl) => (commentsByHl.get(hl.id) ?? []).length > 0);

    if (footnoteHls.length > 0) {
      let cp = pages[pages.length - 1];
      let cy = getY(cp);
      if (cy - 100 < MARGIN) {
        cp = newPage();
        cy = PAGE_H - MARGIN;
      }

      cy -= 16;
      cp.drawLine({
        start: { x: MARGIN, y: cy },
        end: { x: PAGE_W - MARGIN, y: cy },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      cy -= 16;

      cp.drawText('批注注释', {
        x: MARGIN,
        y: cy,
        size: 12,
        font: fontMap.bold,
        color: rgb(0, 0, 0),
      });
      cy -= 12 * LINE_HEIGHT_RATIO + 6;
      setY(cp, cy);

      const drawWrappedAt = (
        text: string,
        startX: number,
        startY: number,
        maxW: number,
        f: PDFFont,
        fsize: number,
        col: Color
      ): number => {
        const lh = fsize * LINE_HEIGHT_RATIO;
        let y = startY;
        let line = '';
        let curPage = pages[pages.length - 1];

        const flush = () => {
          if (!line) return;
          if (y - lh < MARGIN) {
            curPage = newPage();
            y = PAGE_H - MARGIN;
            setY(curPage, y);
          }
          curPage.drawText(line, { x: startX, y, size: fsize, font: f, color: col });
          y -= lh;
          line = '';
        };

        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (f.widthOfTextAtSize(line + ch, fsize) > maxW && line) flush();
          line += ch;
        }
        flush();
        setY(curPage, y);
        return y;
      };

      let idx = 1;
      for (const hl of footnoteHls) {
        cp = pages[pages.length - 1];
        cy = getY(cp);
        if (cy - 60 < MARGIN) {
          cp = newPage();
          cy = PAGE_H - MARGIN;
          setY(cp, cy);
        }

        const pageIdx = highlightPageMap.get(hl.id);
        const pageTag = pageIdx !== undefined ? ` (第${pageIdx + 1}页)` : '';
        const color = hlColorMap(HIGHLIGHT_COLORS[hl.color]);

        const headPrefix = `${idx}${pageTag}. `;
        const headPrefixW = fontMap.bold.widthOfTextAtSize(headPrefix, 10);
        cp.drawText(headPrefix, {
          x: MARGIN,
          y: cy,
          size: 10,
          font: fontMap.bold,
          color,
        });

        const snippetMax = 48;
        const snippet =
          hl.range.text.length > snippetMax
            ? hl.range.text.slice(0, snippetMax) + '...'
            : hl.range.text;

        const snippetW = (PAGE_W - MARGIN * 2) - headPrefixW;
        const afterSnippetY = drawWrappedAt(
          snippet,
          MARGIN + headPrefixW,
          cy,
          snippetW,
          fontMap.regular,
          10,
          rgb(0.45, 0.45, 0.45)
        );

        cy = afterSnippetY - 6;
        setY(cp, cy);

        const hlComments = commentsByHl.get(hl.id) ?? [];
        for (const c of hlComments) {
          cp = pages[pages.length - 1];
          cy = getY(cp);
          if (cy - 30 < MARGIN) {
            cp = newPage();
            cy = PAGE_H - MARGIN;
            setY(cp, cy);
          }

          const u = state.users.find((x) => x.id === c.userId) ?? state.currentUser;
          const userTag = `  ${u.nickname}: `;
          const tagW = fontMap.bold.widthOfTextAtSize(userTag, 9);
          cp.drawText(userTag, {
            x: MARGIN,
            y: cy,
            size: 9,
            font: fontMap.bold,
            color: rgb(0.3, 0.3, 0.3),
          });

          const commentMaxW = (PAGE_W - MARGIN * 2) - tagW;
          const afterCommentY = drawWrappedAt(
            c.content,
            MARGIN + tagW,
            cy,
            commentMaxW,
            fontMap.regular,
            9,
            rgb(0.25, 0.25, 0.25)
          );

          cy = afterCommentY - 6;
          setY(cp, cy);
        }

        cy -= 6;
        setY(cp, cy);
        idx++;
      }
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `标注文档_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('PDF导出失败', err);
    alert('PDF导出失败，请重试');
  } finally {
    useAppStore.getState().setIsExporting(false);
  }
}

const App: React.FC = () => {
  const roomId = useAppStore((s) => s.roomId);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const isExporting = useAppStore((s) => s.isExporting);

  useEffect(() => {
    syncManager.init(roomId);
    return () => syncManager.destroy();
  }, [roomId]);

  const allUsers = [currentUser, ...users.filter((u) => u.id !== currentUser.id)];

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="toolbar-left">
          <FileText size={20} color="#4A90D9" />
          <span className="toolbar-title">高亮协作</span>
        </div>
        <div className="toolbar-right">
          <div className="room-info">
            <Hash size={14} />
            <span>房间号</span>
            <span className="room-id">{roomId}</span>
          </div>
          <div className="user-avatars" title={`在线用户：${allUsers.map((u) => u.nickname).join('、')}`}>
            {allUsers.slice(0, 5).map((u) => (
              <div key={u.id} className="avatar" style={{ background: u.color }} title={u.nickname}>
                {u.nickname.charAt(0)}
              </div>
            ))}
            {allUsers.length > 5 && (
              <div className="avatar" style={{ background: '#9AA0A6' }} title={`还有${allUsers.length - 5}人`}>
                +{allUsers.length - 5}
              </div>
            )}
            <Users size={14} color="#9AA0A6" style={{ marginLeft: 8 }} />
          </div>
          <button className="export-btn" onClick={exportToPDF} disabled={isExporting}>
            {isExporting ? (
              <svg className="loading-spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path
                  d="M22 12a10 10 0 0 1-10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <Download size={14} />
            )}
            {isExporting ? '导出中...' : '导出PDF'}
          </button>
        </div>
      </div>
      <Editor />
    </div>
  );
};

export default App;
