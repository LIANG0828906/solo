import type { PoetrySession } from '../types';

export function downloadPoem(session: PoetrySession): void {
  const lines: string[] = [];

  lines.push(`${session.title}`);
  lines.push('='.repeat(40));
  lines.push(`主题：${session.theme}`);
  lines.push(`日期：${session.date}`);
  lines.push('');

  lines.push('与会文人：');
  session.poets.forEach((poet, index) => {
    lines.push(`  ${index + 1}. ${poet.name}（${poet.styleName}，${poet.temperament}）`);
  });
  lines.push('');

  lines.push('诗句：');
  lines.push('-'.repeat(40));
  session.verses.forEach((verse) => {
    lines.push(`${verse.lineNumber}. ${verse.content} —— ${verse.poetName}`);

    if (verse.validation && !verse.validation.isValid && verse.validation.errors) {
      verse.validation.errors.forEach((err) => {
        lines.push(`   [校验] 位置${err.position}：${err.type}，推荐：${err.suggestion}`);
      });
    }
  });
  lines.push('-'.repeat(40));

  const content = lines.join('\n');

  navigator.clipboard.writeText(content).catch(() => {});

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = session.date.replace(/[年月日]/g, '').replace(/\//g, '');
  link.download = `[${session.theme}]_${dateStr}.txt`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
