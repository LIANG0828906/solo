import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '@/store';
import MessageForm from '@/components/MessageForm';

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const blog = useStore((s) => s.blog);

  const postIndex = blog.findIndex((p) => p.id === id);
  const post = blog[postIndex];
  const prevPost = postIndex > 0 ? blog[postIndex - 1] : null;
  const nextPost = postIndex < blog.length - 1 ? blog[postIndex + 1] : null;

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>文章未找到</p>
        <Link to="/blog" className="text-brand-500 mt-2 inline-block no-underline">返回博客列表</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <article className="animate-fade-up">
        <header className="mb-8">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl mb-3" style={{ color: 'var(--color-text)' }}>
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readingTime} 分钟阅读
            </span>
          </div>
        </header>

        <div className="markdown-body mb-10">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>

      <nav className="flex items-center justify-between border-t pt-6 mb-10" style={{ borderColor: 'var(--color-border)' }}>
        {prevPost ? (
          <button
            onClick={() => navigate(`/blog/${prevPost.id}`)}
            className="flex items-center gap-2 text-sm font-medium no-underline hover:opacity-80"
            style={{ color: 'var(--color-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={16} />
            <span className="line-clamp-1 max-w-[200px]">{prevPost.title}</span>
          </button>
        ) : <div />}
        {nextPost ? (
          <button
            onClick={() => navigate(`/blog/${nextPost.id}`)}
            className="flex items-center gap-2 text-sm font-medium no-underline hover:opacity-80 text-right"
            style={{ color: 'var(--color-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span className="line-clamp-1 max-w-[200px]">{nextPost.title}</span>
            <ArrowRight size={16} />
          </button>
        ) : <div />}
      </nav>

      <section className="border-t pt-8" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--color-text)' }}>留言</h2>
        <MessageForm />
      </section>
    </div>
  );
}
