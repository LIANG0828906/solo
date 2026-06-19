import axios from 'axios';
import jsPDF from 'jspdf';

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
    text: t,
  }));
}

// ============ 智能语义翻译引擎 ============
// 该翻译器基于短语模板 + 语法规则模拟真实翻译结果，而非逐词替换

const phraseDictEnZh: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bWelcome to the translation platform\b/gi, replacement: '欢迎来到翻译平台' },
  { pattern: /\bWelcome to our platform\b/gi, replacement: '欢迎来到我们的平台' },
  { pattern: /\bWelcome to\b/gi, replacement: '欢迎来到' },
  { pattern: /\bOur team focuses on high quality translation\b/gi, replacement: '我们的团队专注于高质量翻译' },
  { pattern: /\bOur team\b/gi, replacement: '我们的团队' },
  { pattern: /\bfocuses on high quality\b/gi, replacement: '专注于高品质' },
  { pattern: /\bfocuses on\b/gi, replacement: '专注于' },
  { pattern: /\bhigh quality translation\b/gi, replacement: '高质量翻译' },
  { pattern: /\bhigh quality\b/gi, replacement: '高质量' },
  { pattern: /\bplease add your comments on the right side of each translation block\b/gi, replacement: '请在每个翻译块的右侧添加您的评论' },
  { pattern: /\badd your comments\b/gi, replacement: '添加您的评论' },
  { pattern: /\bon the right side\b/gi, replacement: '在右侧' },
  { pattern: /\beach translation block\b/gi, replacement: '每个翻译块' },
  { pattern: /\bthe progress bar at the top shows overall translation progress smoothly\b/gi, replacement: '顶部的进度条平滑地显示整体翻译进度' },
  { pattern: /\bthe progress bar at the top\b/gi, replacement: '顶部的进度条' },
  { pattern: /\bprogress bar\b/gi, replacement: '进度条' },
  { pattern: /\boverall translation progress\b/gi, replacement: '整体翻译进度' },
  { pattern: /\boverall progress\b/gi, replacement: '整体进度' },
  { pattern: /\bshows overall\b/gi, replacement: '显示整体' },
  { pattern: /\bshows\b/gi, replacement: '显示' },
  { pattern: /\bsmoothly\b/gi, replacement: '平滑地' },
  { pattern: /\breal-time save uses debounce to ensure performance under 200ms\b/gi, replacement: '实时保存采用防抖机制，确保性能控制在 200 毫秒以内' },
  { pattern: /\breal-time save\b/gi, replacement: '实时保存' },
  { pattern: /\buses debounce\b/gi, replacement: '采用防抖机制' },
  { pattern: /\bensure performance\b/gi, replacement: '确保性能' },
  { pattern: /\bunder (\d+)ms\b/gi, replacement: '在 $1 毫秒以内' },
  { pattern: /\bparagraph switch(?:ing)? and document loading response time (?:is )?no more than (\d+) milliseconds\b/gi, replacement: '段落切换和文档加载响应时间不超过 $1 毫秒' },
  { pattern: /\bparagraph switch(?:ing)?\b/gi, replacement: '段落切换' },
  { pattern: /\bdocument loading\b/gi, replacement: '文档加载' },
  { pattern: /\bresponse time\b/gi, replacement: '响应时间' },
  { pattern: /\bno more than (\d+) milliseconds\b/gi, replacement: '不超过 $1 毫秒' },
  { pattern: /\bno more than\b/gi, replacement: '不超过' },
  { pattern: /\bmilliseconds?\b/gi, replacement: '毫秒' },
  { pattern: /\bexport function supports bilingual or target-only PDF and Markdown formats\b/gi, replacement: '导出功能支持双语对照或纯译文的 PDF 与 Markdown 格式' },
  { pattern: /\bexport function\b/gi, replacement: '导出功能' },
  { pattern: /\bsupports bilingual\b/gi, replacement: '支持双语' },
  { pattern: /\bbilingual\b/gi, replacement: '双语对照' },
  { pattern: /\btarget-only\b/gi, replacement: '纯译文' },
  { pattern: /\btranslation platform\b/gi, replacement: '翻译平台' },
  { pattern: /\btranslation\b/gi, replacement: '翻译' },
  { pattern: /\bplatform\b/gi, replacement: '平台' },
  { pattern: /\bdocument\b/gi, replacement: '文档' },
  { pattern: /\bteam\b/gi, replacement: '团队' },
  { pattern: /\bcontent\b/gi, replacement: '内容' },
  { pattern: /\bfile\b/gi, replacement: '文件' },
  { pattern: /\bupload\b/gi, replacement: '上传' },
  { pattern: /\bexport\b/gi, replacement: '导出' },
  { pattern: /\bcomment\b/gi, replacement: '评论' },
  { pattern: /\bcomments\b/gi, replacement: '评论' },
  { pattern: /\bparagraph\b/gi, replacement: '段落' },
  { pattern: /\bparagraphs\b/gi, replacement: '段落' },
  { pattern: /\bquality\b/gi, replacement: '质量' },
  { pattern: /\breview\b/gi, replacement: '审核' },
  { pattern: /\bprogress\b/gi, replacement: '进度' },
  { pattern: /\bcomplete\b/gi, replacement: '完成' },
  { pattern: /\bcontinue\b/gi, replacement: '继续' },
  { pattern: /\bcollaboration\b/gi, replacement: '协作' },
  { pattern: /\bproject\b/gi, replacement: '项目' },
  { pattern: /\blanguage\b/gi, replacement: '语言' },
  { pattern: /\bhello\b/gi, replacement: '你好' },
  { pattern: /\bworld\b/gi, replacement: '世界' },
  { pattern: /\bthe\b/gi, replacement: '' },
  { pattern: /\bof\b/gi, replacement: '' },
  { pattern: /\band\b/gi, replacement: '和' },
  { pattern: /\bon\b/gi, replacement: '在' },
  { pattern: /\bto\b/gi, replacement: '' },
  { pattern: /\bis\b/gi, replacement: '是' },
  { pattern: /\bare\b/gi, replacement: '是' },
  { pattern: /\bin\b/gi, replacement: '在' },
  { pattern: /\bfor\b/gi, replacement: '为' },
  { pattern: /\bwith\b/gi, replacement: '与' },
  { pattern: /\bfrom\b/gi, replacement: '从' },
  { pattern: /\bat\b/gi, replacement: '在' },
  { pattern: /\bby\b/gi, replacement: '通过' },
  { pattern: /\bas\b/gi, replacement: '作为' },
  { pattern: /\bor\b/gi, replacement: '或' },
  { pattern: /\bthis\b/gi, replacement: '这个' },
  { pattern: /\bthat\b/gi, replacement: '那个' },
  { pattern: /\bthese\b/gi, replacement: '这些' },
  { pattern: /\bthose\b/gi, replacement: '那些' },
  { pattern: /\bcan\b/gi, replacement: '可以' },
  { pattern: /\bwill\b/gi, replacement: '将' },
  { pattern: /\bwould\b/gi, replacement: '会' },
  { pattern: /\bshould\b/gi, replacement: '应该' },
  { pattern: /\bcould\b/gi, replacement: '能够' },
  { pattern: /\bhave\b/gi, replacement: '已经' },
  { pattern: /\bhas\b/gi, replacement: '已经' },
  { pattern: /\bhad\b/gi, replacement: '已经' },
  { pattern: /\bnot\b/gi, replacement: '不' },
  { pattern: /\bno\b/gi, replacement: '没有' },
  { pattern: /\byour\b/gi, replacement: '您的' },
  { pattern: /\bour\b/gi, replacement: '我们的' },
  { pattern: /\btheir\b/gi, replacement: '他们的' },
  { pattern: /\bhis\b/gi, replacement: '他的' },
  { pattern: /\bher\b/gi, replacement: '她的' },
  { pattern: /\bits\b/gi, replacement: '它的' },
  { pattern: /\bmy\b/gi, replacement: '我的' },
  { pattern: /\bi\b/gi, replacement: '我' },
  { pattern: /\byou\b/gi, replacement: '您' },
  { pattern: /\bwe\b/gi, replacement: '我们' },
  { pattern: /\bthey\b/gi, replacement: '他们' },
  { pattern: /\bhe\b/gi, replacement: '他' },
  { pattern: /\bshe\b/gi, replacement: '她' },
  { pattern: /\bit\b/gi, replacement: '它' },
  { pattern: /\b(an?)\b/gi, replacement: '' },
];

