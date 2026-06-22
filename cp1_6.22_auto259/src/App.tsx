import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, Users, Clock, Menu, Plus, X, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, Trash2, Palette
} from 'lucide-react';
import type { Project, Chapter, Panel, Character, ViewType, ChapterStatus } from './types';
import { STATUS_LABELS } from './types';
import { storyboardManager, STORYBOARD_CHANGED_EVENT } from './StoryboardManager';
import { characterManager, CHARACTER_CHANGED_EVENT } from './CharacterManager';
import { timelinePlayer } from './TimelinePlayer';

interface AppContextValue {
  projects: Project[];
  currentProject: Project | null;
  chapters: Chapter[];
  characters: Character[];
  currentChapter: Chapter | null;
  currentPanels: Panel[];
  view: ViewType;
  setCurrentProject: (id: string) => void;
  setCurrentChapter: (id: string) => void;
  setView: (v: ViewType) => void;
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const useAppCtx = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppCtx must be used within AppProvider');
  return ctx;
};

const PRESET_COLORS = ['#E57373', '#64B5F6', '#81C784', '#FFD54F', '#BA68C8', '#4DB6AC', '#FF8A65', '#7986CB', '#F06292', '#AED581'];

export default function App() {
  const [view, setView] = useState<ViewType>('chapters');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [sbTick, setSbTick] = useState(0);
  const [chTick, setChTick] = useState(0);

  const forceSb = () => setSbTick((t) => t + 1);
  const forceCh = () => setChTick((t) => t + 1);

  useEffect(() => {
    const onSb = () => forceSb();
    const onCh = () => forceCh();
    document.addEventListener(STORYBOARD_CHANGED_EVENT, onSb);
    document.addEventListener(CHARACTER_CHANGED_EVENT, onCh);
    return () => {
      document.removeEventListener(STORYBOARD_CHANGED_EVENT, onSb);
      document.removeEventListener(CHARACTER_CHANGED_EVENT, onCh);
    };
  }, []);

  const projects = storyboardManager.getProjects();
  const currentProject = storyboardManager.getCurrentProject();
  const chapters = currentProject ? storyboardManager.getChapters(currentProject.id) : [];
  const characters = characterManager.getCharacters();
  const currentChapter = currentChapterId
    ? chapters.find((c) => c.id === currentChapterId) ?? chapters[0] ?? null
    : chapters[0] ?? null;
  const currentPanels = currentChapter ? storyboardManager.getPanels(currentChapter.id) : [];

  const setCurrentProject = (id: string) => {
    storyboardManager.setCurrentProject(id);
    setCurrentChapterId(null);
  };

  const setCurrentChapter = (id: string) => {
    setCurrentChapterId(id);
    setSidebarOpen(false);
  };

  const ctxValue = useMemo<AppContextValue>(() => ({
    projects,
    currentProject,
    chapters,
    characters,
    currentChapter,
    currentPanels,
    view,
    setCurrentProject,
    setCurrentChapter,
    setView,
    refresh: () => { forceSb(); forceCh(); },
  }), [projects, currentProject, chapters, characters, currentChapter, currentPanels, view, sbTick, chTick]);

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="app-container">
        <TopBar view={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="main-layout">
          {sidebarOpen && <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />}
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <Sidebar currentChapterId={currentChapter?.id ?? null} />
          </aside>
          <main className="content-area">
            {view === 'chapters' && <ChaptersView />}
            {view === 'characters' && <CharactersView />}
            {view === 'timeline' && <TimelineView />}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}

function TopBar({ view, setView, sidebarOpen, setSidebarOpen }: {
  view: ViewType;
  setView: (v: ViewType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  const { projects, currentProject, setCurrentProject } = useAppCtx();
  const [showNewProject, setShowNewProject] = useState(false);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={20} />
        </button>
        <div className="app-title">
          <BookOpen size={22} />
          <span>漫画故事板</span>
        </div>
        <div className="project-selector">
          <select
            className="project-select"
            value={currentProject?.id ?? ''}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setShowNewProject(true);
              } else {
                setCurrentProject(e.target.value);
              }
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
            <option value="__new__">+ 新建项目</option>
          </select>
        </div>
      </div>
      <nav className="nav-tabs">
        <button className={`nav-tab ${view === 'chapters' ? 'active' : ''}`} onClick={() => setView('chapters')}>
          <BookOpen size={18} /><span className="tab-text">章节管理</span>
        </button>
        <button className={`nav-tab ${view === 'characters' ? 'active' : ''}`} onClick={() => setView('characters')}>
          <Users size={18} /><span className="tab-text">角色库</span>
        </button>
        <button className={`nav-tab ${view === 'timeline' ? 'active' : ''}`} onClick={() => setView('timeline')}>
          <Clock size={18} /><span className="tab-text">时间轴</span>
        </button>
      </nav>
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
    </header>
  );
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { refresh } = useAppCtx();
  const [title, setTitle] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">新建漫画项目</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">项目名称</label>
          <input style={{ width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：星海征程" autoFocus />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => {
            if (title.trim()) {
              storyboardManager.addProject(title.trim());
              refresh();
              onClose();
            }
          }}>创建</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ currentChapterId }: { currentChapterId: string | null }) {
  const { chapters, currentProject, setCurrentChapter, refresh } = useAppCtx();
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [showEditChapter, setShowEditChapter] = useState<Chapter | null>(null);
  return (
    <div>
      <div className="sidebar-header">
        <div className="sidebar-title">{currentProject?.title ?? '未选择项目'}</div>
      </div>
      <div className="sidebar-section-header">
        <span className="sidebar-section-title">章节列表</span>
        <button className="btn-icon" onClick={() => setShowNewChapter(true)}><Plus size={16} /></button>
      </div>
      <div className="chapter-list">
        {chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            active={chapter.id === currentChapterId}
            onEdit={() => setShowEditChapter(chapter)}
            onSelect={() => setCurrentChapter(chapter.id)}
          />
        ))}
        {chapters.length === 0 && (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-text">暂无章节</div>
            <button className="btn-secondary" onClick={() => setShowNewChapter(true)}>添加章节</button>
          </div>
        )}
      </div>
      {showNewChapter && (
        <ChapterModal
          mode="create"
          onClose={() => setShowNewChapter(false)}
          onSubmit={(title, status) => {
            if (currentProject) {
              storyboardManager.addChapter(currentProject.id, title, status);
              refresh();
              setShowNewChapter(false);
            }
          }}
        />
      )}
      {showEditChapter && (
        <ChapterModal
          mode="edit"
          chapter={showEditChapter}
          onClose={() => setShowEditChapter(null)}
          onSubmit={(title, status) => {
            storyboardManager.updateChapter(showEditChapter.id, { title, status });
            refresh();
            setShowEditChapter(null);
          }}
          onDelete={() => {
            storyboardManager.removeChapter(showEditChapter.id);
            refresh();
            setShowEditChapter(null);
          }}
        />
      )}
    </div>
  );
}

