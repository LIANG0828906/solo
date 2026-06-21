import React, { useEffect } from 'react';
import Editor from './components/Editor';
import { useAppStore } from './store';
import { syncManager } from './syncManager';
import { HIGHLIGHT_COLORS } from './types';
import { Download, Users, FileText, Hash } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, Color } from 'pdf-lib';

function exportToPDF() {
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

      const drawText = (text: string, opts: { bold?: boolean; size?: number; color?: Color } = {}) => {
        const fsize = opts.size ?? fontSize;
        const font = opts.bold ? helveticaBold : helveticaFont;
        const color = opts.color ?? rgb(0, 0, 0);
        const maxWidth = width - margin * 2;
        const words = text.split('');
        let line = '';
        for (const ch of words) {
          const testLine = line + ch;
          if (font.widthOfTextAtSize(testLine, fsize) > maxWidth && line) {
            if (y - fsize < margin) {
              page = pdfDoc.addPage([595.28, 841.89]);
              y = page.getHeight() - margin;
            }
            page.drawText(line, { x: margin, y, size: fsize, font, color });
            y -= lineHeight;
            line = ch;
          } else {
            line = testLine;
          }
        }
        if (line) {
          if (y - fsize < margin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = page.getHeight() - margin;
          }
          page.drawText(line, { x: margin, y, size: fsize, font, color });
          y -= lineHeight;
        }
        return y;
      };

      const drawNewPageIfNeeded = (need: number) => {
        if (y - need < margin) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }
      };

      const lines = state.documentContent.split('\n');
      for (const rawLine of lines) {
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

      if (state.highlights.length > 0) {
        drawNewPageIfNeeded(60);
        y -= 20;
        drawText('—— 标注与批注 ——', { bold: true, size: 14 });
        y -= 10;

        state.highlights.forEach((hl, idx) => {
          drawNewPageIfNeeded(120);
          const colorHex = HIGHLIGHT_COLORS[hl.color];
          const r = parseInt(colorHex.slice(1, 3), 16) / 255;
          const g = parseInt(colorHex.slice(3, 5), 16) / 255;
          const b = parseInt(colorHex.slice(5, 7), 16) / 255;

          drawText(`${idx + 1}. [高亮] ${hl.range.text}`, { color: rgb(r, g, b) });
          y -= 4;
          const hlComments = state.comments.filter((c) => c.highlightId === hl.id);
          hlComments.forEach((c) => {
            const user = state.users.find((u) => u.id === c.userId) ?? state.currentUser;
            drawNewPageIfNeeded(lineHeight * 2);
            y = drawText(`   - ${user.nickname}: ${c.content}`, { size: 10 });
          });
          y -= 6;
        });
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
  }, 800);
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
