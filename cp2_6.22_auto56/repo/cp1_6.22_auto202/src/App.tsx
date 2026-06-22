import React, { useState, useEffect } from 'react';
import ProjectManager from './ProjectManager';
import TranslationEditor from './TranslationEditor';
import ReviewPanel from './ReviewPanel';
import {
  Project,
  Chapter,
  Translator,
  ProgressStats,
  STATUS_COLORS,
  STATUS_LABELS,
  generateRingPath,
  calculateProgress
} from './utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type View = 'dashboard' | 'editor' | 'review';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [translators, setTranslators] = useState<Translator[]>([]);
  const [progress, setProgress] = useState<ProgressStats>({ unassigned: 0, translating: 0, reviewing: 0, completed: 0 });

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        if (data.length > 0) {
          return fetch(`/api/projects/${data[0].id}`);
        }
        return null;
      })
      .then(res => res ? res.json() : null)
      .then(data => {
        if (data) {
          setCurrentProject(data);
          setProgress(calculateProgress(data.chapters));
          const flat: Chapter[] = [];
          const walk = (list: Chapter[]) => {
            list.forEach(ch => {
              flat.push(ch);
              if (ch.children) walk(ch.children);
            });
          };
          walk(data.chapters);
          if (flat.length > 0) setSelectedChapterId(flat[0].id);
        }
      });

    fetch('/api/translators')
      .then(res => res.json())
      .then(data => setTranslators(data));
  }, []);

  const refreshProgress = () => {
    if (currentProject) {
      fetch(`/api/projects/${currentProject.id}`)
        .then(res => res.json())
        .then(data => {
          setCurrentProject(data);
          setProgress(calculateProgress(data.chapters));
        });
    }
  };

  const total = progress.unassigned + progress.translating + progress.reviewing + progress.completed;

  const chartData = translators.map(t => ({
    name: t.name,
    翻译字数: t.weeklyTranslatedChars,
    审校句数: t.weeklyReviewedSentences,
    驳回率: Math.round(t.weeklyRejectionRate * 100)
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header style={{
        background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
        color: 'white',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3182CE 0%, #4299E1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 700
          }}>
            译
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600 }}>翻译协作管理平台</h1>
            {currentProject && (
              <p style={{ fontSize: '12px', color: '#A0AEC0', marginTop: '-2px' }}>
                {currentProject.name} · {currentProject.sourceLanguage} → {currentProject.targetLanguage}
              </p>
            )}
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '4px' }}>
          {(['dashboard', 'editor', 'review'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: view === v ? 'white' : '#A0AEC0',
                background: view === v ? 'rgba(49, 130, 206, 0.3)' : 'transparent',
                border: view === v ? '1px solid rgba(49, 130, 206, 0.5)' : '1px solid transparent'
              }}
            >
              {v === 'dashboard' ? '📊 仪表盘' : v === 'editor' ? '📝 翻译编辑' : '🔍 审校面板'}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {view === 'dashboard' && (
          <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }} className="fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-text-primary)' }}>
              项目进度概览
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {(['unassigned', 'translating', 'reviewing', 'completed'] as const).map(status => {
                const count = progress[status];
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const { bgPath, arcPath } = generateRingPath(percentage);
                return (
                  <div
                    key={status}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'all var(--transition-normal)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.0