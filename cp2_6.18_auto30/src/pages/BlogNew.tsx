import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Eye, Edit3, Send } from 'lucide-react';
import { useStore } from '@/store';

const PLACEHOLDER = `# 文章标题

在这里开始撰写你的文章...

## 第一节

使用 **Markdown** 语法排版，支持：

- 列表
- **加粗** 和 *斜体*
- \`代码\` 和代码块
- [链接](https://example.com)

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`
`;

export default function BlogNew() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(PLACEHOLDER);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const addBlogPost = useStore((s) => s.addBlogPost);
  const navigate = useNavigate();

  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  const summary = content.replace(/[#*`\[\]]/g, '').slice(0, 120).trim();

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) return;
    addBlogPost({
      title: title.trim(),
      content,
      summary,
      publishedAt: new Date().toISOString(),
      readingTime,
    });
    navigate('/blog');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--color-text)' }}>发布新文章</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-sidebar)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            {mode === 'edit' ? <Eye size={15} /> : <Edit3 size={15} />}
            {mode === 'edit' ? '预览' : '编辑'}
          </button>
          <button onClick={handlePublish} className="btn-primary flex items-center gap-1.5 text-sm">
            <Send size={15} /> 发布
          </button>
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="文章标题..."
        className="input-field mb-4 text-lg font-display font-semibold"
      />

      {mode === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>编辑</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field font-mono text-sm"
              style={{ minHeight: '500px', resize: 'vertical' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>实时预览</label>
            <div
              className="rounded-lg p-4 overflow-auto"
              style={{ minHeight: '500px', backgroundColor: 'var(--color-sidebar)', border: '1px solid var(--color-border)' }}
            >
              <div className="markdown-body">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="markdown-body">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
