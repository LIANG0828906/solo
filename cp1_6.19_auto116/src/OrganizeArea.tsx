import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { MdEdit, MdFolder } from 'react-icons/md';
import NoteCard from './NoteCard';
import { useThemeStore, Note, Theme } from './themeStore.tsx';

const OrganizeArea: React.FC = () => {
  const {
    state,
    deleteNote,
    addTheme,
    renameTheme,
    assignNoteToTheme,
    reorderNotes,
  } = useThemeStore();

  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newThemeName, setNewThemeName] = useState('');
  const [showNewThemeInput, setShowNewThemeInput] = useState(false);
  const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);

  const unassignedNotes = state.notes.filter(note => !note.themeId);

  const getThemeNotes = (themeId: string): Note[] => {
    return state.notes.filter(note => note.themeId === themeId);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (destination.droppableId === 'theme-zone') {
      const note = state.notes.find(n => n.id === draggableId);
      if (note && !note.themeId) {
        setPendingNoteId(draggableId);
        setShowNewThemeInput(true);
      } else if (note && note.themeId) {
        assignNoteToTheme(draggableId, undefined);
      }
      return;
    }

    if (destination.droppableId.startsWith('theme-')) {
      const themeId = destination.droppableId.replace('theme-', '');
      const note = state.notes.find(n => n.id === draggableId);
      if (note && note.themeId !== themeId) {
        assignNoteToTheme(draggableId, themeId);
      }
      return;
    }

    if (source.droppableId === 'timeline' && destination.droppableId === 'timeline') {
      const newNotes = [...unassignedNotes];
      const [removed] = newNotes.splice(source.index, 1);
      newNotes.splice(destination.index, 0, removed);
      reorderNotes(newNotes.map(n => n.id));
    }
  };

  const handleCreateTheme = () => {
    if (!newThemeName.trim() || !pendingNoteId) return;
    addTheme(newThemeName.trim(), pendingNoteId);
    setNewThemeName('');
    setShowNewThemeInput(false);
    setPendingNoteId(null);
  };

  const handleStartRenameTheme = (theme: Theme) => {
    setEditingThemeId(theme.id);
    setEditingName(theme.name);
  };

  const handleConfirmRename = () => {
    if (!editingThemeId || !editingName.trim()) return;
    renameTheme(editingThemeId, editingName.trim());
    setEditingThemeId(null);
    setEditingName('');
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          padding: '24px 32px',
          minHeight: '100vh',
          paddingBottom: 140,
        }}
      >
        <div
          style={{
            position: 'relative',
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#2D3436',
              marginBottom: 16,
            }}
          >
            灵感时间线
          </h2>
          <Droppable droppableId="timeline" direction="horizontal">
            {(provided, snapshot) => (
              <motion.div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  padding: '16px 0 16px 20px',
                  position: 'relative',
                  minHeight: 160,
                  backgroundColor: snapshot.isDraggingOver
                    ? 'rgba(102, 126, 234, 0.05)'
                    : 'transparent',
                  borderRadius: 12,
                  transition: 'background-color 0.2s ease-in-out',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    backgroundColor: '#B2BEC3',
                  }}
                />
                {unassignedNotes.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 20px',
                      color: '#B2BEC3',
                      fontSize: 14,
                      textAlign: 'center',
                      width: '100%',
                    }}
                  >
                    还没有灵感，点击左下角按钮捕捉你的第一个想法吧！
                  </div>
                ) : (
                  unassignedNotes.map((note, index) => (
                    <div
                      key={note.id}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: -20,
                          top: 56,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: '#74B9FF',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          zIndex: 1,
                        }}
                      />
                      <NoteCard
                        note={note}
                        index={index}
                        onDelete={deleteNote}
                      />
                    </div>
                  ))
                )}
                {provided.placeholder}
              </motion.div>
            )}
          </Droppable>
        </div>

        {state.themes.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#2D3436',
                marginBottom: 16,
              }}
            >
              主题整理
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {state.themes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  notes={getThemeNotes(theme.id)}
                  onDelete={deleteNote}
                  isEditing={editingThemeId === theme.id}
                  editingName={editingName}
                  setEditingName={setEditingName}
                  onStartRename={() => handleStartRenameTheme(theme)}
                  onConfirmRename={handleConfirmRename}
                  onCancelRename={() => {
                    setEditingThemeId(null);
                    setEditingName('');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 120,
            right: 32,
            zIndex: 50,
          }}
        >
          <Droppable droppableId="theme-zone">
            {(provided, snapshot) => (
              <motion.div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: snapshot.isDraggingOver
                    ? 'rgba(102, 126, 234, 0.15)'
                    : 'rgba(248, 249, 250, 0.95)',
                  border: snapshot.isDraggingOver
                    ? '2px dashed #667eea'
                    : '2px dashed #DFE6E9',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                }}
              >
                <AnimatePresence>
                  {showNewThemeInput ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <input
                        autoFocus
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTheme();
                          if (e.key === 'Escape') {
                            setShowNewThemeInput(false);
                            setPendingNoteId(null);
                            setNewThemeName('');
                          }
                        }}
                        placeholder="输入主题名称..."
                        style={{
                          width: 240,
                          padding: '10px 16px',
                          borderRadius: 10,
                          border: '2px solid #DFE6E9',
                          outline: 'none',
                          fontSize: 14,
                          color: '#2D3436',
                          transition: 'border-color 0.2s ease-in-out',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#667eea';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#DFE6E9';
                        }}
                      />
                      <button
                        onClick={handleCreateTheme}
                        disabled={!newThemeName.trim()}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 10,
                          border: 'none',
                          background: newThemeName.trim()
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#DFE6E9',
                          color: '#fff',
                          cursor: newThemeName.trim() ? 'pointer' : 'not-allowed',
                          fontSize: 14,
                          fontWeight: 500,
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        创建主题
                      </button>
                      <button
                        onClick={() => {
                          setShowNewThemeInput(false);
                          setPendingNoteId(null);
                          setNewThemeName('');
                        }}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 10,
                          border: 'none',
                          backgroundColor: '#DFE6E9',
                          color: '#636E72',
                          cursor: 'pointer',
                          fontSize: 14,
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        取消
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: snapshot.isDraggingOver ? '#667eea' : '#B2BEC3',
                        fontSize: 15,
                      }}
                    >
                      <MdFolder size={24} />
                      <span>
                        {snapshot.isDraggingOver
                          ? '松开创建新主题'
                          : '拖拽便签到此处创建新主题'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {provided.placeholder}
              </motion.div>
            )}
          </Droppable>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .organize-timeline {
            flex-direction: column !important;
          }
        }
      `}</style>
    </DragDropContext>
  );
};

interface ThemeCardProps {
  theme: Theme;
  notes: Note[];
  onDelete: (id: string) => void;
  isEditing: boolean;
  editingName: string;
  setEditingName: (name: string) => void;
  onStartRename: () => void;
  onConfirmRename: () => void;
  onCancelRename: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  notes,
  isEditing,
  editingName,
  setEditingName,
  onStartRename,
  onConfirmRename,
  onCancelRename,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <MdFolder size={20} />
          </div>
          {isEditing ? (
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirmRename();
                if (e.key === 'Escape') onCancelRename();
              }}
              autoFocus
              style={{
                width: 240,
                padding: '8px 12px',
                borderRadius: 8,
                border: '2px solid #DFE6E9',
                outline: 'none',
                fontSize: 15,
                fontWeight: 600,
                color: '#2D3436',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#DFE6E9';
              }}
            />
          ) : (
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#2D3436',
                margin: 0,
              }}
            >
              {theme.name}
            </h3>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={onStartRename}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#F5F6FA',
              color: '#636E72',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#667eea';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F5F6FA';
              (e.currentTarget as HTMLButtonElement).style.color = '#636E72';
            }}
          >
            <MdEdit size={16} />
          </button>
        )}
        {isEditing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onConfirmRename}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#667eea',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              确认
            </button>
            <button
              onClick={onCancelRename}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#F5F6FA',
                color: '#636E72',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              取消
            </button>
          </div>
        )}
      </div>
      <Droppable droppableId={`theme-${theme.id}`} direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              minHeight: 60,
            }}
          >
            {notes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                index={index}
                onDelete={() => {}}
                compact
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </motion.div>
  );
};

export default OrganizeArea;
