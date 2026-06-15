import type { DocDocument } from '../../shared/types';

function quillDeltaToMarkdown(content: Record<string, unknown>): string {
  if (!content || !content.ops) {
    return '';
  }

  const ops = content.ops as Array<{ insert?: string | Record<string, unknown>; attributes?: Record<string, unknown> }>;
  let markdown = '';

  for (const op of ops) {
    if (typeof op.insert === 'string') {
      let text = op.insert;
      if (op.attributes) {
        if (op.attributes.bold) text = `**${text}**`;
        if (op.attributes.italic) text = `*${text}*`;
        if (op.attributes.strike) text = `~~${text}~~`;
        if (op.attributes.code) text = `\`${text}\``;
        if (op.attributes.link) text = `[${text}](${op.attributes.link})`;
        if (op.attributes.header) {
          const level = op.attributes.header as number;
          text = `${'#'.repeat(level)} ${text}`;
        }
        if (op.attributes.list === 'bullet') text = `- ${text}`;
        if (op.attributes.list === 'ordered') text = `1. ${text}`;
        if (op.attributes.blockquote) text = `> ${text}`;
        if (op.attributes['code-block']) text = `\`\`\`\n${text}\n\`\`\``;
      }
      markdown += text;
    } else if (op.insert && typeof op.insert === 'object') {
      if (op.insert.image) {
        markdown += `![image](${op.insert.image})`;
      }
    }
  }

  return markdown;
}

export function exportToMarkdown(doc: DocDocument): void {
  const markdown = quillDeltaToMarkdown(doc.content);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.title || 'untitled'}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
