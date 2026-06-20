import { Link } from 'react-router-dom';
import { Clock, Calendar, Plus } from 'lucide-react';
import { useStore } from '@/store';

export default function BlogList() {
  const blog = useStore((s) => s.blog);
  const sorted = [...blog].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--color-text)' }}>博客文章</h1>
        <Link to="/blog/new" className="btn-primary flex items-center gap-1.5 text-sm no-underline">
          <Plus size={16} /> 发布文章
        </Link>
      </div>

      <div className="space-y-4">
        {sorted.map((post, idx) => (
          <Link
            key={post.id}
            to={`/blog/${post.id}`}
            className="card p-5 block no-underline animate-fade-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <h2 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
              {post.title}
            </h2>
            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {post.summary}
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {post.readingTime} 分钟阅读
              </span>
            </div>
          </Link>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>暂无文章</p>
        </div>
      )}
    </div>
  );
}
