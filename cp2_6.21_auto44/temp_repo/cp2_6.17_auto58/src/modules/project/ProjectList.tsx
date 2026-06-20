import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Heart, MessageCircle } from 'lucide-react';
import { useProjectStore } from './store';
import { useActivityStore } from '../activity/store';
import { ProjectForm } from './ProjectForm';
import { useLazyImage } from '../../hooks/useLazyImage';
import { debounce } from '../../utils/format';

import type { Like, Comment } from '../../types';

interface ProjectCardProps {
  id: string;
  title: string;
  coverImage: string;
  likes: Like[];
  comments: Comment[];
  onClick: () => void;
}

const ProjectCard = memo(function ProjectCard({
  id,
  title,
  coverImage,
  likes,
  comments,
  onClick,
}: ProjectCardProps) {
  const { imgRef, isInView, setIsLoaded, isLoaded } = useLazyImage();
  const likeCount = likes.length;
  const commentCount = comments.length;

  return (
    <div
      className="project-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      data-project-id={id}
    >
      <div className="project-card__thumb-wrap">
        {!isLoaded && (
          <div className="project-card__thumb-skeleton" />
        )}
        {isInView && coverImage && (
          <img
            ref={imgRef}
            src={coverImage}
            alt={title}
            className={`project-card__thumb ${isLoaded ? 'project-card__thumb--loaded' : ''}`}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="project-card__body">
        <h3 className="project-card__title" title={title}>
          {title}
        </h3>
        <div className="project-card__stats">
          <span className="project-card__stat">
            <Heart size={14} color="#E74C3C" />
            {likeCount}
          </span>
          <span className="project-card__stat">
            <MessageCircle size={14} color="#27AE60" />
            {commentCount}
          </span>
        </div>
      </div>
    </div>
  );
});

export function ProjectList() {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const likesMap = useActivityStore((state) => state.likes);
  const commentsMap = useActivityStore((state) => state.comments);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  useEffect(() => {
    return () => {
      // cleanup debounce
    };
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const filteredProjects = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) => p.title.toLowerCase().includes(term));
  }, [projects, debouncedSearch]);

  const handleCardClick = useCallback(
    (id: string) => {
      navigate(`/project/${id}`);
    },
    [navigate]
  );

  return (
    <div className="project-list-page">
      <div className="project-list-header">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜索项目名称..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <button
          type="button"
          className="btn btn--primary create-project-btn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} />
          <span>创建项目</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">加载中...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          {debouncedSearch ? '暂无匹配项目' : '暂无项目，点击"创建项目"开始吧'}
        </div>
      ) : (
        <div className="project-grid">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              coverImage={project.images[0] || ''}
              likes={likesMap[project.id] || []}
              comments={commentsMap[project.id] || []}
              onClick={() => handleCardClick(project.id)}
            />
          ))}
        </div>
      )}

      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
