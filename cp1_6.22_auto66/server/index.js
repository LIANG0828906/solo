import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

app.post('/api/export-pdf', (req, res) => {
  try {
    const { frames } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ success: false, error: '帧数据无效' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=storyboard-script.pdf');

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('故事板脚本', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`总帧数: ${frames.length}`, { align: 'center' });
    doc.moveDown(2);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    frames.forEach((frame, index) => {
      if (index > 0) {
        doc.moveDown(1);
      }

      const timestamp = formatTimestamp(index * 2);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#4a9eff')
        .text(`第 ${index + 1} 帧`, { continued: true });
      doc.fontSize(11).font('Helvetica').fillColor('#888888')
        .text(`  [${timestamp}]`, { align: 'right' });

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eeeeee').stroke();
      doc.moveDown(0.5);

      const description = htmlToText(frame.description || '（无描述）');
      doc.fontSize(11).font('Helvetica').fillColor('#333333').text(description, {
        lineGap: 4,
      });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eeeeee').dash(2, { space: 4 }).stroke();
      doc.undash();

      if (index < frames.length - 1 && doc.y > 700) {
        doc.addPage();
      }
    });

    doc.end();
  } catch (error) {
    console.error('PDF生成错误:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'PDF生成失败' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`故事板后端服务已启动: http://localhost:${PORT}`);
});