function ChapterCard({ chapter, active, onEdit, onSelect }: {
  chapter: Chapter;
  active: boolean;
  onEdit: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      className={`chapter-card ${active ? 'active' : ''}`}
      onClick={onSelect}
      onContextMenu={(e) => { e.preventDefault(); onEdit(); }}
    >
      <span className={`status-badge status-${chapter.status}`} />
      <div className="chapter-title">{chapter.title}</div>
      <div className="chapter-meta">
        <span>{STATUS_LABELS[chapter.status]}</span>
        <span>{chapter.pageCount}页</span>
      </div>
    </button>
  );
}

function ChapterModal({ mode, chapter, onClose, onSubmit, onDelete }: {
  mode: 'create' | 'edit';
  chapter?: Chapter;
  onClose: () => void;
  onSubmit: (title: string, status: ChapterStatus) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(chapter?.title ?? '');
  const [status, setStatus] = useState<ChapterStatus>(chapter?.status ?? 'draft');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'create' ? '新建章节' : '编辑章节'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">章节标题</label>
          <input style={{ width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：第一章：启程" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">章节状态</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as ChapterStatus)}>
            <option value="draft">草稿</option>
            <option value="serializing">连载中</option>
            <option value="completed">完结</option>
          </select>
        </div>
        <div className="modal-footer">
          {mode === 'edit' && onDelete && (
            <button className="btn-secondary" style={{ color: '#e55', borderColor: '#e55', marginRight: 'auto' }} onClick={onDelete}>删除章节</button>
          )}
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => { if (title.trim()) onSubmit(title.trim(), status); }}>
            {mode === 'create' ? '创建' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChaptersView() {
  const { currentChapter, currentPanels, refresh } = useAppCtx();
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{currentChapter ? currentChapter.title : '请选择章节'}</h1>
        <p className="page-subtitle">
          {currentChapter
            ? `${STATUS_LABELS[currentChapter.status]} · ${currentPanels.length}个分镜`
            : '在左侧章节列表中选择或添加章节开始编辑分镜'}
        </p>
      </div>
      {currentChapter ? (
        <div className="panel-grid">
          {Array.from({ length: currentChapter.pageCount }).map((_, idx) => {
            const panel = currentPanels[idx];
            return panel ? (
              <PanelThumb key={panel.id} panel={panel} onClick={() => setEditingPanel(panel)} />
            ) : (
              <div key={idx} className="panel-thumb"><span style={{ color: '#B8A89A' }}>+</span></div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">还没有章节，先在左侧添加一个吧</div>
        </div>
      )}
      {editingPanel && (
        <PanelEditModal panel={editingPanel} onClose={() => setEditingPanel(null)} onSaved={() => { refresh(); setEditingPanel(null); }} />
      )}
    </div>
  );
}

function PanelThumb({ panel, onClick }: { panel: Panel; onClick: () => void }) {
  const { characters } = useAppCtx();
  const hasDialogue = panel.dialogueText.trim().length > 0;
  const panelChars = characters.filter((c) => panel.characterIds.includes(c.id));
  return (
    <button className="panel-thumb" onClick={onClick}>
      <span className="panel-thumb-index">#{panel.gridIndex + 1}</span>
      {panelChars.length > 0 && (
        <div className="panel-thumb-characters">
          {panelChars.slice(0, 3).map((c) => (
            <span key={c.id} className="character-dot" style={{ background: c.avatarColor }} />
          ))}
        </div>
      )}
      {hasDialogue && <span className="dialogue-badge">💬</span>}
    </button>
  );
}

function PanelEditModal({ panel, onClose, onSaved }: { panel: Panel; onClose: () => void; onSaved: () => void }) {
  const { characters } = useAppCtx();
  const [dialogue, setDialogue] = useState(panel.dialogueText);
  const [notes, setNotes] = useState(panel.notes);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>(panel.characterIds);
  const [newCharId, setNewCharId] = useState('');

  const availableChars = characters.filter((c) => !selectedCharIds.includes(c.id));
  const selectedChars = characters.filter((c) => selectedCharIds.includes(c.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">编辑分镜 #{panel.gridIndex + 1}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">对话框文本</label>
          <textarea className="form-textarea" value={dialogue} onChange={(e) => setDialogue(e.target.value)} placeholder="输入角色对话内容..." rows={4} />
        </div>
        <div className="form-group">
          <label className="form-label">关联角色</label>
          <select className="form-select" value={newCharId} onChange={(e) => {
            if (e.target.value && !selectedCharIds.includes(e.target.value)) {
              setSelectedCharIds([...selectedCharIds, e.target.value]);
              setNewCharId('');
            }
          }}>
            <option value="">选择角色...</option>
            {availableChars.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {selectedChars.length > 0 && (
            <div className="character-chips">
              {selectedChars.map((c) => (
                <span key={c.id} className="character-chip">
                  <span className="character-chip-dot" style={{ background: c.avatarColor }} />
                  {c.name}
                  <button className="chip-remove" onClick={() => setSelectedCharIds(selectedCharIds.filter((id) => id !== c.id))}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">页面备注</label>
          <input style={{ width: '100%' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="例如：特写镜头、远景..." />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => {
            storyboardManager.updatePanel(panel.id, { dialogueText: dialogue, notes, characterIds: selectedCharIds });
            onSaved();
          }}>保存</button>
        </div>
      </div>
    </div>
  );
}

function CharactersView() {
  const { characters, refresh } = useAppCtx();
  const [showNew, setShowNew] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  return (
    <div>
      <div className="action-bar">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">角色库</h1>
          <p className="page-subtitle">管理你的漫画角色设定，共 {characters.length} 个角色</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} />新建角色
        </button>
      </div>
      {characters.length > 0 ? (
        <div className="character-grid">
          {characters.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              onEdit={() => setEditingChar(c)}
              onDelete={() => { characterManager.removeCharacter(c.id); refresh(); }}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🎭</div>
          <div className="empty-state-text">还没有角色，点击右上角创建第一个角色</div>
        </div>
      )}
      {showNew && (
        <CharacterModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSubmit={(data) => {
            const nc = characterManager.addCharacter(data.name);
            characterManager.updateCharacter(nc.id, { avatarColor: data.color, personalityTags: data.tags, catchphrase: data.catchphrase });
            refresh();
            setShowNew(false);
          }}
        />
      )}
      {editingChar && (
        <CharacterModal
          mode="edit"
          character={editingChar}
          onClose={() => setEditingChar(null)}
          onSubmit={(data) => {
            characterManager.updateCharacter(editingChar.id, { name: data.name, avatarColor: data.color, personalityTags: data.tags, catchphrase: data.catchphrase });
            refresh();
            setEditingChar(null);
          }}
        />
      )}
    </div>
  );
}

function CharacterCard({ character, onEdit, onDelete }: { character: Character; onEdit: () => void; onDelete: () => void }) {
  const [showColor, setShowColor] = useState(false);
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColor(true);
  };
  return (
    <div className="character-card" onClick={onEdit}>
      <button className="character-delete" onClick={(e) => { e.stopPropagation(); if (confirm(`删除角色「${character.name}」？`)) onDelete(); }}>
        <Trash2 size={14} />
      </button>
      <div className="character-avatar" style={{ background: character.avatarColor }} onClick={handleAvatarClick} title="点击更换颜色" />
      <div className="character-name">{character.name}</div>
      <div className="character-tags">
        {character.personalityTags.slice(0, 3).map((t, i) => (
          <span key={i} className="personality-tag">{t}</span>
        ))}
      </div>
      {showColor && (
        <ColorPickerModal
          current={character.avatarColor}
          onClose={() => setShowColor(false)}
          onSelect={(color) => {
            characterManager.updateCharacter(character.id, { avatarColor: color });
            setShowColor(false);
          }}
        />
      )}
    </div>
  );
}

function ColorPickerModal({ current, onClose, onSelect }: { current: string; onClose: () => void; onSelect: (color: string) => void }) {
  const [selected, setSelected] = useState(current);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={onClose}>
      <div className="modal-panel" style={{ width: 320 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">选择头像颜色</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="color-picker-wrapper">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch ${selected === color ? 'selected' : ''}`}
              style={{ background: color }}
              onClick={() => setSelected(color)}
            />
          ))}
          <label className="color-swatch custom" onClick={() => inputRef.current?.click()}>
            <Palette size={14} style={{ opacity: 0.5 }} />
            <input ref={inputRef} type="color" className="custom-color-input" value={selected} onChange={(e) => setSelected(e.target.value)} />
          </label>
        </div>
        <div className="modal-footer" style={{ marginTop: 20 }}>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => onSelect(selected)}>确认</button>
        </div>
      </div>
    </div>
  );
}

interface CharFormData {
  name: string;
  color: string;
  tags: string[];
  catchphrase: string;
}

function CharacterModal({ mode, character, onClose, onSubmit }: {
  mode: 'create' | 'edit';
  character?: Character;
  onClose: () => void;
  onSubmit: (data: CharFormData) => void;
}) {
  const [name, setName] = useState(character?.name ?? '');
  const [color, setColor] = useState(character?.avatarColor ?? PRESET_COLORS[0]);
  const [catchphrase, setCatchphrase] = useState(character?.catchphrase ?? '');
  const [tags, setTags] = useState<string[]>(character?.personalityTags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && tags.length < 5 && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({ name: name.trim(), color, tags, catchphrase });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'create' ? '新建角色' : '编辑角色'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="character-avatar" style={{ width: 64, height: 64, background: color, margin: 0, cursor: 'pointer' }} onClick={() => setShowColorPicker(true)} title="点击更换颜色" />
          <div style={{ flex: 1 }}>
            <input style={{ width: '100%' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="角色名称" autoFocus />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">性格关键词（最多5个）</label>
          <div className="tag-input-container">
            {tags.map((t, i) => (
              <span key={i} className="tag-item">
                {t}
                <button onClick={() => setTags(tags.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
            <input
              className="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
              placeholder={tags.length < 5 ? '输入后回车添加...' : '已达上限'}
              disabled={tags.length >= 5}
              maxLength={10}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">口头禅</label>
          <input style={{ width: '100%' }} value={catchphrase} onChange={(e) => setCatchphrase(e.target.value)} placeholder="例如：这就是命运吧..." />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSubmit}>{mode === 'create' ? '创建' : '保存'}</button>
        </div>
        {showColorPicker && (
          <ColorPickerModal current={color} onClose={() => setShowColorPicker(false)} onSelect={(c) => { setColor(c); setShowColorPicker(false); }} />
        )}
      </div>
    </div>
  );
}

function TimelineView() {
  const { currentProject, chapters, refresh } = useAppCtx();
  const [, setPlayerTick] = useState(0);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    timelinePlayer.setStateChangeListener(() => setPlayerTick((t) => t + 1));
    return () => timelinePlayer.cleanup();
  }, []);

  if (!currentProject) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🕰️</div>
        <div className="empty-state-text">请先选择或创建一个漫画项目</div>
      </div>
    );
  }

  const playerState = timelinePlayer.getState();
  const timeline = timelinePlayer.getTimeline(currentProject.id);
  const playerChapterId = playerState.currentChapterId;
  const playerChapter = chapters.find((c) => c.id === playerChapterId) ?? null;
  const playerPanels = playerChapter ? storyboardManager.getPanels(playerChapter.id) : [];
  const currentPanelIndex = playerState.currentPanelIndex;
  const currentPanel = playerPanels[currentPanelIndex] ?? null;

  const safeStart = () => {
    if (playerChapterId) {
      timelinePlayer.startPlaying(playerChapterId);
      setFlipKey((k) => k + 1);
    }
  };
  const safeStop = () => { timelinePlayer.stopPlaying(); setFlipKey((k) => k + 1); };
  const safePrev = () => { if (timelinePlayer.prevPanel()) setFlipKey((k) => k + 1); };
  const safeNext = () => { if (timelinePlayer.nextPanel()) setFlipKey((k) => k + 1); };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">故事线时间轴</h1>
        <p className="page-subtitle">按章节顺序预览整个故事线，点击章节可展开查看分镜</p>
      </div>
      {playerChapter && (
        <div className="player-stage">
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
            🎬 正在播放：{playerChapter.title}
          </div>
          <div className="page-flip-container" key={flipKey}>
            <div className="page-face current">
              <span className="page-face-title">分镜 {currentPanelIndex + 1} / {playerPanels.length}</span>
              <div style={{ display: 'flex', gap: 6, position: 'absolute', top: 12, right: 16 }}>
                {currentPanel?.characterIds.map((cid) => (
                  <span key={cid} className="character-dot" style={{ width: 16, height: 16, background: characterManager.getCharacterColor(cid) }} />
                ))}
              </div>
              <div style={{ fontSize: 56, opacity: 0.18 }}>📄</div>
              <div style={{ color: '#B8A89A', fontSize: 12, marginTop: 8 }}>分镜画布</div>
            </div>
          </div>
          {currentPanel && currentPanel.dialogueText && (
            <div key={`d-${playerChapterId}-${currentPanelIndex}-${flipKey}`} className="player-dialogue">
              <div className="player-dialogue-text">「{currentPanel.dialogueText}」</div>
              {currentPanel.notes && <div className="player-dialogue-note">— {currentPanel.notes}</div>}
            </div>
          )}
          <div className="player-progress">
            {currentPanelIndex + 1} / {playerPanels.length}
          </div>
          <div className="player-controls">
            <button className="player-btn" onClick={safePrev} disabled={currentPanelIndex === 0 || playerState.isPlaying}>
              <ChevronLeft size={20} />
            </button>
            <button className="player-btn play" onClick={playerState.isPlaying ? safeStop : safeStart} disabled={!playerChapterId}>
              {playerState.isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button className="player-btn" onClick={safeNext} disabled={currentPanelIndex >= playerPanels.length - 1 || playerState.isPlaying}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
      <div className="timeline-container">
        {timeline.map(({ chapter, panels }) => {
          const expanded = timelinePlayer.isChapterExpanded(chapter.id);
          const isSelected = playerChapterId === chapter.id;
          return (
            <div key={chapter.id} className="timeline-chapter">
              <div className="timeline-card">
                <div className="timeline-card-header" onClick={() => timelinePlayer.toggleChapter(chapter.id)}>
                  <div className="timeline-chapter-info">
                    <div className="timeline-chapter-order">{chapters.findIndex((c) => c.id === chapter.id) + 1}</div>
                    <div>
                      <div className="timeline-chapter-title">{chapter.title}</div>
                      <div className="chapter-meta" style={{ marginTop: 4 }}>
                        <span className={`status-badge status-${chapter.status}`} style={{ position: 'static', display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
                        <span>{STATUS_LABELS[chapter.status]}</span>
                        <span style={{ marginLeft: 8 }}>{panels.length}页</span>
                      </div>
                    </div>
                  </div>
                  <div className="timeline-chapter-meta">
                    {!isSelected && (
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          timelinePlayer.selectChapter(chapter.id);
                          if (!expanded) timelinePlayer.toggleChapter(chapter.id);
                          setFlipKey((k) => k + 1);
                        }}
                      >
                        <Play size={14} />播放故事线
                      </button>
                    )}
                    <ChevronDown className={`timeline-expand-icon ${expanded ? 'expanded' : ''}`} size={20} />
                  </div>
                </div>
                <div className="timeline-card-content" style={{ maxHeight: expanded ? 500 : 0 }}>
                  <div className="timeline-panels">
                    {panels.map((p, idx) => (
                      <button
                        key={p.id}
                        className={`timeline-panel-thumb ${isSelected && idx === currentPanelIndex ? 'active' : ''}`}
                        onClick={() => {
                          if (!isSelected) timelinePlayer.selectChapter(chapter.id);
                          timelinePlayer.setCurrentPanelIndex(idx);
                          setEditingPanel(p);
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>#{idx + 1}</div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {p.characterIds.slice(0, 3).map((cid) => (
                            <span key={cid} style={{ width: 10, height: 10, borderRadius: '50%', background: characterManager.getCharacterColor(cid), border: '1px solid #fff' }} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {editingPanel && (
        <PanelEditModal panel={editingPanel} onClose={() => setEditingPanel(null)} onSaved={() => { refresh(); setEditingPanel(null); setFlipKey((k) => k + 1); }} />
      )}
    </div>
  );
}
