import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trophy, Medal, Clock, Target } from 'lucide-react';
import { scoreboardEngine } from './ScoreboardEngine';
import type { RankItem, Project } from './types';

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

const formatScore = (score: number, projectType: 'timed' | 'scored'): string => {
  if (projectType === 'timed') {
    const seconds = Math.floor(score / 1000);
    const ms = score % 1000;
    return `${seconds}.${String(ms).padStart(3, '0')}s`;
  }
  return score.toFixed(1);
};

interface ScoreboardViewProps {
  fullScreen?: boolean;
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({ fullScreen = false }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [rankings, setRankings] = useState<RankItem[]>([]);
  const [, forceUpdate] = useState(0);

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const refresh = () => {
      const allProjects = scoreboardEngine.getProjects();
      setProjects(allProjects);
      
      if (allProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(allProjects[0].id);
      }
      
      if (selectedProjectId) {
        setRankings(scoreboardEngine.getRankings(selectedProjectId));
      }
      
      forceUpdate((n) => n + 1);
    };

    refresh();
    const unsubscribe = scoreboardEngine.subscribe(refresh);

    return unsubscribe;
  }, [selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (selectedProjectId && tabRefs.current.has(selectedProjectId)) {
      const tabEl = tabRefs.current.get(selectedProjectId)!;
      const tabsEl = tabsRef.current;
      
      if (tabsEl) {
        const tabsRect = tabsEl.getBoundingClientRect();
        const tabRect = tabEl.getBoundingClientRect();
        
        setIndicatorStyle({
          left: tabRect.left - tabsRect.left,
          width: tabRect.width,
        });
      }
    }
  }, [selectedProjectId, projects.length]);

  const maxScore = useMemo(() => {
    if (rankings.length === 0) return 0;
    
    if (selectedProject?.type === 'timed') {
      return Math.max(...rankings.map((r) => r.score));
    }
    return Math.max(...rankings.map((r) => r.score));
  }, [rankings, selectedProject]);

  const getBarWidth = (score: number): string => {
    if (maxScore === 0) return '0%';
    
    if (selectedProject?.type === 'timed') {
      const normalized = 1 - (score / maxScore) * 0.5;
      return `${Math.max(normalized * 100, 10)}%`;
    }
    
    return `${(score / maxScore) * 100}%`;
  };

  const getRankClass = (rank: number): string => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} style={{ color: '#FBBF24' }} />;
    if (rank === 2) return <Medal size={20} style={{ color: '#9CA3AF' }} />;
    if (rank === 3) return <Medal size={20} style={{ color: '#CD7F32' }} />;
    return null;
  };

  const containerClass = fullScreen ? 'scoreboard-full' : 'scoreboard-preview';

  return (
    <div className={containerClass}>
      {fullScreen && (
        <div className="scoreboard-header">
          <h1 className="scoreboard-title">
            <Trophy size={40} style={{ display: 'inline', marginRight: '16px', verticalAlign: 'middle', color: '#F97316' }} />
            实时排行榜
          </h1>
          <p className="scoreboard-subtitle">比赛成绩实时更新</p>
        </div>
      )}

      {!fullScreen && (
        <h2 className="section-title">
          <Trophy size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: '#F97316' }} />
          实时排行榜
        </h2>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <p className="empty-state-text">暂无比赛项目，请先在左侧创建运动会和比赛项目</p>
        </div>
      ) : (
        <>
          <div className="tabs-container" ref={tabsRef}>
            {projects.map((project) => (
              <button
                key={project.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(project.id, el);
                }}
                className={`tab-item ${selectedProjectId === project.id ? 'active' : ''}`}
                onClick={() => setSelectedProjectId(project.id)}
              >
                {project.type === 'timed' ? (
                  <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                ) : (
                  <Target size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                )}
                {project.name}
              </button>
            ))}
            <div
              className="tab-indicator"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          </div>

          {rankings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-text">该项目暂无成绩数据</p>
            </div>
          ) : (
            <>
              <div className="top-three-container">
                {rankings.slice(0, 3).map((item) => (
                  <div key={item.participant.id} className={`rank-card ${getRankClass(item.rank)}`}>
                    <div className="rank-card-inner">
                      <div className="rank-number">
                        {getRankIcon(item.rank)}
                        <span style={{ marginLeft: '8px' }}>第 {item.rank} 名</span>
                      </div>
                      <div className="rank-participant">
                        <div
                          className="participant-avatar"
                          style={{
                            backgroundColor: getAvatarColor(item.participant.name),
                            width: '40px',
                            height: '40px',
                            fontSize: '16px',
                          }}
                        >
                          {getInitials(item.participant.name)}
                        </div>
                        <div>
                          <div className="rank-name">{item.participant.name}</div>
                          <div className="rank-unit">{item.participant.unit}</div>
                        </div>
                      </div>
                      <div className="rank-score">
                        {selectedProject
                          ? formatScore(item.score, selectedProject.type)
                          : item.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bars-container">
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '16px',
                  }}
                >
                  全部参赛者成绩
                </h3>
                {rankings.map((item) => (
                  <div key={item.participant.id} className="bar-item">
                    <div className="bar-header">
                      <div className="bar-name">
                        <span
                          style={{
                            display: 'inline-block',
                            width: '24px',
                            fontFamily: 'var(--font-display)',
                            fontWeight: '700',
                            color: item.rank <= 3 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          }}
                        >
                          {item.rank}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: getAvatarColor(item.participant.name),
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: '28px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginRight: '8px',
                            verticalAlign: 'middle',
                          }}
                        >
                          {getInitials(item.participant.name)}
                        </span>
                        {item.participant.name}
                      </div>
                      <div className="bar-score">
                        {selectedProject
                          ? formatScore(item.score, selectedProject.type)
                          : item.score}
                      </div>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: getBarWidth(item.score),
                        }}
                      >
                        <span className="bar-fill-text">
                          {selectedProject
                            ? formatScore(item.score, selectedProject.type)
                            : item.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
