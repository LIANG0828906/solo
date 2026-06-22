export function exportAsHtml(title: string, content: string) {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 16px;
      background: #ffffff;
    }
    h1 { font-size: 2em; color: #111827; margin: 0.67em 0; font-weight: 700; }
    h2 { font-size: 1.5em; color: #111827; margin: 0.75em 0; font-weight: 600; }
    h3 { font-size: 1.25em; color: #111827; margin: 0.83em 0; font-weight: 600; }
    p { margin: 0.5em 0; }
    strong, b { font-weight: 600; }
    em, i { font-style: italic; }
    u { text-decoration: underline; }
    ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
    li { margin: 0.25em 0; }
    pre {
      background: #1E293B;
      color: #E2E8F0;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0.5em 0;
      font-family: "Fira Code", "Cascadia Code", "Consolas", monospace;
      font-size: 0.9em;
    }
    code {
      background: #F1F5F9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "Fira Code", "Cascadia Code", "Consolas", monospace;
      font-size: 0.9em;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 4px solid #9CA3AF;
      padding-left: 16px;
      margin: 0.5em 0;
      color: #6B7280;
      font-style: italic;
    }
  </style>
</head>
<body>
${content}
</body>
</html>`

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
