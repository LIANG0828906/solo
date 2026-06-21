import type { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import type { Panel, Layer } from '../types';

const A4_WIDTH_PT = 841.89;
const A4_HEIGHT_PT = 595.28;
const PAGE_MARGIN_PT = 30;
const GAP_PT = 12;

const cameraLabelMap: Record<string, string> = {
  fixed: '固定',
  push: '推',
  pull: '拉',
  pan: '摇',
  move: '移',
  follow: '跟',
  lowAngle: '仰拍',
  highAngle: '俯拍',
};

const wrapText = (doc: PDFKit.PDFDocument, text: string, maxWidthPt: number): string[] => {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = '';
  for (const ch of chars) {
    const test = current + ch;
    const w = doc.widthOfString(test);
    if (w > maxWidthPt && current.length > 0) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
};

export const handleExportPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { panels } = req.body as { panels?: Panel[] };
    if (!Array.isArray(panels) || panels.length === 0) {
      res.status(400).json({ success: false, error: '没有可导出的分镜格子' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="storyboard_${new Date().toISOString().slice(0, 10)}.pdf"`,
    );

    const doc = new PDFDocument({
      size: [A4_WIDTH_PT, A4_HEIGHT_PT],
      margin: 0,
      info: { Title: '分镜脚本', Author: '漫画分镜脚本编辑器' },
    });
    doc.pipe(res);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fontPath = require.resolve('./NotoSansSC-Regular.woff');
      if (fontPath) doc.registerFont('zhSans', fontPath);
    } catch {
      // font file optional, fall back to Helvetica if missing
    }
    const FONT_FAMILY = 'Helvetica';
    doc.font(FONT_FAMILY);

    const sorted = [...panels].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 80) return a.y - b.y;
      return a.x - b.x;
    });

    const contentW = A4_WIDTH_PT - PAGE_MARGIN_PT * 2;
    const contentH = A4_HEIGHT_PT - PAGE_MARGIN_PT * 2 - 30;

    const cols = 3;
    const cellW = (contentW - GAP_PT * (cols - 1)) / cols;
    const cellH = cellW * 0.75;
    const rowsPerPage = Math.max(1, Math.floor((contentH + GAP_PT) / (cellH + 50 + GAP_PT)));
    const perPage = cols * rowsPerPage;

    let pageIndex = 0;

    const drawHeader = () => {
      doc.fontSize(14).fillColor('#2d2d2d').font(FONT_FAMILY);
      doc.text('分镜脚本 Storyboard', PAGE_MARGIN_PT, PAGE_MARGIN_PT - 6, {
        width: contentW,
        align: 'left',
      });
      doc.fontSize(9).fillColor('#999');
      doc.text(new Date().toLocaleDateString('zh-CN'), PAGE_MARGIN_PT, PAGE_MARGIN_PT - 6, {
        width: contentW,
        align: 'right',
      });
    };

    for (let i = 0; i < sorted.length; i += perPage) {
      if (pageIndex > 0) doc.addPage();
      drawHeader();
      pageIndex++;

      const pagePanels = sorted.slice(i, i + perPage);
      pagePanels.forEach((panel, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const cellX = PAGE_MARGIN_PT + c * (cellW + GAP_PT);
        const cellY = PAGE_MARGIN_PT + 24 + r * (cellH + 50 + GAP_PT);

        doc.save();
        doc
          .roundedRect(cellX, cellY, cellW, cellH, Math.max(2, panel.borderRadius * 0.25))
          .clip();
        if (panel.backgroundColor && panel.backgroundColor !== 'transparent') {
          doc.rect(cellX, cellY, cellW, cellH).fill(panel.backgroundColor);
        } else {
          doc.rect(cellX, cellY, cellW, cellH).fill('#ffffff');
        }
        doc.restore();

        doc.save();
        doc
          .lineWidth(0.5)
          .strokeColor('#cccccc')
          .roundedRect(cellX, cellY, cellW, cellH, Math.max(2, panel.borderRadius * 0.25))
          .stroke();
        doc.restore();

        doc.save();
        doc.roundedRect(cellX + 1, cellY + 1, cellW - 2, cellH - 2, Math.max(2, panel.borderRadius * 0.25)).clip();

        const layers = panel.layers || [];
        const scaleX = cellW / panel.width;
        const scaleY = cellH / panel.height;
        const s = Math.min(scaleX, scaleY);
        const offsetX = (cellW - panel.width * s) / 2;
        const offsetY = (cellH - panel.height * s) / 2;

        for (const layer of layers) {
          if (layer.type !== 'text' || !layer.style) continue;
          const lx = cellX + offsetX + layer.x * s;
          const ly = cellY + offsetY + layer.y * s;
          const fontSizePt = Math.max(6, (layer.style.fontSize / 96) * 72 * s);
          doc.fontSize(fontSizePt);
          doc.fillColor(layer.style.color || '#2d2d2d');
          const textMaxW = (panel.width - layer.x - 20) * s;
          const lines = wrapText(doc, layer.content, textMaxW);
          lines.forEach((line, ln) => {
            doc.text(line, lx, ly + ln * (fontSizePt * 1.4), {
              width: textMaxW,
              align: layer.style!.textAlign,
              height: fontSizePt * 1.4,
              lineGap: 0,
            });
          });
        }
        doc.restore();

        const noteY = cellY + cellH + 4;
        doc.fontSize(9).fillColor('#2d2d2d');
        let tagText = `#${i + idx + 1}`;
        if (panel.cameraType) {
          tagText += `  [${cameraLabelMap[panel.cameraType] || panel.cameraType}]`;
        }
        doc.text(tagText, cellX, noteY, { width: cellW });

        if (panel.cameraNote) {
          doc.fontSize(8).fillColor('#555');
          doc.text(panel.cameraNote, cellX, noteY + 12, {
            width: cellW,
            height: 32,
            lineGap: 2,
            ellipsis: true,
          });
        }
      });

      doc.fontSize(9).fillColor('#999');
      doc.text(`第 ${pageIndex} 页`, PAGE_MARGIN_PT, A4_HEIGHT_PT - 20, {
        width: contentW,
        align: 'right',
      });
    }

    doc.end();
  } catch (err) {
    console.error('[pdfService] export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: (err as Error).message });
    } else {
      try { res.end(); } catch {}
    }
  }
};
