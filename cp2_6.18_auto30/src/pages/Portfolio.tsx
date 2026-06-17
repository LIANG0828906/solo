import { useStore } from '@/store';
import TechStackChart from '@/components/TechStackChart';

export default function Portfolio() {
  const portfolio = useStore((s) => s.portfolio);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6" style={{ color: 'var(--color-text)' }}>项目作品集</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {portfolio.map((item, idx) => (
          <div
            key={item.id}
            className="card overflow-hidden animate-fade-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div
              className="w-full h-[150px] bg-cover bg-center"
              style={{ backgroundImage: `url(${item.thumbnail})`, backgroundColor: 'var(--color-sidebar)' }}
            />
            <div className="p-4">
              <h3 className="font-display font-semibold text-base mb-1.5" style={{ color: 'var(--color-text)' }}>
                {item.title}
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                {item.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <TechStackChart techStack={item.techStack} />
              {item.link && (
                <a
                  href={item.link}
                  className="inline-block mt-3 text-sm font-medium text-brand-500 hover:text-brand-600 no-underline"
                >
                  查看项目 →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {portfolio.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>暂无项目</p>
        </div>
      )}
    </div>
  );
}
