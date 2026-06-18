import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { FaMusic, FaSave, FaHourglassHalf, FaFile, FaPlus } from 'react-icons/fa';
import PianoKeyboard from './components/PianoKeyboard';
import ScoreEditor from './components/ScoreEditor';
import ControlPanel from './components/ControlPanel';
import type { Fragment, Note, Project, PlaybackState } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function createEmptyProject(): Project {
  return {
    id: generateId(),
    name: '',
    description: '',
    fragments: [
      {
        id: generateId(),
        name: '片段 1',
        notes: [],
        expanded: true,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const STORAGE_KEY = 'music_inspiration_projects';

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ScheduleItem {
  note: Note;
  fragmentIndex: number;
  offset: number;
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [currentProject, setCurrentProject] = useState<Project>(() => createEmptyProject());
  const [activeFragmentId, setActiveFragmentId] = useState<string | null>(() => {
    const empty = createEmptyProject();
    return empty.fragments[0]?.id ?? null;
  });
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentPlayTime, setCurrentPlayTime] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [saveError, setSaveError] = useState('');
  const [projectListCollapsed, setProjectListCollapsed] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const scheduledOscRef = useRef<Array<{ osc: OscillatorNode; gain: GainNode }>>([]);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const getAllNotesWithTiming = useCallback((proj: Project): ScheduleItem[] => {
    const items: ScheduleItem[] = [];
    let offset = 0;
    proj.fragments.forEach((frag, idx) => {
      frag.notes.forEach(note => {
        items.push({ note, fragmentIndex: idx, offset: offset + note.startTime });
      });
      let fragDur = 0;
      frag.notes.forEach(n => {
        fragDur = Math.max(fragDur, n.startTime + n.duration);
      });
      offset += Math.max(fragDur, 1) + 0.5;
    });
    return items;
  }, []);

  const getTotalDuration = useCallback((proj: Project): number => {
    let total = 0;
    proj.fragments.forEach(frag => {
      let fragDur = 0;
      frag.notes.forEach(n => {
        fragDur = Math.max(fragDur, n.startTime + n.duration);
      });
      total += Math.max(fragDur, 1) + 0.5;
    });
    return Math.max(0, total - 0.5);
  }, []);

  const stopScheduledNotes = useCallback(() => {
    scheduledOscRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(0);
        gain.gain.setValueAtTime(0, audioCtxRef.current?.currentTime ?? 0);
        osc.stop();
      } catch {
        // ignore
      }
    });
    scheduledOscRef.current = [];
  }, []);

  const schedulePlayback = useCallback((proj: Project, startTime: number) => {
    const ctx = getAudioContext();
    stopScheduledNotes();

    const items = getAllNotesWithTiming(proj);
    const bpm = 120;
    const beatDuration = 60 / bpm;

    items.forEach(({ note }) => {
      const noteStartAudio = ctx.currentTime + startTime + note.startTime * beatDuration;
      const noteDuration = note.duration * beatDuration;
      const fadeIn = 0.02;
      const fadeOut = Math.min(0.1, noteDuration * 0.3);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(midiToFreq(note.pitch), noteStartAudio);

      gain.gain.setValueAtTime(0, noteStartAudio);
      gain.gain.linearRampToValueAtTime(0.25, noteStartAudio + fadeIn);
      gain.gain.setValueAtTime(0.25, noteStartAudio + noteDuration - fadeOut);
      gain.gain.linearRampToValueAtTime(0, noteStartAudio + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStartAudio);
      osc.stop(noteStartAudio + noteDuration + 0.05);

      scheduledOscRef.current.push({ osc, gain });
    });
  }, [getAudioContext, getAllNotesWithTiming, stopScheduledNotes]);

  const handlePlay = useCallback(() => {
    const ctx = getAudioContext();
    const totalDur = getTotalDuration(currentProject);

    if (totalDur <= 0) {
      toast('没有可播放的音符', { icon: '🎵' });
      return;
    }

    let startOffset = 0;
    if (playbackState === 'paused') {
      startOffset = pausedAtRef.current;
    }

    playbackStartTimeRef.current = ctx.currentTime - startOffset;
    schedulePlayback(currentProject, startOffset);
    setPlaybackState('playing');

    const bpm = 120;
    const beatDuration = 60 / bpm;

    const tick = () => {
      const elapsed = ctx.currentTime - playbackStartTimeRef.current;
      if (elapsed >= totalDur * beatDuration) {
        setPlaybackState('idle');
        setCurrentPlayTime(null);
        return;
      }
      setCurrentPlayTime(elapsed / beatDuration);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, [getAudioContext, currentProject, playbackState, schedulePlayback, getTotalDuration]);

  const handlePause = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const bpm = 120;
    const beatDuration = 60 / bpm;
    pausedAtRef.current = ctx.currentTime - playbackStartTimeRef.current;

    stopScheduledNotes();
    setPlaybackState('paused');
    setCurrentPlayTime(pausedAtRef.current / beatDuration);
  }, [stopScheduledNotes]);

  const handleStop = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    stopScheduledNotes();
    pausedAtRef.current = 0;
    setPlaybackState('idle');
    setCurrentPlayTime(null);
  }, [stopScheduledNotes]);

  const handleClear = useCallback(() => {
    handleStop();
    setCurrentProject(prev => ({
      ...prev,
      fragments: prev.fragments.map(f => ({ ...f, notes: [] })),
      updatedAt: Date.now(),
    }));
    toast.success('已清除所有音符');
  }, [handleStop]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      stopScheduledNotes();
    };
  }, [stopScheduledNotes]);

  const handleNotePlay = useCallback((pitch: number) => {
    setCurrentProject(prev => {
      const targetFragId = activeFragmentId ?? prev.fragments[0]?.id;
      if (!targetFragId) return prev;

      const fragIndex = prev.fragments.findIndex(f => f.id === targetFragId);
      if (fragIndex === -1) return prev;

      const frag = prev.fragments[fragIndex];
      let maxStart = 0;
      frag.notes.forEach(n => {
        maxStart = Math.max(maxStart, n.startTime + n.duration);
      });

      const newNote: Note = {
        id: generateId(),
        pitch,
        startTime: Math.round(maxStart * 8) / 8,
        duration: 0.5,
      };

      const newFragments = [...prev.fragments];
      newFragments[fragIndex] = {
        ...frag,
        notes: [...frag.notes, newNote],
      };

      return {
        ...prev,
        fragments: newFragments,
        updatedAt: Date.now(),
      };
    });
  }, [activeFragmentId]);

  const handleFragmentsChange = useCallback((fragments: Fragment[]) => {
    setCurrentProject(prev => ({
      ...prev,
      fragments,
      updatedAt: Date.now(),
    }));
  }, []);

  const handleOpenSaveModal = () => {
    setSaveName(currentProject.name || '');
    setSaveDesc(currentProject.description || '');
    setSaveError('');
    setShowSaveModal(true);
  };

  const handleSaveProject = () => {
    if (!saveName.trim()) {
      setSaveError('请输入项目名称');
      return;
    }

    const updatedProject: Project = {
      ...currentProject,
      name: saveName.trim(),
      description: saveDesc.trim(),
      updatedAt: Date.now(),
      createdAt: currentProject.createdAt || Date.now(),
    };

    const existingIndex = projects.findIndex(p => p.id === updatedProject.id);
    let newProjects: Project[];
    if (existingIndex >= 0) {
      newProjects = [...projects];
      newProjects[existingIndex] = updatedProject;
    } else {
      newProjects = [updatedProject, ...projects];
    }

    newProjects.sort((a, b) => b.updatedAt - a.updatedAt);
    setProjects(newProjects);
    saveProjects(newProjects);
    setCurrentProject(updatedProject);
    setShowSaveModal(false);

    toast.custom((t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#50B86C',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          fontSize: 14,
          fontWeight: 500,
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.3s ease-out',
        }}
      >
        <FaHourglassHalf style={{ animation: 'slideInLeft 0.3s ease-out' }} />
        <span>项目已保存：{saveName.trim()}</span>
      </div>
    ), { duration: 2500, position: 'top-center' });
  };

  const handleLoadProject = (project: Project) => {
    handleStop();
    setCurrentProject({ ...project });
    setActiveFragmentId(project.fragments[0]?.id ?? null);
    toast.success(`已加载：${project.name}`);
  };

  const handleNewProject = () => {
    handleStop();
    const np = createEmptyProject();
    setCurrentProject(np);
    setActiveFragmentId(np.fragments[0]?.id ?? null);
    toast.success('已创建新项目');
  };

  return (
    <div className="app-container">
      <Toaster />

      <div className={`project-list ${projectListCollapsed ? 'collapsed' : ''}`}>
        <div
          className="project-list-header"
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={() => setProjectListCollapsed(!projectListCollapsed)}
        >
          <span>项目列表</span>
          <button
            className="btn btn-primary"
            style={{ padding: '4px 8px', fontSize: 11, boxShadow: 'none' }}
            onClick={(e) => { e.stopPropagation(); handleNewProject(); }}
          >
            <FaPlus />
          </button>
        </div>
        {!projectListCollapsed && (
          <div className="project-list-items">
            {projects.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
                <FaFile style={{ fontSize: 32, opacity: 0.2, marginBottom: 8 }} />
                <div>暂无保存的项目</div>
                <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>
                  点击右上角保存按钮
                </div>
              </div>
            ) : (
              projects.map(p => (
                <div
                  key={p.id}
                  className={`project-item ${currentProject.id === p.id ? 'active' : ''}`}
                  onClick={() => handleLoadProject(p)}
                >
                  <div className="project-item-name">{p.name}</div>
                  {p.description && (
                    <div className="project-item-desc">{p.description}</div>
                  )}
                  <div className="project-item-date">{formatDate(p.updatedAt)}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="toolbar">
          <div className="toolbar-title">
            <FaMusic style={{ color: 'var(--btn-play)' }} />
            <span>音乐灵感捕捉器</span>
            {currentProject.name && (
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400 }}>
                — {currentProject.name}
              </span>
            )}
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-primary" onClick={handleOpenSaveModal}>
              <FaSave /> 保存项目
            </button>
          </div>
        </div>

        <div className="score-editor-container">
          <ScoreEditor
            fragments={currentProject.fragments}
            onFragmentsChange={handleFragmentsChange}
            currentPlayTime={currentPlayTime}
            activeFragmentId={activeFragmentId}
            onActiveFragmentChange={setActiveFragmentId}
          />
          <ControlPanel
            playbackState={playbackState}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onClear={handleClear}
          />
        </div>

        <PianoKeyboard onNotePlay={handleNotePlay} />
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">保存项目</div>

            <div className="modal-form-group">
              <label className="modal-label">项目名称 <span style={{ color: 'var(--btn-stop)' }}>*</span></label>
              <input
                className="modal-input"
                type="text"
                value={saveName}
                onChange={(e) => {
                  setSaveName(e.target.value);
                  if (saveError) setSaveError('');
                }}
                placeholder="输入项目名称"
                autoFocus
                maxLength={50}
              />
              {saveError && <div className="modal-error">{saveError}</div>}
            </div>

            <div className="modal-form-group">
              <label className="modal-label">项目描述（选填）</label>
              <textarea
                className="modal-textarea"
                value={saveDesc}
                onChange={(e) => setSaveDesc(e.target.value)}
                placeholder="简单描述一下你的灵感..."
                maxLength={200}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveProject}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
