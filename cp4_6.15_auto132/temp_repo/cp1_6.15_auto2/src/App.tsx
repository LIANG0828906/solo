import { useEffect } from 'react';
import { LayoutGrid, GitBranch, MessageSquare, Menu } from 'lucide-react';
import { useStore } from '@/shared/store';
import { emitMemberJoin } from '@/shared/socketClient';
import type { ActiveTab } from '@/shared/types';
import Board from '@/board/Board';
import DependencyGraph from '@/graph/DependencyGraph';
import SearchBar from '@/search/SearchBar';
import RetroPanel from '@/retro/RetroPanel';
import TeamSidebar from '@/team/TeamSidebar';

const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { key: 'board', label: '看板', icon: <LayoutGrid size={15} /> },
  { key: 'graph', label: '依赖图谱', icon: <GitBranch size={15} /> },
  { key: 'retro', label: '回顾', icon: <MessageSquare size={15} /> },
];

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setTasks = useStore((s) => s.setTasks);
  const setDependencies = useStore((s) => s.setDependencies);
  const setComments = useStore((s) => s.setComments);
  const setVotes = useStore((s) => s.setVotes);
  const setTeamMembers = useStore((s) => s.setTeamMembers);
  const currentMemberId = useStore((s) => s.currentMemberId);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks?sprintId=s1').then((r) => r.json()),
      fetch('/api/dependencies?sprintId=s1').then((r) => r.json()),
      fetch('/api/comments').then((r) => r.json()),
      fetch('/api/votes?sprintId=s1').then((r) => r.json()),
      fetch('/api/team').then((r) => r.json()),
    ]).then(([tasks, deps, comments, votes, team]) => {
      setTasks(tasks);
      setDependencies(deps);
      setComments(comments);
      setVotes(votes);
      setTeamMembers(team);
    }).catch(console.error);
  }, [setTasks, setDependencies, setComments, setVotes, setTeamMembers]);

  useEffect(() => {
    emitMemberJoin(currentMemberId);
  }, [currentMemberId]);

  return (
    <div className="h-screen flex flex-col bg-macaron-warm font-body noise-bg">
      <header className="flex items-center justify-between px-4 py-2.5 bg-white/40 backdrop-blur-glass border-b border-white/60 z-20">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-extrabold text-macaron-dark text-lg tracking-tight">
            <span className="text-macaron-pink">Sprint</span><span className="text-macaron-purple">Flow</span>
          </h1>
          <div className="hidden sm:flex items-center gap-0.5 bg-white/50 rounded-full p-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white shadow-card text-macaron-dark'
                    : 'text-gray-400 hover:text-macaron-dark'
                }`}
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-center max-w-md mx-4">
          <SearchBar />
        </div>

        <button
          onClick={toggleSidebar}
          className="p-1.5 text-gray-400 hover:text-macaron-dark transition-colors lg:hidden"
        >
          <Menu size={18} />
        </button>
      </header>

      <div className="sm:hidden flex items-center gap-0.5 bg-white/40 backdrop-blur-glass border-b border-white/60 px-4 py-1.5 z-20">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-card text-macaron-dark'
                : 'text-gray-400'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden p-3">
          {activeTab === 'board' && <Board />}
          {activeTab === 'graph' && <DependencyGraph />}
          {activeTab === 'retro' && <RetroPanel />}
        </main>

        <div className="hidden lg:block">
          <TeamSidebar />
        </div>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/20" onClick={toggleSidebar} />
            <div className="absolute right-0 top-0 bottom-0">
              <TeamSidebar />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
