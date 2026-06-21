import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

type StageName = '素材整理' | '粗剪' | '精剪' | '音效' | '调色' | '终审';

interface StageProgress {
  name: StageName;
  percent: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  filmType: string;
  targetDuration: number;
  createdAt: string;
  stages: StageProgress[];
}

const STAGE_NAMES: StageName[] = ['素材整理', '粗剪', '精剪', '音效', '调色', '终审'];

interface TimelineProgressProps {
  projectId: string;
}

const TimelineProgress: React.FC<TimelineProgressProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<StageProgress[]>(
    STAGE_NAMES.map((name) => ({ name, percent: 0 }))
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const sliderRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Project>(`/api/projects/${projectId}`);
        const data = response.data;
        setProject(data);
        if (data.stages && data.stages.length > 0) {
          setStages(data.stages);
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const saveStages = useCallback(
    async (updatedStages: StageProgress[]) => {
      try {
        await axios.put(`/api/projects/${projectId}/stages`, { stages: updatedStages });
      } catch (error) {
        console.error('Failed to save stages:', error);
      }
    },
    [projectId]
  );

  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const getDateTicks = (): Date[] => {
    const createdAt = project?.createdAt ? new Date(project.createdAt) : new Date();
    const targetDate = new Date(createdAt);
    targetDate.setDate(targetDate.getDate() + 30);
    const ticks: Date[] = [];
    const totalMs = targetDate.getTime() - createdAt.getTime();
    for (let i = 0; i < 7; i++) {
      const tick = new Date(createdAt.getTime() + (totalMs * i) / 6);
      ticks.push(tick);
    }
    return ticks;
  };

  const calculatePercent = (clientX: number, sliderEl: HTMLDivElement): number => {
    const rect = sliderEl.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    let percent = (x / width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    return Math.round(percent);
  };

  const handlePointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingIndex(index);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerMove = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingIndex !== index) return;
    const sliderEl = sliderRefs.current[index];
    if (!sliderEl) return;
    const newPercent = calculatePercent(e.clientX, sliderEl);
    setStages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], percent: newPercent };
      return updated;
    });
  };

  const handlePointerUp = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingIndex !== index) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDraggingIndex(null);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    setStages((prev) => {
      saveStages(prev);
      return prev;
    });
  };

  const avgPercent =
    stages.length > 0
      ? Math.round(stages.reduce((sum, s) => sum + s.percent, 0) / stages.length)
      : 0;

  const dateTicks = getDateTicks();

  if (loading) {
    return (
      <div className="w-full p-6 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-32 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 text-slate-200">
      <div className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-slate-400 text-sm">整体完成度</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className="text-5xl font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                }}
              >
                {avgPercent}
              </span>
              <span className="text-2xl font-bold text-slate-300">%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-sm">项目</div>
            <div className="text-lg font-medium text-slate-200 truncate max-w-xs">
              {project?.name || '-'}
            </div>
          </div>
        </div>
        <div
          className="w-full h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: '#334155' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${avgPercent}%`,
              backgroundImage: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
            }}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-shrink-0 w-24" />
        <div className="flex-1 relative mb-2">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2" style={{ backgroundColor: '#334155' }} />
          <div className="flex justify-between relative">
            {dateTicks.map((date, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#8B5CF6',
                    boxShadow: '0 0 0 2px #1E293B',
                  }}
                />
                <div className="text-xs mt-2 text-slate-400 whitespace-nowrap">
                  {formatDate(date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="mt-4 space-y-3"
        style={{ gap: '12px' }}
      >
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className="flex items-center gap-4 rounded-xl p-4"
            style={{
              backgroundColor: '#0F172A',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div
              className="flex-shrink-0 w-20 text-sm font-medium"
              style={{ color: '#E2E8F0' }}
            >
              {stage.name}
            </div>

            <div
              className="flex-1 relative"
              ref={(el) => {
                sliderRefs.current[index] = el;
              }}
              style={{ height: '20px', display: 'flex', alignItems: 'center' }}
            >
              <div
                className="w-full rounded-full relative"
                style={{
                  height: '12px',
                  backgroundColor: '#334155',
                  borderRadius: '6px',
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-200 ease-out"
                  style={{
                    width: `${stage.percent}%`,
                    backgroundImage: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
                  }}
                />
              </div>

              <div
                className="absolute top-1/2"
                style={{
                  left: `${stage.percent}%`,
                  transform: 'translate(-50%, -50%)',
                  transition: draggingIndex === index ? 'none' : 'left 0.2s ease-out',
                  zIndex: 10,
                }}
              >
                <div
                  className="rounded-full pointer-events-auto select-none"
                  onPointerDown={(e) => handlePointerDown(index, e)}
                  onPointerMove={(e) => handlePointerMove(index, e)}
                  onPointerUp={(e) => handlePointerUp(index, e)}
                  onPointerCancel={(e) => handlePointerUp(index, e)}
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#8B5CF6',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: draggingIndex === index ? 'grabbing' : 'grab',
                    transition: 'box-shadow 0.2s ease-out',
                    boxShadow: draggingIndex === index
                      ? '0 0 0 4px rgba(139,92,246,0.3)'
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (draggingIndex !== index) {
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        '0 0 0 4px rgba(139,92,246,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (draggingIndex !== index) {
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }
                  }}
                />
              </div>

              <div
                className="absolute top-1/2 font-bold whitespace-nowrap pointer-events-none"
                style={{
                  left: `calc(${stage.percent}% + 16px)`,
                  transform: 'translateY(-50%)',
                  color: '#E2E8F0',
                  fontWeight: 700,
                  transition: draggingIndex === index ? 'none' : 'left 0.2s ease-out',
                }}
              >
                {stage.percent}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineProgress;
