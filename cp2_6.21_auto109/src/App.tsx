import React, { useEffect } from 'react';
import Editor from './components/Editor';
import { useAppStore } from './store';
import { syncManager } from './syncManager';
import { HIGHLIGHT_COLORS, Highlight } from './types';
import { Download, Users, FileText, Hash } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, Color } from 'pdf-lib';

interface LineInfo {
  text: string;
  y: number;
  x: number;
  size: number;
  bold: boolean;
  charWidths: number[];
}

async function exportToPDF() {
  const state = useAppStore.getState();
  state.setIsExporting(true);

  setTimeout(async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let page = pdfDoc.addPage([595.28, 841.89]);
      const { width } = page.getSize();
      const margin = 50;
      let y = page.getHeight() - margin;
      const fontSize = 11;
      const lineHeight = 18;
      const lines: LineInfo[] = [];

      const getFont = (bold: boolean) => (bold ? helveticaBold : helveticaFont);

      const addLine = (text: string, yPos: number, xPos: number, size: number, bold: boolean) => {
        const font = getFont(bold);
        const charWidths: number[] = [];
        for (let i = 0; i < text.length; i++) {
          charWidths.push(font.widthOfTextAtSize(text[i], size));
        }
        lines.push({ text, y: yPos, x: xPos, size, bold, charWidths });
      };

      const drawText = (
        text: string,
        opts: { bold?: boolean; size?: number; color?: Color; noAdd?: boolean } = {}
      ): number => {
        const fsize = opts.size ?? fontSize;
        const font = getFont(opts.bold ?? false);
        const color = opts.color ?? rgb(0, 0, 0);
        const maxWidth = width - margin * 2;
        let currentY = y;
        let line = '';
        let lineStartX = margin;

        const flushLine = () => {
          if (line) {
            if (currentY - fsize < margin) {
              page = pdfDoc.addPage([595.28, 841.89]);
              currentY = page.getHeight() - margin;
            }
            page.drawText(line, { x: lineStartX, y: currentY, size: fsize, font, color });
            if (!opts.noAdd) {
              addLine(line, currentY, lineStartX, fsize, opts.bold ?? false);
            }
            currentY -= lineHeight;
            line = '';
          }
        };

        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const testLine = line + ch;
          if (font.widthOfTextAtSize(testLine, fsize) > maxWidth && line) {
            flushLine();
          }
          line += ch;
        }
        flushLine();

        y = currentY;
        return y;
      };

      const drawNewPageIfNeeded = (need: number) => {
        if (y - need < margin) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }
      };

      const textLines = state.documentContent.split('\n');
      for (const rawLine of textLines) {
        const line = rawLine.trimEnd();
        if (line.startsWith('# ')) {
          drawNewPageIfNeeded(40);
          y = drawText(line.slice(2), { bold: true, size: 20 });
          y -= 8;
        } else if (line.startsWith('## ')) {
          drawNewPageIfNeeded(32);
          y = drawText(line.slice(3), { bold: true, size: 16 });
          y -= 6;
        } else if (line.startsWith('### ')) {
          drawNewPageIfNeeded(26);
          y = drawText(line.slice(4), { bold: true, size: 13 });
          y -= 4;
        } else if (line === '') {
          y -= lineHeight / 2;
        } else if (/^[-*] /.test(line)) {
          drawNewPageIfNeeded(lineHeight);
          y = drawText('• ' + line.replace(/^[-*] /, ''));
        } else if (/^\d+\. /.test(line)) {
          drawNewPageIfNeeded(lineHeight);
          y = drawText(line);
        } else {
          drawNewPageIfNeeded(lineHeight);
          y = drawText(line);
        }
      }

      let docTextOffset = 0;
      const lineOffsets: { line: LineInfo; startOffset: number; endOffset: number }[] = [];
      for (const line of lines) {
        lineOffsets.push({
          line,
          startOffset: docTextOffset,
          endOffset: docTextOffset + line.text.length,
        });
        docTextOffset += line.text.length + 1;
      }

      const sortedHighlights = [...state.highlights].sort(
        (a, b) => a.range.startOffset - b.range.startOffset
      );

      for (const hl of sortedHighlights) {
        const colorHex = HIGHLIGHT_COLORS[hl.color];
        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;

        for (const lo of lineOffsets) {
          if (hl.range.endOffset <= lo.startOffset) break;
          if (hl.range.startOffset >= lo.endOffset) continue;

          const localStart = Math.max(0, hl.range.startOffset - lo.startOffset);
          const localEnd = Math.min(lo.line.text.length, hl.range.endOffset - lo.startOffset);

          let startX = lo.line.x;
          for (let i = 0; i < localStart && i < lo.line.charWidths.length; i++) {
            startX += lo.line.charWidths[i];
          }

          let endX = startX;
          for (let i = localStart; i < localEnd && i < lo.line.charWidths.length; i++) {
            endX += lo.line.charWidths[i];
          }

          const rectY = lo.line.y - 2;
          const rectHeight = lo.line.size + 4;

          page.drawRectangle({
            x: startX,
            y: rectY,
            width: Math.max(endX - startX, 1),
            height: rectHeight,
            color: rgb(r, g, b),
            opacity: 0.3,
            borderWidth: 0,
          });
        }
      }

      const commentsByHighlight = new Map<string, typeof state.comments>();
      for (const c of state.comments) {
        if (!commentsByHighlight.has(c.highlightId)) {
          commentsByHighlight.set(c.highlightId, []);
        }
        commentsByHighlight.get(c.highlightId)!.push(c);
      }

      const hasFootnotes = state.highlights.length > 0 && state.comments.length > 0;
      if (hasFootnotes) {
        if (y - 40 < margin) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }

        y -= 20;
        page.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
        y -= 12;

        drawText('批注注释', { bold: true, size: 12, noAdd: true });
        y -= 4;

        let footnoteIdx = 1;
        for (const hl of state.highlights) {
          const hlComments = commentsByHighlight.get(hl.id) ?? [];
          if (hlComments.length === 0) continue;

          const colorHex = HIGHLIGHT_COLORS[hl.color];
          const r = parseInt(colorHex.slice(1, 3), 16) / 255;
          const g = parseInt(colorHex.slice(3, 5), 16) / 255;
          const b = parseInt(colorHex.slice(5, 7), 16) / 255;

          if (y - 60 < margin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = page.getHeight() - margin;
          }

          const marker = `${footnoteIdx}. `;
          const markerWidth = helveticaBold.widthOfTextAtSize(marker, 10);

          page.drawText(marker, {
            x: margin,
            y,
            size: 10,
            font: helveticaBold,
            color: rgb(r, g, b),
          });

          const snippetMaxLen = 40;
          const snippet =
            hl.range.text.length > snippetMaxLen
              ? hl.range.text.substring(0, snippetMaxLen) + '...'
              : hl.range.text;

          page.drawText(snippet, {
            x: margin + markerWidth,
            y,
            size: 10,
            font: helveticaFont,
            color: rgb(0.4, 0.4, 0.4),
          });
          y -= 14;

          for (const c of hlComments) {
            if (y - 28 < margin) {
              page = pdfDoc.addPage([595.28, 841.89]);
              y = page.getHeight() - margin;
            }

            const user = state.users.find((u) => u.id === c.userId) ?? state.currentUser;
            const prefix = `  ${user.nickname}: `;
            page.drawText(prefix, {
              x: margin,
              y,
              size: 9,
              font: helveticaBold,
              color: rgb(0.3, 0.3, 0.3),
            });

            const prefixWidth = helveticaBold.widthOfTextAtSize(prefix, 9);
            const maxCommentWidth = width - margin * 2 - prefixWidth;
            let commentLine = '';
            let commentY = y;

            const wrapAndDrawComment = () => {
              if (commentLine) {
                if (commentY - 9 < margin) {
                  page = pdfDoc.addPage([595.28, 841.89]);
                  commentY = page.getHeight() - margin;
                }
                page.drawText(commentLine, {
                  x: margin + prefixWidth,
                  y: commentY,
                  size: 9,
                  font: helveticaFont,
                  color: rgb(0.3, 0.3, 0.3),
                });
                commentY -= 13;
                commentLine = '';
              }
            };

            for (let i = 0; i < c.content.length; i++) {
              const ch = c.content[i];
              const testLine = commentLine + ch;
              if (helveticaFont.widthOfTextAtSize(testLine, 9) > maxCommentWidth && commentLine) {
                wrapAndDrawComment();
              }
              commentLine += ch;
            }
            wrapAndDrawComment();
            y = commentY;
            y -= 4;
          }
          y -= 6;
          footnoteIdx++;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
  }, 600);
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
