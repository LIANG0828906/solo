import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, BookOpen, MessageSquare, Shield, X } from 'lucide-react';
import { useStore } from '@/store';

const NAV_ITEMS = [
  { to: '/', label: '主页', icon: Home },
  { to: '/portfolio', label: '项目', icon: FolderOpen },
  { to: '/blog', label: '博客', icon: BookOpen },
  { to: '/messages', label: '留言', icon: MessageSquare },
  { to: '/admin', label: '管理', icon: Shield },
];

const ALL_TECH = [
  'React', 'TypeScript', 'Node.js', 'Vue', 'Python',
  'Rust', 'WebAssembly', 'D3.js', 'PostgreSQL', 'MongoDB',
  'Firebase', 'Flask', 'TensorFlow', 'OpenAI',
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore();
  const location = useLocation();

  const content = (
    <div className="flex flex-col h-full">
      <div className="md:hidden flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <span className="font-display font-bold text-lg" style={{ color: 'var(--color-text)' }}>DevPortfolio</span>
        <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--color-text)' }}>
          <X size={20} />
        </button>
      </div>

      <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col items-center text-center">
          <img
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20developer%20avatar%20minimal%20geometric&image_size=square_hd"
            alt="Avatar"
            className="w-[120px] h-[120px] rounded-full object-cover border-4 border-brand-500/20 mb-3"
          />
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--color-text)' }}>Alex Developer</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Full-Stack Engineer · Open Source Enthusiast
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to ||
              (to !== '/' && location.pathname.startsWith(to));
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors"
                  style={{
                    color: isActive ? '#6C63FF' : 'var(--color-text-secondary)',
                    backgroundColor: isActive ? 'rgba(108,99,255,0.08)' : 'transparent',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="font-display font-semibold text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          技术栈
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TECH.map((tech) => (
            <span key={tech} className="tech-tag text-xs">{tech}</span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex md:flex-col md:w-[280px] md:min-w-[280px] sidebar h-screen sticky top-0 overflow-y-auto scrollbar-thin">
        {content}
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] sidebar overflow-y-auto scrollbar-thin animate-fade-in">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
