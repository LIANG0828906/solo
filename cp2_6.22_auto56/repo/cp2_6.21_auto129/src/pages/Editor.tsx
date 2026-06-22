import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectPanel from '@/components/ProjectPanel';
import PianoRoll from '@/components/PianoRoll';
import TrackList from '@/components/TrackList';
import { useStore, Project, Track, Note } from '@/store';
import { syncService } from '@/services/syncService';
import './Editor.css';

const MOCK_PROJECT: Project = {
  id: 'demo',
  name: '示例项目',
  creator: '演示用户',
  createdAt: '2026-06-20T10:00:00Z',
  inviteCode: 'DEMO01',
  tracks: [
    { id: 'tr1', name: '主旋律', waveform: 'sine', volume: 80, pan: 0, effectsEnabled: false },
    { id: 'tr2', name: '和声', waveform: 'triangle', volume: 65, pan: -25, effectsEnabled: true },
    { id: 'tr3', name: '贝斯', waveform: 'sawtooth', volume: 75, pan: 20, effectsEnabled: false },
  ],
  notes: [
    { id: 'n1', trackId: 'tr1', row: 2, col: 0, createdAt: Date.now() - 5000 },
    { id: 'n2', trackId: 'tr1', row: 4, col: 4, createdAt: Date.now() - 4000 },
    { id: 'n3', trackId: 'tr1', row: 2, col: 8, createdAt: Date.now() - 3000 },
    { id: 'n4', trackId: 'tr2', row: 5, col: 2, createdAt: Date.now() - 2000 },
    { id: 'n5', trackId: 'tr2', row: 5, col: 6, createdAt: Date.now() - 1000 },
    { id: 'n6', trackId: 'tr3', row: 6, col: 0, createdAt: Date.now() - 500 },
    { id: 'n7', trackId: 'tr3', row: 6, col: 4, createdAt: Date.now() - 200 },
  ],
};

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const addNote = useStore((s) => s.addNote);
  const removeNote = useStore((s) => s.removeNote);
  const addTrack = useStore((s) => s.addTrack);
  const removeTrack = useStore((s) => s.removeTrack);
  const updateTrack = useStore((s) => s.updateTrack);
  const addToast = useStore((s) => s.addToast);
  const setPlayhead = useStore((s) => s.setPlayhead);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const isPlaying = useStore((s) => s.isPlaying);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/project/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentProject(data);
        } else {
          setCurrentProject({ ...MOCK_PROJECT, id: projectId || MOCK_PROJECT.id });
        }
      } catch {
        setCurrentProject({ ...MOCK_PROJECT, id: projectId || MOCK_PROJECT.id });
      }
    };

    loadProject();

    if (projectId) {
      syncService.joinRoom(projectId);
    }

    return () => {
      syncService.leaveRoom();
      setCurrentProject(null);
    };
  }, [projectId, setCurrentProject]);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    unsubscribers.push(syncService.on('noteAdded', (data) => {
      const d = data as { noteId: string; trackId: string; row: number; col: number; userName: string };
      addNote({
        id: d.noteId || Date.now().toString() + Math.random().toString(36).slice(2),
        trackId: d.trackId,
        row: d.row,
        col: d.col,
        createdAt: Date.now(),
      });
      addToast(`${d.userName} 添加了音符`);
    }));

    unsubscribers.push(syncService.on('noteRemoved', (data) => {
      const d = data as { noteId: string; trackId: string; userName: string };
      if (d.noteId) removeNote(d.noteId);
      addToast(`${d.userName} 删除了音符`);
    }));

    unsubscribers.push(syncService.on('trackAdded', (data) => {
      const d = data as { trackId: string; trackName: string; userName: string };
      addTrack({
        id: d.trackId || Date.now().toString(),
        name: d.trackName || '新轨道',
        waveform: 'sine',
        volume: 80,
        pan: 0,
        effectsEnabled: false,
      });
      addToast(`${d.userName} 添加了轨道 ${d.trackName}`);
    }));

    unsubscribers.push(syncService.on('trackRemoved', (data) => {
      const d = data as { trackId: string; trackName: string; userName: string };
      if (d.trackId) removeTrack(d.trackId);
      addToast(`${d.userName} 删除了轨道 ${d.trackName}`);
    }));

    unsubscribers.push(syncService.on('trackUpdated', (data) => {
      const d = data as { trackId: string; trackName: string; field: string; userName: string };
      if (d.trackId && d.field) {
        updateTrack(d.trackId, {});
      }
      addToast(`${d.userName} 修改了 ${d.trackName}`);
    }));

    unsubscribers.push(syncService.on('playStateChanged', (data) => {
      const d = data as { isPlaying: boolean; playhead: number; userName: string };
      setIsPlaying(d.isPlaying);
      setPlayhead(d.playhead);
      addToast(`${d.userName} ${d.isPlaying ? '开始播放' : '停止播放'}`);
    }));

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [addNote, removeNote, addTrack, removeTrack, updateTrack, setIsPlaying, setPlayhead, addToast]);

  useEffect(() => {
    if (!isPlaying) return;
    let frame: number;
    let last = performance.now();

    const animate = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPlayhead((prev) => {
        const next = prev + dt * 0.08;
        return next >= 1 ? 0 : next;
      });
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, setPlayhead]);

  return (
    <div className="editor-page">
      <div className="editor-layout">
        <ProjectPanel />
        <PianoRoll />
        <TrackList />
      </div>
    </div>
  );
}
