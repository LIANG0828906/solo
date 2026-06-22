import { useState, useEffect } from 'react';
import { ProjectCard } from '@/components/ProjectCard';
import { CreateModal } from '@/components/CreateModal';
import { useProjectStore } from '@/store/projectStore';
import './ProjectList.css';

export function ProjectList() {
  const { projects, isLoading, loadProjects, createProject, deleteProject } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (data: {
    name: string;
    yarnColor: string;
    stitchCount: number;
    rowCount: number;
    patternText: string;
    referenceImage?: string;
  }) => {
    await createProject(data);
    setIsModalOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
  };

  return (
    <div className="project-list-page">
      <header className="navbar">
        <div className="navbar__inner">
          <div className="navbar__brand">
            <span className="navbar__logo">🧶</span>
            <h1 className="navbar__title">毛线编织图案阅读器</h1>
          </div>

          <div className={`navbar__menu ${mobileMenuOpen ? 'navbar__menu--open' : ''}`}>
            <button
              className="btn btn-primary navbar__create-btn"
              onClick={() => setIsModalOpen(true)}
            >
              + 新建项目
            </button>
          </div>

          <button
            className={`navbar__hamburger ${mobileMenuOpen ? 'navbar__hamburger--open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="菜单"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main className="project-list-page__content">
        <div className="project-list-page__header">
          <h2 className="project-list-page__subtitle">我的编织项目</h2>
          <span className="project-list-page__count">{projects.length} 个项目</span>
        </div>

        {isLoading ? (
          <div className="project-list-page__loading">加载中...</div>
        ) : projects.length === 0 ? (
          <div className="project-list-page__empty">
            <div className="project-list-page__empty-icon">🧣</div>
            <h3>还没有项目</h3>
            <p>点击「新建项目」开始记录你的第一个编织作品吧</p>
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              创建第一个项目
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>

      <CreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
