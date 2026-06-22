import type { QuizRecord } from './api';

export function exportToTxt(records: QuizRecord[]): void {
  const lines = records.map((r, i) => {
    const q = r.question;
    let content = `${i + 1}. [${q.type === 'choice' ? '单选' : q.type === 'multi_choice' ? '多选' : q.type === 'fill_blank' ? '填空' : '判断'}] ${q.stem}`;
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, j) => {
        content += `\n   ${String.fromCharCode(65 + j)}. ${opt}`;
      });
    }
    const ans = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
    content += `\n   答案: ${ans}`;
    content += `\n   解析: ${q.explanation}`;
    return content;
  });
  const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `题库导出_${formatDate()}.txt`);
}

export function exportToJson(records: QuizRecord[]): void {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, `题库导出_${formatDate()}.json`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
