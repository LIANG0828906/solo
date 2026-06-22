import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { calculateRiskProgress, Risk, RiskProgress } from './riskCalculator';
import RiskCard from './RiskCard';

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  createdAt: number;
}

interface NewRiskForm {
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high';
  probability: number;
  impact: number;
  response: string;
  owner: string;
}

interface NewProjectForm {
  name: string;
  description: string;
  startDate: string;
}

const API_BASE = '/api';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newRiskIds, setNewRiskIds] = useState<Set<string>>(new Set());

  const [newRiskForm, setNewRiskForm] = useState<NewRiskForm>({
    title: '',
    description: '',
    level: 'medium',
    probability: 50,
    impact: 3,
    response: '',
    owner: '',
  });

  const [newProjectForm, setNewProjectForm] = useState<NewProjectForm>({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [animatedProgress, setAnimatedProgress] = useState<RiskProgress>({
    high: { count: 0, completed: 0, ratio: 0 },
    medium: { count: 0, completed: 0, ratio: 0 },
    low: { count: 0, completed: 0, ratio: 0 },
  });

  const progress = useMemo(() => calculateRiskProgress(risks), [risks]);
  const currentProject = projects.find((p) => p.id === currentProjectId);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (currentProjectId) {
      loadRisks(currentProjectId);
    } else {
      setRisks([]);
    }
  }, [currentProjectId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API_BASE}/projects`);
      setProjects(response.data);
      if (response.data.length > 0 && !currentProjectId) {
        setCurrentProjectId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadRisks = async (projectId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/projects/${projectId}/risks`);
      setRisks(response.data);
      setNewRiskIds(new Set());
    } catch (error) {
      console.error('Failed to load risks:', error);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectForm.name.trim()) return;

    try {
      const response = await axios.post(`${API_BASE}/projects`, newProjectForm);
      setProjects((prev) => [...prev, response.data]);
      setCurrentProjectId(response.data.id);
    } catch (error) {
      console.error('Failed to add project:', error);
    }

    setNewProjectForm({
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
    });
    setShowAddProjectModal(false);
  };

  const handleAddRisk = async () => {
    if (!newRiskForm.title.trim() || !currentProjectId) return;

    try {
      const response = await axios.post(
        `${API_BASE}/projects/${currentProjectId}/risks`,
        newRiskForm
      );
      setRisks((prev) => [response.data, ...prev]);
      setNewRiskIds((prev) => new Set(prev).add(response.data.id));
      setTimeout(() => {
        setNewRiskIds((prev) => {
          const next = new Set(prev);
          next.delete(response.data.id);
          return next;
        });
      }, 500);
    } catch (error) {
      console.error('Failed to add risk:', error);
    }

    setNewRiskForm({
      title: '',
      description: '',
      level: 'medium',
      probability: 50,
      impact: 3,
      response: '',
      owner: '',
    });
    setShowAddRiskModal(false);
  };

  const handleStatusChange = async (id: string, status: Risk['status']) => {
    try {
      await axios.patch(`${API_BASE}/risks/${id}/status`, { status });
      setRisks((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (error) {
      console.error('Failed to update risk status:', error);
    }
  };

  const ProgressRing = ({
    progress,
    color,
    label,
  }: {
    progress: { count: number; completed: number; ratio: number };
    color: string;
    label: string;
  }) => {
    const radius = 40;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - progress.ratio * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative', width: '92px', height: '92px' }}>
          <svg width="92" height="92" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="46"
              cy="46"
              r={radius}
              fill="none"
              stroke="#334155"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="46"
              cy="46"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              style={{
                transition: 'stroke-dashoffset 1s ease-out',
                strokeDashoffset: offset,
              }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#E2E8F0',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {progress.count}
          </div>
        </div>
        <span style={{ color: '#94A3B8', fontSize: '13px' }}>
          {label} ({Math.round(progress.ratio * 100)}%)
        </span>
      </div>
    );
  };

  const Modal = ({
    show,
    onClose,
    title,
    children,
  }: {
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    if (!show) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 600, margin: 0 }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E2E8F0')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const InputField = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
  }: {
    label: string;
    type?: string;
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          color: '#CBD5E1',
          fontSize: '13px',
          marginBottom: '6px',
          fontWeight: 500,
        }}
      >
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: '#334155',
          border: '1px solid #475569',
          borderRadius: '8px',
          color: '#E2E8F0',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#475569')}
      />
    </div>
  );

  const TextAreaField = ({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
  }) => (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          color: '#CBD5E1',
          fontSize: '13px',
          marginBottom: '6px',
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: '#334155',
          border: '1px solid #475569',
          borderRadius: '8px',
          color: '#E2E8F0',
          fontSize: '14px',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color 0.2s ease',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#475569')}
      />
    </div>
  );

  const SelectField = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          color: '#CBD5E1',
          fontSize: '13px',
          marginBottom: '6px',
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: '#334155',
          border: '1px solid #475569',
          borderRadius: '8px',
          color: '#E2E8F0',
          fontSize: '14px',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#475569')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const sidebarVisible = isMobile ? showSidebar : true;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#1E293B',
        color: '#E2E8F0',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {sidebarVisible && (
        <div
          style={{
            position: isMobile ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            width: '280px',
            height: '100vh',
            backgroundColor: '#0F172A',
            zIndex: 100,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '24px 20px' }}>
            <h1
              style={{
                color: '#F1F5F9',
                fontSize: '20px',
                fontWeight: 700,
                margin: '0 0 24px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#6366F1',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                ⚠️
              </div>
              风险追踪
            </h1>

            <button
              onClick={() => setShowAddProjectModal(true)}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '20px',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4F46E5';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366F1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              创建项目
            </button>

            <div
              style={{
                color: '#64748B',
                fontSize: '12px',
                fontWeight: 500,
                marginBottom: '12px',
              }}
            >
              项目列表
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    setCurrentProjectId(project.id);
                    if (isMobile) {
                      setShowSidebar(false);
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    backgroundColor:
                      currentProjectId === project.id
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'transparent',
                    borderLeft:
                      currentProjectId === project.id
                        ? '3px solid #6366F1'
                        : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (currentProjectId !== project.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentProjectId !== project.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div
                    style={{
                      color:
                        currentProjectId === project.id ? '#F1F5F9' : '#CBD5E1',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {project.name}
                  </div>
                  <div
                    style={{
                      color: '#64748B',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {project.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isMobile && showSidebar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              backgroundColor: '#0F172A',
              gap: '12px',
            }}
          >
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                background: 'none',
                border: 'none',
                color: '#E2E8F0',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1,
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              ☰
            </button>
            <span style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: 600 }}>
              {currentProject?.name || '风险追踪'}
            </span>
          </div>
        )}

        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
          {currentProject && (
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  color: '#F1F5F9',
                  fontSize: '24px',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                }}
              >
                {currentProject.name}
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
                {currentProject.description} · 启动于 {currentProject.startDate}
              </p>
            </div>
          )}

          <div
            style={{
              backgroundColor: '#0F172A',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <ProgressRing
                progress={animatedProgress.high}
                color="#EF4444"
                label="高风险"
              />
              <ProgressRing
                progress={animatedProgress.medium}
                color="#F59E0B"
                label="中风险"
              />
              <ProgressRing
                progress={animatedProgress.low}
                color="#22C55E"
                label="低风险"
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 600, margin: 0 }}>
              风险列表
              <span
                style={{
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: 400,
                  marginLeft: '8px',
                }}
              >
                ({risks.length}个风险)
              </span>
            </h3>
            <button
              onClick={() => setShowAddRiskModal(true)}
              disabled={!currentProjectId}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: currentProjectId ? 'pointer' : 'not-allowed',
                opacity: currentProjectId ? 1 : 0.5,
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: '44px',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                if (currentProjectId) {
                  e.currentTarget.style.backgroundColor = '#4F46E5';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366F1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              添加风险
            </button>
          </div>

          {risks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: '#0F172A',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ color: '#94A3B8', fontSize: '14px' }}>
                {currentProjectId
                  ? '暂无风险，点击上方按钮添加第一个风险'
                  : '请先选择或创建一个项目'}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '16px',
              }}
            >
              {risks.map((risk) => (
                <RiskCard
                  key={risk.id}
                  risk={risk}
                  onStatusChange={handleStatusChange}
                  isNew={newRiskIds.has(risk.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        show={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        title="创建新项目"
      >
        <InputField
          label="项目名称"
          value={newProjectForm.name}
          onChange={(v) =>
            setNewProjectForm((prev) => ({ ...prev, name: v }))
          }
          placeholder="请输入项目名称"
          required
        />
        <TextAreaField
          label="项目描述"
          value={newProjectForm.description}
          onChange={(v) =>
            setNewProjectForm((prev) => ({ ...prev, description: v }))
          }
          placeholder="请输入项目描述"
        />
        <InputField
          label="启动日期"
          type="date"
          value={newProjectForm.startDate}
          onChange={(v) =>
            setNewProjectForm((prev) => ({ ...prev, startDate: v }))
          }
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => setShowAddProjectModal(false)}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#334155',
              color: '#CBD5E1',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              minHeight: '44px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#475569')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#334155')
            }
          >
            取消
          </button>
          <button
            onClick={handleAddProject}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              minHeight: '44px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#4F46E5')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#6366F1')
            }
          >
            创建
          </button>
        </div>
      </Modal>

      <Modal
        show={showAddRiskModal}
        onClose={() => setShowAddRiskModal(false)}
        title="添加新风险"
      >
        <InputField
          label="风险标题"
          value={newRiskForm.title}
          onChange={(v) =>
            setNewRiskForm((prev) => ({ ...prev, title: v }))
          }
          placeholder="请输入风险标题"
          required
        />
        <TextAreaField
          label="风险描述"
          value={newRiskForm.description}
          onChange={(v) =>
            setNewRiskForm((prev) => ({ ...prev, description: v }))
          }
          placeholder="请详细描述风险内容"
        />
        <SelectField
          label="风险等级"
          value={newRiskForm.level}
          onChange={(v) =>
            setNewRiskForm((prev) => ({
              ...prev,
              level: v as 'low' | 'medium' | 'high',
            }))
          }
          options={[
            { value: 'high', label: '高风险' },
            { value: 'medium', label: '中风险' },
            { value: 'low', label: '低风险' },
          ]}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <InputField
            label="发生概率 (%)"
            type="number"
            value={newRiskForm.probability}
            onChange={(v) =>
              setNewRiskForm((prev) => ({
                ...prev,
                probability: parseInt(v) || 0,
              }))
            }
            placeholder="0-100"
          />
          <InputField
            label="影响程度 (1-5)"
            type="number"
            value={newRiskForm.impact}
            onChange={(v) =>
              setNewRiskForm((prev) => ({
                ...prev,
                impact: parseInt(v) || 1,
              }))
            }
            placeholder="1-5"
          />
        </div>
        <TextAreaField
          label="应对措施"
          value={newRiskForm.response}
          onChange={(v) =>
            setNewRiskForm((prev) => ({ ...prev, response: v }))
          }
          placeholder="请描述风险应对措施"
        />
        <InputField
          label="负责人"
          value={newRiskForm.owner}
          onChange={(v) =>
            setNewRiskForm((prev) => ({ ...prev, owner: v }))
          }
          placeholder="请输入负责人姓名"
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => setShowAddRiskModal(false)}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#334155',
              color: '#CBD5E1',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              minHeight: '44px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#475569')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#334155')
            }
          >
            取消
          </button>
          <button
            onClick={handleAddRisk}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              minHeight: '44px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#4F46E5')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#6366F1')
            }
          >
            添加
          </button>
        </div>
      </Modal>
    </div>
  );
}
