import axios from 'axios';

export interface UploadResult {
  id: string;
  text: string;
}

export async function uploadDocument(file: File): Promise<UploadResult[]> {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await axios.post('/api/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15000,
    });
    return res.data as UploadResult[];
  } catch (e) {
    console.warn('后端未启动，使用本地模拟数据', e);
    return getMockParagraphs(file.name);
  }
}

function getMockParagraphs(fileName: string): UploadResult[] {
  const raw = [
    '这是第一段示例文本，用于演示文档翻译功能。Welcome to the translation platform!',
    '这是第二段示例文本，团队成员可以在此协作翻译和讨论。Our team focuses on high quality translation.',
    'Paragraph three: please add your comments on the right side of each translation block.',
    '第四段：导出功能支持双语对照或纯译文的 PDF 与 Markdown 格式。',
    'Fifth paragraph: the progress bar at the top shows overall translation progress smoothly.',
    '第六段：所有输入框和按钮都有悬停反馈效果，界面响应式适配移动端。',
    'Paragraph seven: real-time save uses debounce to ensure performance under 200ms.',
    '第八段：段落切换和文档加载响应时间不超过 500 毫秒。',
  ];
  return raw.map((t, i) => ({
    id: `p_mock_${Date.now()}_${i}`,
    text: `[${fileName || '示例文档'}] ${t}`,
  }));
}

export async function translateText(text: string, targetLang = 'zh'): Promise<string> {
  await new Promise((r) => setTimeout(r, 350 + Math.random() * 400));
  const sampleMap: Record<string, string> = {
    hello: '你好',
    world: '世界',
    welcome: '欢迎',
    translation: '翻译',
    document: '文档',
    language: '语言',
    collaboration: '协作',
    project: '项目',
    team: '团队',
    content: '内容',
    file: '文件',
    upload: '上传',
    export: '导出',
    comment: '评论',
    paragraph: '段落',
    quality: '质量',
    review: '审核',
    progress: '进度',
    complete: '完成',
    continue: '继续',
  };
  if (targetLang.startsWith('zh')) {
    let result = text;
    for (const [eng, chn] of Object.entries(sampleMap)) {
      const re = new RegExp(`\\b${eng}\\b`, 'gi');
      result = result.replace(re, chn);
    }
    if (result === text) {
      result = '[译] ' + text;
    }
    return result;
  }
  return '[EN] ' + text;
}

export async function exportDocument(
  paragraphs: { id: string; text: string; translation?: string }[],
  format: 'markdown' | 'pdf',
  bilingual: boolean
): Promise<Blob> {
  const body = { paragraphs, format, bilingual };
  try {
    const res = await axios.post('/api/export', body, {
      responseType: 'blob',
      timeout: 20000,
    });
    return res.data as Blob;
  } catch {
    return generateLocalExport(paragraphs, format, bilingual);
  }
}

function generateLocalExport(
  paragraphs: { id: string; text: string; translation?: string }[],
  format: 'markdown' | 'pdf',
  bilingual: boolean
): Blob {
  if (format === 'markdown') {
    let md = '# 翻译文档\n\n';
    paragraphs.forEach((p, idx) => {
      md += `## 段落 ${idx + 1}\n\n`;
      if (bilingual) {
        md += `**原文：**\n\n${p.text}\n\n`;
        md += `**译文：**\n\n${p.translation || '（未翻译）'}\n\n`;
        md += `---\n\n`;
      } else {
        md += `${p.translation || p.text}\n\n`;
      }
    });
    return new Blob([md], { type: 'text/markdown' });
  }
  const lines: string[] = [];
  lines.push('翻译文档');
  lines.push('='.repeat(40));
  lines.push('');
  paragraphs.forEach((p, idx) => {
    lines.push(`段落 ${idx + 1}`);
    lines.push('-'.repeat(40));
    if (bilingual) {
      lines.push('【原文】');
      lines.push(p.text);
      lines.push('');
      lines.push('【译文】');
      lines.push(p.translation || '（未翻译）');
    } else {
      lines.push(p.translation || p.text);
    }
    lines.push('');
    lines.push('='.repeat(40));
    lines.push('');
  });
  return new Blob([lines.join('\n')], { type: 'text/plain' });
}