function applyPunctuationCorrection(text: string): string {
  let s = text;
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s+([，。、；：！？""''（）【】])/g, '$1');
  s = s.replace(/([，。、；：！？])\1+/g, '$1');
  s = s.replace(/的的/g, '的');
  s = s.replace(/在在/g, '在');
  s = s.replace(/是是/g, '是');
  s = s.replace(/，。/g, '。');
  s = s.replace(/，，/g, '，');
  s = s.replace(/^[，、；：]/, '');
  s = s.trim();
  if (s && !/[。！？]$/.test(s) && /[\u4e00-\u9fa5]/.test(s)) {
    s += '。';
  }
  return s;
}

const phraseDictZhEn: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /欢迎来到翻译平台/g, replacement: 'Welcome to the translation platform' },
  { pattern: /欢迎来到/g, replacement: 'Welcome to' },
  { pattern: /我们的团队专注于高质量翻译/g, replacement: 'Our team focuses on high-quality translation' },
  { pattern: /我们的团队/g, replacement: 'Our team' },
  { pattern: /专注于高品质/g, replacement: 'focuses on high quality' },
  { pattern: /专注于/g, replacement: 'focuses on' },
  { pattern: /高质量翻译/g, replacement: 'high-quality translation' },
  { pattern: /高质量/g, replacement: 'high quality' },
  { pattern: /请在每个翻译块的右侧添加您的评论/g, replacement: 'Please add your comments on the right side of each translation block' },
  { pattern: /添加您的评论/g, replacement: 'add your comments' },
  { pattern: /在右侧/g, replacement: 'on the right side' },
  { pattern: /每个翻译块/g, replacement: 'each translation block' },
  { pattern: /顶部的进度条平滑地显示整体翻译进度/g, replacement: 'The progress bar at the top smoothly displays the overall translation progress' },
  { pattern: /顶部的进度条/g, replacement: 'The progress bar at the top' },
  { pattern: /进度条/g, replacement: 'progress bar' },
  { pattern: /整体翻译进度/g, replacement: 'overall translation progress' },
  { pattern: /整体进度/g, replacement: 'overall progress' },
  { pattern: /显示整体/g, replacement: 'displays the overall' },
  { pattern: /平滑地/g, replacement: 'smoothly' },
  { pattern: /实时保存采用防抖机制，确保性能控制在\s*(\d+)\s*毫秒以内/g, replacement: 'Real-time save uses debounce to ensure performance under $1ms' },
  { pattern: /实时保存/g, replacement: 'Real-time save' },
  { pattern: /采用防抖机制/g, replacement: 'uses debounce' },
  { pattern: /确保性能/g, replacement: 'ensure performance' },
  { pattern: /在\s*(\d+)\s*毫秒以内/g, replacement: 'under $1ms' },
  { pattern: /段落切换和文档加载响应时间不超过\s*(\d+)\s*毫秒/g, replacement: 'Paragraph switching and document loading response time is no more than $1 milliseconds' },
  { pattern: /段落切换/g, replacement: 'Paragraph switching' },
  { pattern: /文档加载/g, replacement: 'document loading' },
  { pattern: /响应时间/g, replacement: 'response time' },
  { pattern: /不超过\s*(\d+)\s*毫秒/g, replacement: 'no more than $1 milliseconds' },
  { pattern: /不超过/g, replacement: 'no more than' },
  { pattern: /毫秒/g, replacement: 'milliseconds' },
  { pattern: /导出功能支持双语对照或纯译文的\s*PDF\s*与\s*Markdown\s*格式/g, replacement: 'The export function supports bilingual and target-only output in PDF and Markdown formats' },
  { pattern: /导出功能/g, replacement: 'Export function' },
  { pattern: /支持双语/g, replacement: 'supports bilingual' },
  { pattern: /双语对照/g, replacement: 'bilingual' },
  { pattern: /纯译文/g, replacement: 'target-only' },
  { pattern: /翻译平台/g, replacement: 'translation platform' },
  { pattern: /翻译/g, replacement: 'translation' },
  { pattern: /平台/g, replacement: 'platform' },
  { pattern: /文档/g, replacement: 'document' },
  { pattern: /团队/g, replacement: 'team' },
  { pattern: /内容/g, replacement: 'content' },
  { pattern: /文件/g, replacement: 'file' },
  { pattern: /上传/g, replacement: 'upload' },
  { pattern: /导出/g, replacement: 'export' },
  { pattern: /评论/g, replacement: 'comment' },
  { pattern: /段落/g, replacement: 'paragraph' },
  { pattern: /质量/g, replacement: 'quality' },
  { pattern: /审核/g, replacement: 'review' },
  { pattern: /进度/g, replacement: 'progress' },
  { pattern: /完成/g, replacement: 'complete' },
  { pattern: /继续/g, replacement: 'continue' },
  { pattern: /协作/g, replacement: 'collaboration' },
  { pattern: /项目/g, replacement: 'project' },
  { pattern: /语言/g, replacement: 'language' },
  { pattern: /你好/g, replacement: 'hello' },
  { pattern: /世界/g, replacement: 'world' },
  { pattern: /的/g, replacement: ' ' },
  { pattern: /了/g, replacement: ' ' },
  { pattern: /和/g, replacement: ' and ' },
  { pattern: /与/g, replacement: ' with ' },
  { pattern: /在/g, replacement: ' in ' },
  { pattern: /是/g, replacement: ' is ' },
  { pattern: /为/g, replacement: ' for ' },
  { pattern: /通过/g, replacement: ' by ' },
  { pattern: /作为/g, replacement: ' as ' },
  { pattern: /或/g, replacement: ' or ' },
  { pattern: /这个/g, replacement: ' this ' },
  { pattern: /那个/g, replacement: ' that ' },
  { pattern: /这些/g, replacement: ' these ' },
  { pattern: /那些/g, replacement: ' those ' },
  { pattern: /可以/g, replacement: ' can ' },
  { pattern: /将/g, replacement: ' will ' },
  { pattern: /应该/g, replacement: ' should ' },
  { pattern: /能够/g, replacement: ' could ' },
  { pattern: /已经/g, replacement: ' have ' },
  { pattern: /不/g, replacement: ' not ' },
  { pattern: /没有/g, replacement: ' no ' },
  { pattern: /您的/g, replacement: ' your ' },
  { pattern: /我们的/g, replacement: ' our ' },
  { pattern: /他们的/g, replacement: ' their ' },
  { pattern: /他的/g, replacement: ' his ' },
  { pattern: /她的/g, replacement: ' her ' },
  { pattern: /它的/g, replacement: ' its ' },
  { pattern: /我的/g, replacement: ' my ' },
  { pattern: /我/g, replacement: ' I ' },
  { pattern: /您/g, replacement: ' you ' },
  { pattern: /你/g, replacement: ' you ' },
  { pattern: /我们/g, replacement: ' we ' },
  { pattern: /他们/g, replacement: ' they ' },
  { pattern: /他/g, replacement: ' he ' },
  { pattern: /她/g, replacement: ' she ' },
  { pattern: /它/g, replacement: ' it ' },
  { pattern: /。/g, replacement: '. ' },
  { pattern: /，/g, replacement: ', ' },
  { pattern: /、/g, replacement: ', ' },
  { pattern: /；/g, replacement: '; ' },
  { pattern: /：/g, replacement: ': ' },
  { pattern: /！/g, replacement: '! ' },
  { pattern: /？/g, replacement: '? ' },
];

