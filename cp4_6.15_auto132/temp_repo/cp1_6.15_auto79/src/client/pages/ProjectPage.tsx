import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Hash } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SheetCanvas from '../components/SheetCanvas';
import MemberList from '../components/MemberList';
import VersionList from '../components/VersionList';
import ExportMenu from '../components/ExportMenu';
import ShareButton from '../components/ShareButton';
import { useProjectStore } from '../store/useProjectStore';
import { useSocket } from '../hooks/useSocket';
import {
  generateUserId,
  getStoredUser,
  storeUser,
  getAvatarColor,
} from '../utils/api';
import type { Note, Member, Version, DiffNote } from '../types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_NAMES = ['小明', '小红', '阿杰', '小雨', '音乐爱好者', '乐队成员'];

function getRandomName() {
  return DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
}

export default function ProjectPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentProject,
    notes,
    versions,
    members,
    diffs,
    flashNoteIds,
    error,
    loadProject,
    loadVersions,
    setMembers,
    addMember,
    removeMember,
    addVersion,
    createVersion,
    upsertNote,
    deleteNote,
    setDiffs,
    clearDiffs,
    restoreVersion,
    broadcastVersion: _bv,
  } = useProjectStore();

  const {
    connect,
    joinRoom,
    leaveRoom,
    sendNoteChange,
    sendNoteDelete,
    broadcastVersion,
    setHandlers,
  } = useSocket();

  const [user, setUser] = useState<{ id: string; name: string }>(() => {
    const stored = getStoredUser();
    if (stored) return stored;
    const newUser = { id: generateUserId(), name: getRandomName() };
    storeUser(newUser);
    return newUser;
  });

  const [newJoinId, setNewJoinId] = useState<string | null>(null);
  const [joinToast, setJoinToast] = useState<{ id: string; name: string } | null>(null);
  const [showMobileVersions, setShowMobileVersions] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const lastSnapshotRef = useRef<string>('');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avatar = useMemo(() => getAvatarColor(user.name), [user.name]);

  useEffect(() => {
    loadProject(id);
    loadVersions(id);
    connect();
  }, [id, loadProject, loadVersions, connect]);

  useEffect(() => {
    if (!currentProject) return;

    const role: 'admin' | 'editor' | 'viewer' =
      currentProject.creatorId === user.id ? 'admin' : 'editor';

    joinRoom({
      projectId: id,
      userId: user.id,
      name: user.name,
      role,
      avatar,
    });

    setHandlers({
      onNoteChange: (note: Note) => {
        upsertNote(note, true);
      },
      onNoteDelete: (noteId: string) => {
        deleteNote(noteId);
      },
      onMemberJoin: (member: Member, all: Member[]) => {
        setMembers(all);
        if (member.id !== user.id) {
          setNewJoinId(member.id);
          setJoinToast({ id: member.id, name: member.name });
          setTimeout(() => {
            setNewJoinId(null);
            setJoinToast(null);
          }, 2200);
        }
      },
      onMemberLeave: (_uid: string, all: Member[]) => {
        setMembers(all);
      },
      onVersionCreate: (version: Version) => {
        addVersion(version);
      },
    });

    return () => {
      leaveRoom(id);
    };
  }, [currentProject?.id]);

  useEffect(() => {
    const snapshotKey = JSON.stringify(notes);
    if (notes.length > 0 && snapshotKey !== lastSnapshotRef.current) {
      lastSnapshotRef.current = snapshotKey;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        if (currentProject) {
          const version = await createVersion({
            projectId: currentProject.id,
            creatorId: user.id,
            creatorName: user.name,
          });
          if (version) {
            broadcastVersion({ projectId: currentProject.id, version });
          }
        }
      }, 15000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [notes, currentProject, createVersion, broadcastVersion, user]);

  const handleAddNote = (note: Omit<Note, 'id'>) => {
    const fullNote: Note = {
      ...note,
      id: uuidv4(),
    };
    upsertNote(fullNote, true);
    sendNoteChange({ projectId: id, note: fullNote, userId: user.id });
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    sendNoteDelete({ projectId: id, noteId, userId: user.id });
  };

  const handleShowDiff = (version: Version) => {
    const currentIds = new Set(notes.map(n => n.id));
    const versionIds = new Set(version.snapshot.map(n => n.id));
    const diffList: DiffNote[] = [];
    for (const n of version.snapshot) {
      if (!currentIds.has(n.id)) {
        diffList.push({ note: n, type: 'removed' });
      }
    }
    for (const n of notes) {
      if (!versionIds.has(n.id)) {
        diffList.push({ note: n, type: 'added' });
      }
    }
    setDiffs(diffList);
    setTimeout(() => clearDiffs(), 3800);
  };

  const handleRestore = async (version: Version) => {
    setIsRestoring(true);
    setTimeout(() => {
      restoreVersion(version);
      setIsRestoring(false);
    }, 400);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#1a1a2e] text-[#a0a0a0]">
        <div className="text-center">
          <div className="animate-spin mb-4 text-4xl">🎵</div>
          <p>加载项目中...</p>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-[#1a1a2e] overflow-hidden">
      <Sidebar onCreateClick={() => {}} userName={user.name} showBack onBackClick={() => navigate('/')} />

      <main className="flex-1 flex flex-col overflow-hidden relative page-enter">
        <div className="mobile-topbar fixed top-0 left-0 right-0 z-30 h-[50px] bg-[#0f3460] items-center px-3 justify-between">
          <button onClick={() => navigate('/')} className="text-[#e1e1e1] p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold text-[#e1e1e1] truncate flex-1 px-2">
            {currentProject.name}
          </h1>
          <button
            onClick={() => setShowMobileVersions(true)}
            className="text-[#e1e1e1] p-2 text-xs"
          >
            版本
          </button>
        </div>

        <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#16213e]">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1 text-[#a0a0a0] hover:text-[#00b4d8] transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              返回
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#e1e1e1]">{currentProject.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#a0a0a0]">
                <span className="px-2 py-0.5 bg-[#e94560]/20 text-[#e94560] rounded text-xs font-mono">
                  {currentProject.key}
                </span>
                <span>🎵 {currentProject.bpm} BPM</span>
                <span className="flex items-center gap-1">
                  <Hash size={12} />
                  {currentProject.joinCode}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MemberList members={members} newJoinId={newJoinId} />
            <ExportMenu projectId={id} projectName={currentProject.name} />
            <ShareButton projectId={id} />
          </div>
        </header>

        {joinToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bubble-toast pointer-events-none">
            <div className="glass-panel px-4 py-2 rounded-lg shadow-lg border border-white/10 text-[#e1e1e1] text-sm">
              🎉 <span className="font-medium">{joinToast.name}</span> 加入了排练
            </div>
          </div>
        )}

        <div className="flex-1 flex md:flex-row flex-col overflow-hidden pt-[50px] md:pt-0">
          <div className={`flex-1 flex flex-col relative ${isRestoring ? 'opacity-0' : 'opacity-100'} content-fade-in`}>
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex-1">
                <h2 className="text-base font-bold text-[#e1e1e1] truncate">{currentProject.name}</h2>
                <p className="text-xs text-[#a0a0a0]">
                  {currentProject.key} · {currentProject.bpm} BPM
                </p>
              </div>
              <MemberList members={members} newJoinId={newJoinId} compact />
            </div>

            <div className="flex-1 overflow-hidden">
              <SheetCanvas
                notes={notes}
                diffs={diffs}
                flashIds={flashNoteIds}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                bpm={currentProject.bpm}
              />
            </div>

            <div className="md:hidden flex items-center justify-around py-2 border-t border-white/5 bg-[#16213e]">
              <ExportMenu projectId={id} projectName={currentProject.name} compact />
              <ShareButton projectId={id} compact />
              <button
                onClick={() => setShowMobileVersions(true)}
                className="flex flex-col items-center gap-0.5 text-[#a0a0a0] text-xs p-2"
              >
                <span className="text-lg">📋</span>
                版本
              </button>
            </div>
          </div>

          <aside className="hidden md:flex w-[30%] min-w-[300px] max-w-[420px] flex-col border-l border-white/5 bg-[#16213e]">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-base font-bold text-[#e1e1e1]">版本历史</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                共 {versions.length} 个版本 · 自动保存
              </p>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <VersionList
                versions={versions}
                currentNotes={notes}
                onShowDiff={handleShowDiff}
                onRestore={handleRestore}
              />
            </div>
          </aside>
        </div>

        {showMobileVersions && (
          <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/60 modal-ripple"
              onClick={() => setShowMobileVersions(false)}
            />
            <div
              className="relative bg-[#16213e] rounded-t-2xl max-h-[50%] flex flex-col modal-slide-up"
              style={{
                touchAction: 'none',
              }}
            >
              <div
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
                onTouchStart={() => {}}
              >
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>
              <div className="px-5 py-3 border-b border-white/5">
                <h2 className="text-base font-bold text-[#e1e1e1]">版本历史</h2>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin pb-4">
                <VersionList
                  versions={versions}
                  currentNotes={notes}
                  onShowDiff={(v) => {
                    handleShowDiff(v);
                    setShowMobileVersions(false);
                  }}
                  onRestore={(v) => {
                    handleRestore(v);
                    setShowMobileVersions(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
