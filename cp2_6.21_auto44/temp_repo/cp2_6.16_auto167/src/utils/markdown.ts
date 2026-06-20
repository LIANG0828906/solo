export function renderMarkdown(text: string): string {
  let html = text;

  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  html = html.replace(/`{3}([\s\S]*?)`{3}/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');

  html = html.replace(/^-\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\.\s+(.*)$/gm, '<li>$2</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, match => {
    if (match.includes('<li>') && (match.match(/<li>/g) || []).length > 1) {
      return `<ul>${match}</ul>`;
    }
    return match;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  html = html.replace(/^---$/gm, '<hr />');

  html = html.split('\n').map(line => {
    if (
      line.startsWith('<h1>') || line.startsWith('<h2>') || line.startsWith('<h3>') ||
      line.startsWith('<h4>') || line.startsWith('<h5>') || line.startsWith('<h6>') ||
      line.startsWith('<p>') || line.startsWith('<ul>') || line.startsWith('<ol>') ||
      line.startsWith('<li>') || line.startsWith('<blockquote>') || line.startsWith('<hr') ||
      line.startsWith('<pre>') || line.startsWith('<img') || line.trim() === ''
    ) {
      return line;
    }
    return `<p>${line}</p>`;
  }).join('\n');

  html = html.replace(/\n/g, '');

  return html;
}
