import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderKanban, Download, Upload, Menu, X, Sparkles } from 'lucide-react';
import { useStore } from '@/shared/store';
import { cn } from '@/lib/utils';
import InspirationBoard from '@/modules/inspiration/InspirationBoard';
import InspirationInput from '@/modules/inspiration/InspirationInput';
import ProjectView from '@/modules/project/ProjectView';
import ReportGenerator from '@/modules/report/ReportGenerator';

const navItems = [
  { path: '/', label: '灵感看板', icon: Home },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const importData = useStore((s) => s.importData);
  const exportData = useStore((s) => s.exportData);
  const [importing, setImporting] = useState(false);

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        await importData(file);
        alert('数据导入成功！');
        navigate('/');
      } catch (err) {
        console.error(err);
        alert('导入失败：无效的备份文件');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleExportAll = async () => {
    try {
      const blob = await exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creative-forge-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('导出失败');
    }
  };

  return (
    <aside className="w-64 h-screen bg-forge-card/80 backdrop-blur-xl border-r border-forge-border flex flex-col shrink-0">
      <div className="p-5 border-b border-forge-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-accent to-forge-accent-hover flex items-center justify-center shadow-lg shadow-forge-accent/30">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-tight">
              CreativeForge
            </h1>
            <p className="text-xs text-forge-muted">创意工坊</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
        <div className="text-xs font-semibold text-forge-muted/80 px-3 py-2 uppercase tracking-wider">
          主功能
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-forge-accent/15 text-forge-accent'
                  : 'text-forge-muted hover:text-white hover:bg-white/5',
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}

        {projects.length > 0 && (
          <>
            <div className="text-xs font-semibold text-forge-muted/80 px-3 py-2 mt-4 uppercase tracking-wider">
              我的项目
            </div>
            {projects.map((project) => {
              const isActive = location.pathname === `/project/${project.id}` || location.pathname === `/report/${project.id}`;
              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-forge-accent/15 text-forge-accent'
                      : 'text-forge-muted hover:text-white hover:bg-white/5',
                  )}
                >
                  <FolderKanban size={18} />
                  <span className="truncate flex-1">{project.title}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-forge-border/50 space-y-1">
        <button
          type="button"
          onClick={handleExportAll}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-forge-muted hover:text-white hover:bg-white/5 transition-all"
        >
          <Download size={18} />
          导出全部数据
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          disabled={importing}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-forge-muted hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
        >
          <Upload size={18} />
          {importing ? '导入中...' : '导入数据'}
        </button>
      </div>
    </aside>
  );
}

function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const getTitle = () => {
    if (location.pathname === '/') return '灵感看板';
    if (location.pathname.startsWith('/project/')) return null;
    if (location.pathname.startsWith('/report/')) return null;
    return 'CreativeForge';
  };
  const title = getTitle();
  if (title === null) {
    return <div className="lg:hidden h-0 overflow-hidden" aria-hidden="true" />;
  }

  return (
    <header className="lg:hidden h-14 bg-forge-card/80 backdrop-blur-xl border-b border-forge-border flex items-center px-4 gap-3">
      <button
        type="button"
        onClick={onMenuClick}
        className="btn-elastic p-2 rounded-lg hover:bg-white/10 text-forge-muted hover:text-white"
      >
        <Menu size={20} />
      </button>
      <h1 className="font-display font-semibold text-white flex-1 text-center">{title}</h1>
      <div className="w-10" />
    </header>
  );
}

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const showInput = location.pathname === '/';

  return (
    <div className="flex h-screen bg-forge-bg overflow-hidden">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed lg:relative z-50 transition-transform duration-300',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-lg text-forge-muted hover:text-white',
            'lg:hidden',
            !mobileMenuOpen && 'hidden',
          )}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<InspirationBoard />} />
            <Route path="/project/:id" element={<ProjectView />} />
            <Route path="/report/:id" element={<ReportGenerator />} />
          </Routes>
        </div>
      </div>

      {showInput && <InspirationInput />}
    </div>
  );
}

export default function App() {
  const initDB = useStore((s) => s.initDB);
  const dbReady = useStore((s) => s.dbReady);

  useEffect(() => {
    initDB();
  }, [initDB]);

  if (!dbReady) {
    return (
      <div className="h-screen bg-forge-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forge-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-forge-muted font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
