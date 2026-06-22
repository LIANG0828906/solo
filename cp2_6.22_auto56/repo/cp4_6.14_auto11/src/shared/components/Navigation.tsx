import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useOkrStore } from '@/store/useOkrStore';
import {
  Target,
  BarChart3,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quarterId } = useParams();
  const quarters = useOkrStore((s) => s.quarters);
  const objectives = useOkrStore((s) => s.objectives);
  const mobileNavOpen = useOkrStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useOkrStore((s) => s.setMobileNavOpen);

  const currentQuarterId = quarterId || quarters[0]?.id;

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0d9488' }}>
            <Target className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              OKR 管理工具
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">星辰团队</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-4 mb-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            季度 OKR
          </span>
        </div>
        {quarters.map((q) => {
          const qObjectives = objectives.filter((o) => o.quarterId === q.id);
          const isActive = currentQuarterId === q.id && location.pathname.includes('/okr');
          return (
            <button
              key={q.id}
              onClick={() => handleNavClick(`/okr/${q.id}`)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors duration-150 ${
                isActive
                  ? 'bg-teal-50 text-teal-700 border-r-2'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={isActive ? { borderRightColor: '#0d9488' } : undefined}
            >
              <span className="text-[13px] font-medium">{q.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">{qObjectives.length}个目标</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </div>
            </button>
          );
        })}

        <div className="px-4 mt-5 mb-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            分析
          </span>
        </div>
        <button
          onClick={() => currentQuarterId && handleNavClick(`/report/${currentQuarterId}`)}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors duration-150 ${
            location.pathname.includes('/report')
              ? 'bg-teal-50 text-teal-700 border-r-2'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={location.pathname.includes('/report') ? { borderRightColor: '#0d9488' } : undefined}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[13px] font-medium">复盘报告</span>
        </button>
      </div>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">管</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700">管理员</p>
            <p className="text-[10px] text-gray-400">admin@team.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileNavOpen(true)}
        className="fixed top-3 left-3 z-40 md:hidden p-2 rounded-lg bg-white shadow-md border border-gray-200"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-60 md:w-[240px] md:z-0 md:static md:translate-x-0 transition-transform duration-200 ease-out ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#f3f4f6', borderRight: '1px solid #e5e7eb' }}
      >
        <button
          onClick={() => setMobileNavOpen(false)}
          className="absolute top-3 right-3 md:hidden p-1.5 rounded-lg hover:bg-gray-200"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
        {navContent}
      </aside>
    </>
  );
}
