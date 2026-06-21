import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { generateResumeData, ResumeData, ResumeInput } from './resumeDataGenerator';
import { polishResume, PolishSuggestion } from './smartPolisher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/generate', (req: express.Request, res: express.Response) => {
  const { name, phone, email, targetPosition, templateId } = req.body as ResumeInput;

  if (!name || !targetPosition || !templateId) {
    res.status(400).json({ error: '缺少必填字段：name, targetPosition, templateId' });
    return;
  }

  const resumeData = generateResumeData({ name, phone, email, targetPosition, templateId });
  res.json(resumeData);
});

app.post('/api/polish', (req: express.Request, res: express.Response) => {
  const resumeData = req.body as ResumeData;

  if (!resumeData || !resumeData.sections || !Array.isArray(resumeData.sections)) {
    res.status(400).json({ error: '缺少有效的简历结构化数据' });
    return;
  }

  const suggestions: PolishSuggestion[] = polishResume(resumeData);
  res.json({ suggestions });
});

app.post('/api/export', async (req: express.Request, res: express.Response) => {
  const { resumeData, templateId, name, targetPosition, format } = req.body as {
    resumeData: ResumeData;
    templateId: string;
    name: string;
    targetPosition: string;
    format: 'pdf' | 'txt';
  };

  if (!resumeData || !templateId || !name || !targetPosition || !format) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  if (format === 'pdf') {
    try {
      const pdfBuffer = await generatePDF(resumeData, templateId, name, targetPosition);
      const filename = encodeURIComponent(`${name}_${targetPosition}_简历.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error('PDF生成失败:', err);
      res.status(500).json({ error: 'PDF生成失败' });
    }
    return;
  }

  if (format === 'txt') {
    const txtContent = generateTXT(resumeData, name, targetPosition);
    const filename = encodeURIComponent(`${name}_${targetPosition}_简历.txt`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
    res.send(txtContent);
    return;
  }

  res.status(400).json({ error: '不支持的导出格式，仅支持 pdf 或 txt' });
});

const TEMPLATE_COLORS: Record<string, { titleColor: string; accentColor: string; fontFamily: string }> = {
  business: { titleColor: '#1E293B', accentColor: '#3B82F6', fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif' },
  creative: { titleColor: '#BE123C', accentColor: '#E11D48', fontFamily: '"Noto Serif SC", "STSong", serif' },
  tech:     { titleColor: '#059669', accentColor: '#10B981', fontFamily: '"Fira Code", "Source Code Pro", "Noto Sans SC", monospace' },
};

async function generatePDF(resumeData: ResumeData, templateId: string, name: string, targetPosition: string): Promise<Buffer> {
  const colors = TEMPLATE_COLORS[templateId] || TEMPLATE_COLORS.business;
  const html = buildResumeHTML(resumeData, colors, name, targetPosition);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '60px', bottom: '60px', left: '50px', right: '50px' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:9px;color:#9CA3AF;padding:0 50px;display:flex;justify-content:space-between;">
          <span>${name} - ${targetPosition}</span>
          <span>追光简历生成器</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-size:9px;color:#9CA3AF;padding:0 50px;display:flex;justify-content:center;">
          <span>第 <span class="pageNumber"></span> / <span class="totalPages"></span> 页</span>
        </div>`,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function buildResumeHTML(
  resumeData: ResumeData,
  colors: { titleColor: string; accentColor: string; fontFamily: string },
  name: string,
  targetPosition: string,
): string {
  const sectionsHTML = resumeData.sections.map(section => {
    const isPersonal = /个人信息/.test(section.title);
    const itemsHTML = section.items.map(item => {
      if (isPersonal) {
        return `<span style="margin-right:16px;font-size:13px;color:#374151;">${item.value}</span>`;
      }
      const isBold = item.style?.fontWeight === '600' || item.style?.fontWeight === '700';
      if (isBold) {
        return `<div style="font-weight:600;font-size:14px;color:#111827;margin-top:10px;margin-bottom:4px;">${item.value}</div>`;
      }
      return `<div style="font-size:13px;color:#4B5563;line-height:1.8;margin-left:8px;">${item.value}</div>`;
    }).join('\n');

    return `
      <div style="margin-bottom:18px;">
        <div style="font-size:16px;font-weight:700;color:${colors.titleColor};border-bottom:2px solid ${colors.accentColor};padding-bottom:4px;margin-bottom:8px;font-family:${colors.fontFamily};">
          ${section.title}
        </div>
        <div>${itemsHTML}</div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${colors.fontFamily};
      color: #1F2937;
      padding: 20px;
      line-height: 1.6;
    }
    .resume-header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid ${colors.accentColor};
    }
    .resume-header h1 {
      font-size: 26px;
      font-weight: 700;
      color: ${colors.titleColor};
      margin-bottom: 4px;
    }
    .resume-header .subtitle {
      font-size: 14px;
      color: #6B7280;
    }
    .two-col {
      display: flex;
      gap: 30px;
    }
    .two-col .col-left {
      flex: 1;
    }
    .two-col .col-right {
      width: 200px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="resume-header">
    <h1>${name}</h1>
    <div class="subtitle">${targetPosition}</div>
  </div>
  <div class="two-col">
    <div class="col-left">
      ${sectionsHTML}
    </div>
    <div class="col-right">
    </div>
  </div>
</body>
</html>`;
}

function generateTXT(resumeData: ResumeData, name: string, targetPosition: string): string {
  const lines: string[] = [];
  lines.push(`${name} - ${targetPosition}`);
  lines.push('');
  lines.push('---');

  for (const section of resumeData.sections) {
    lines.push('');
    lines.push(`【${section.title}】`);
    lines.push('');
    for (const item of section.items) {
      lines.push(`  ${item.value}`);
    }
    lines.push('');
    lines.push('---');
  }

  lines.push('');
  lines.push('由追光简历生成器导出');
  return lines.join('\n');
}

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req: express.Request, res: express.Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`追光简历生成器后端服务已启动：http://localhost:${PORT}`);
});