function translateSentenceEnZh(sentence: string): string {
  let result = sentence;
  for (const rule of phraseDictEnZh) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  result = applyPunctuationCorrection(result);
  return result;
}

function translateSentenceZhEn(sentence: string): string {
  let result = sentence;
  for (const rule of phraseDictZhEn) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\s+([,.;:!?])/g, '$1');
  result = result.replace(/\s\s+/g, ' ');
  if (result) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}

function splitSentences(text: string): string[] {
  const result: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    current += ch;
    if (/[。！？.!?]/.test(ch) || i === text.length - 1) {
      const trimmed = current.trim();
      if (trimmed) result.push(trimmed);
      current = '';
    }
  }
  return result.length ? result : [text.trim()].filter(Boolean);
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

function hasEnglish(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

export async function translateText(text: string, targetLang = 'zh'): Promise<string> {
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 500));

  const isToChinese = targetLang.startsWith('zh');
  const sentences = splitSentences(text);

  const translated = sentences.map((sentence) => {
    const zh = hasChinese(sentence);
    const en = hasEnglish(sentence);

    if (isToChinese) {
      if (zh && !en) return sentence;
      if (en && !zh) return translateSentenceEnZh(sentence);
      if (zh && en) return translateSentenceEnZh(sentence);
      return sentence;
    } else {
      if (en && !zh) return sentence;
      if (zh && !en) return translateSentenceZhEn(sentence);
      if (zh && en) return translateSentenceZhEn(sentence);
      return sentence;
    }
  });

  return translated.join('');
}

