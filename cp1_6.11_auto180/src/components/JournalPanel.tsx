import React, { useState } from 'react';
import { useStore } from '../store';
import { Note, Artifact, PRESET_TAGS } from '../types';

interface JournalPanelProps {
  isMobile: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const JournalPanel: React.FC<JournalPanelProps> = ({ isMobile, isExpanded, onToggle }) => {
  const { notes, addNote, selectedTag, setSelectedTag, artifacts, setViewingArtifact, currentArtifact, pickedFragments } = useStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoveredArtifact, setHoveredArtifact] = useState<string | null>(null);

  const filteredNotes = selectedTag
    ? notes.filter((note: Note) => note.tags.includes(selectedTag))
    : notes;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    addNote(title.trim() || content.slice(0, 20), content.trim(), selectedTags);
    setTitle('');
    setContent('');
    setSelectedTags([]);
  };

  const completedArtifacts = artifacts.filter((a: Artifact) => a.completedAt);
  const currentProgress = currentArtifact
    ? pickedFragments.filter((f) => f.isPlaced).length + ' / ' + currentArtifact.fragments.length
    : '0 / 0';

  const panelContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#2C1810',
        color: '#E8D5B7',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #8B7355',
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '8px', color: '#D4C5A9' }}>
          考古笔记
        </h2>
        <div style={{ fontSize: '12px', color: '#A0845C' }}>
          当前进度：{currentProgress}
        </div>
      </div>

      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #8B7355',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            placeholder="笔记标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#3D2B1F',
              border: '1px solid #8B7355',
              borderRadius: '4px',
              color: '#E8D5B7',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <textarea
            placeholder="记录发现..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            style={{
              padding: '8px 12px',
              backgroundColor: '#3D2B1F',
              border: '1px solid #8B7355',
              borderRadius: '4px',
              color: '#E8D5B7',
              fontSize: '13px',
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: selectedTags.includes(tag) ? '#A0845C' : '#8B7355',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#E8D5B7',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#A0845C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selectedTags.includes(tag) ? '#A0845C' : '#8B7355';
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#8B7355',
              border: 'none',
              borderRadius: '4px',
              color: '#E8D5B7',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            保存笔记
          </button>
        </form>
      </div>

      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #8B7355',
        }}
      >
        <div style={{ fontSize: '13px', marginBottom: '8px', color: '#D4C5A9' }}>
          标签筛选
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => setSelectedTag(null)}
            style={{
              padding: '4px 10px',
              backgroundColor: selectedTag === null ? '#A0845C' : '#8B7355',
              border: 'none',
              borderRadius: '12px',
              color: '#E8D5B7',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#A0845C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = selectedTag === null ? '#A0845C' : '#8B7355';
            }}
          >
            全部
          </button>
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '4px 10px',
                backgroundColor: selectedTag === tag ? '#A0845C' : '#8B7355',
                border: 'none',
                borderRadius: '12px',
                color: '#E8D5B7',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#A0845C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = selectedTag === tag ? '#A0845C' : '#8B7355';
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {filteredNotes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8B7355', padding: '20px', fontSize: '12px' }}>
            暂无笔记
          </div>
        ) : (
          filteredNotes.map((note: Note) => (
            <div
              key={note.id}
              style={{
                padding: '10px',
                borderBottom: '1px solid #4A3728',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3D2B1F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#D4C5A9',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {note.title.slice(0, 20)}
                {note.title.length > 20 && '...'}
              </div>
              <div style={{ fontSize: '11px', color: '#8B7355', marginBottom: '6px' }}>
                {formatTimestamp(note.timestamp)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#8B7355',
                      borderRadius: '10px',
                      fontSize: '10px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #8B7355',
        }}
      >
        <div style={{ fontSize: '13px', marginBottom: '10px', color: '#D4C5A9' }}>
          藏品柜 ({completedArtifacts.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {completedArtifacts.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#8B7355' }}>
              暂无藏品
            </div>
          ) : (
            completedArtifacts.map((artifact: Artifact) => (
              <div
                key={artifact.id}
                style={{
                  position: 'relative',
                  width: 60,
                  height: 60,
                  borderRadius: '6px',
                  border: '1.5px solid #A0845C',
                  backgroundColor: '#3D2B1F',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                  overflow: 'hidden',
                  transform: hoveredArtifact === artifact.id ? 'scale(1.1)' : 'scale(1)',
                }}
                onMouseEnter={() => setHoveredArtifact(artifact.id)}
                onMouseLeave={() => setHoveredArtifact(null)}
                onClick={() => setViewingArtifact(artifact)}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: hoveredArtifact === artifact.id ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: artifact.color,
                      borderRadius: '50% 50% 45% 45%',
                      boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
                {hoveredArtifact === artifact.id && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '4px 8px',
                      backgroundColor: '#2C1810',
                      border: '1px solid #A0845C',
                      borderRadius: '4px',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      marginBottom: '4px',
                    }}
                  >
                    {artifact.name}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ width: '100%' }}>
        <button
          onClick={onToggle}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2C1810',
            color: '#E8D5B7',
            border: 'none',
            borderBottom: isExpanded ? '1px solid #8B7355' : 'none',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>考古笔记</span>
          <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
            ▼
          </span>
        </button>
        {isExpanded && (
          <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {panelContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 220,
        height: '100%',
        borderRight: '1px solid #8B7355',
      }}
    >
      {panelContent}
    </div>
  );
};

export default JournalPanel;
