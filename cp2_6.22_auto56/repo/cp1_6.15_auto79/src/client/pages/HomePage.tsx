import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import { useProjectStore } from '../store/useProjectStore';
import { useSocket } from '../hooks/useSocket';
import {
  generateUserId,
  getStoredUser,
  storeUser,
} from '../utils/api';
import type { Project } from '../types';

const DEFAULT_NAMES = ['小明', '小红', '阿杰', '小雨', '音乐爱好者', '乐队成员'];

function getRandomName() {
  return DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { projects, loadProjects, addProject, error, setError } = useProjectStore();
  const { connect, setHandlers } = useSocket();

  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string }>(() => {
    const stored = getStoredUser();
    if (stored) return stored;
    const newUser = { id: generateUserId(), name: getRandomName() };
    storeUser(newUser);
    return newUser;
  });

  useEffect(() => {
    loadProjects();
    connect();
    setHandlers({
      onProjectCreate: (project: Project) => {
        addProject(project);
      },
    });
  }, [loadProjects, connect, setHandlers, addProject]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error, setError]);

  const handleCreateProject = async (data: {
    name: string;
    key: string;
    bpm: number;
    instruments: string[];
  }) => {
    try {
      const project = await useProjectStore.getState().createProject({
        ...data,
        creatorId: user.id,
        creatorName: user.name,
      });
      setModalOpen(false);
      navigate(`/project/${project.id}`);
    } catch {
      // Error handled in store
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#1a1a2e]">
      <Sidebar
        onCreateClick={() => setModalOpen(true)}
        userName={user.name}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="mobile-topbar fixed top-0 left-0 right-0 z-30 h-[50px] bg-[#0f3460] items-center px-4 justify-between">
          <h1 className="text-lg font-bold text-[#e1e1e1]">🎵 乐队协作</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="w-9 h-9 rounded-lg bg-[#e94560] flex items-center justify-center text-white nav-icon-btn"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin pt-[60px] md:pt-0 px-6 md:px-10 py-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#e1e1e1] mb-2">
                  我的乐曲项目
                </h1>
                <p className="text-[#a0a0a0]">
                  共 {projects.length} 个项目 · 与乐队成员实时协作创作
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#e94560] hover:bg-[#d13a54] text-white rounded-lg font-medium nav-icon-btn"
              >
                <span className="text-xl leading-none">+</span>
                创建新项目
              </button>
            </header>

            {error && (
              <div className="mb-6 px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">🎼</div>
                <h2 className="text-xl font-semibold text-[#e1e1e1] mb-2">
                  还没有项目
                </h2>
                <p className="text-[#a0a0a0] mb-6 max-w-md">
                  创建你的第一个乐曲项目，邀请乐队成员加入，开始实时协作创作
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-6 py-3 bg-[#e94560] hover:bg-[#d13a54] text-white rounded-lg font-medium"
                >
                  创建第一个项目
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {projects.map((project, idx) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    animationDelay={idx * 60}
                    onClick={() => navigate(`/project/${project.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