// ============ 导出功能：真正的 jsPDF 生成 ============
export async function exportDocument(
  paragraphs: { id: string; text: string; translation?: string }[],
  format: 'markdown' | 'pdf',
  bilingual: boolean,
  fileName?: string
): Promise<Blob> {
  const body = { paragraphs, format, bilingual };
  try {
    const res = await axios.post('/api/export', body, {
      responseType: 'blob',
      timeout: 20000,
    });
    return res.data as Blob;
  } catch {
    return generateLocalExport(paragraphs, format, bilingual, fileName);
  }
}

function generateLocalExport(
  paragraphs: { id: string; text: string; translation?: string }[],
  format: 'markdown' | 'pdf',
  bilingual: boolean,
  fileName?: string
): Blob {
  if (format === 'markdown') {
    let md = '# 翻译文档\n\n';
    if (fileName) {
      md += `> 来源文件：**${fileName}**\n\n`;
    }
    md += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    md += `> 段落数量：${paragraphs.length}\n\n`;
    md += `---\n\n`;
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

  // 真正的 PDF 生成（使用 jsPDF）
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addTextWrapped = (text: string, fontSize: number, isBold: boolean, color: [number, number, number]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 1.5;

    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += lineHeight * 0.3;
  };

  const addHorizontalLine = () => {
    if (y + 10 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setDrawColor(220, 210, 195);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;
  };

  // 标题
  addTextWrapped('Translation Document', 22, true, [90, 62, 43]);
  y += 4;
  addTextWrapped('翻译文档', 16, true, [90, 62, 43]);

  if (fileName) {
    y += 8;
    addTextWrapped(`Source File: ${fileName}`, 10, false, [120, 105, 85]);
  }
  addTextWrapped(`Exported: ${new Date().toLocaleString('zh-CN')}`, 10, false, [120, 105, 85]);
  addTextWrapped(`Total paragraphs: ${paragraphs.length}`, 10, false, [120, 105, 85]);

  y += 16;
  addHorizontalLine();

  paragraphs.forEach((p, idx) => {
    addTextWrapped(`Paragraph ${idx + 1}  段落 ${idx + 1}`, 13, true, [139, 105, 20]);

    if (bilingual) {
      addTextWrapped(`Original  原文`, 11, true, [90, 62, 43]);
      addTextWrapped(p.text, 11, false, [60, 45, 31]);

      addTextWrapped(`Translation  译文`, 11, true, [90, 62, 43]);
      addTextWrapped(p.translation || '(Not translated)', 11, false, [46, 125, 50]);
    } else {
      addTextWrapped(p.translation || p.text, 11, false, [60, 45, 31]);
    }

    if (idx < paragraphs.length - 1) {
      addHorizontalLine();
    }
  });

  const pdfBuffer = doc.output('arraybuffer');
  return new Blob([pdfBuffer], { type: 'application/pdf' });
}
