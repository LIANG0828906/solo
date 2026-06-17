import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { useStore } from '@/store';
import ReactMarkdown from 'react-markdown';
import TechStackChart from '@/components/TechStackChart';

const PROFILE_TAGLINE = `**Crafting digital experiences** with clean code and creative design. Passionate about *open source*, *developer tools*, and pushing the boundaries of web technology.`;

export default function Home() {
  const portfolio = useStore((s) => s.portfolio);
  const featured = portfolio.slice(0, 6);

  return (
    <div className="space-y-10">
      <section className="flex flex-col items-center text-center py-10 animate-fade-up">
        <img
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20developer%20avatar%20minimal%20geometric&image_size=square_hd"
          alt="Avatar"
          className="w-[120px] h-[120px] rounded-full object-cover border-4 border-brand-500/20 mb-4"
        />
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3" style={{ color: 'var(--color-text)' }}>
          Alex Developer
        </h1>
        <div className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <ReactMarkdown>{PROFILE_TAGLINE}</ReactMarkdown>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--color-text)' }}>精选项目</h2>
          <Link
            to="/portfolio"
            className="flex items-center gap-1 text-sm font-medium no-underline text-brand-500 hover:text-brand-600"
          >
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((item, idx) => (
            <div
              key={item.id}
              className="card overflow-hidden animate-fade-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div
                className="w-full h-[150px] bg-cover bg-center"
                style={{ backgroundImage: `url(${item.thumbnail})`, backgroundColor: 'var(--color-sidebar)' }}
              />
              <div className="p-4">
                <h3 className="font-display font-semibold text-base mb-1.5" style={{ color: 'var(--color-text)' }}>
                  {item.title}
                </h3>
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <TechStackChart techStack={item.techStack} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 animate-fade-up">
        <h2 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--color-text)' }}>最新博客</h2>
        <div className="space-y-4">
          {useStore.getState().blog.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.id}`}
              className="flex items-start gap-4 p-3 rounded-lg no-underline transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--color-sidebar)' }}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                  {post.title}
                </h3>
                <p className="text-xs line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {post.summary}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                <Clock size={12} />
                {post.readingTime} 分钟
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
