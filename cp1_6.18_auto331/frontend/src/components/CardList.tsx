import { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import NoteCard from './NoteCard';
import { LANGUAGE_FAMILIES } from '../types';

interface CardListProps {
  onPlayNote: (id: number) => void;
}

export default function CardList({ onPlayNote }: CardListProps) {
  const notes = useAppStore((state) => state.notes);
  const selectedNotes = useAppStore((state) => state.selectedNotes);
  const toggleNoteSelection = useAppStore((state) => state.toggleNoteSelection);
  const filterFamily = useAppStore((state) => state.filterFamily);
  const addNote = useAppStore((state) => state.addNote);
  const isOnline = useAppStore((state) => state.isOnline);

  const [showCreate, setShowCreate] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newIpa, setNewIpa] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newFamily, setNewFamily] = useState('印欧语系');
  const [newAudio, setNewAudio] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredNotes = filterFamily
    ? notes.filter((n) => n.languageFamily === filterFamily)
    : notes;

  const handleCreateNote = async () => {
    if (!newWord || !newIpa) return;
    
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('word', newWord);
      formData.append('ipa', newIpa);
      formData.append('description', newDesc);
      formData.append('language_family', newFamily);
      formData.append('user_id', '1');
      if (newAudio) {
        formData.append('audio', newAudio);
      }

      const response = await fetch('/api/notes', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        addNote(data.note);
        setShowCreate(false);
        setNewWord('');
        setNewIpa('');
        setNewDesc('');
        setNewAudio(null);
      }
    } catch (error) {
      console.error('创建笔记失败:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setNewAudio(file);
    }
  };

  return (
    <div className="card-list-container">
      <div className="card-list-header">
        <h2 className="list-title">语音笔记</h2>
        <span className="list-count">{filteredNotes.length} 条</span>
        <button
          className="add-btn"
          onClick={() => setShowCreate(true)}
          disabled={!isOnline}
        >
          + 新建
        </button>
      </div>

      {showCreate && (
        <div className="create-form">
          <h3>创建新笔记</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="单词"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="IPA音标，如 /həˈloʊ/"
              value={newIpa}
              onChange={(e) => setNewIpa(e.target.value)}
            />
          </div>
          <div className="form-row">
            <select
              value={newFamily}
              onChange={(e) => setNewFamily(e.target.value)}
            >
              {LANGUAGE_FAMILIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <textarea
              placeholder="描述（最多200字）"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value.slice(0, 200))}
              rows={2}
            />
            <span className="char-count">{newDesc.length}/200</span>
          </div>
          <div className="form-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,audio/wav"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {newAudio ? newAudio.name : '上传录音 (WAV, ≤5MB)'}
            </button>
          </div>
          <div className="form-actions">
            <button
              className="cancel-btn"
              onClick={() => setShowCreate(false)}
            >
              取消
            </button>
            <button
              className="submit-btn"
              onClick={handleCreateNote}
              disabled={creating || !newWord || !newIpa}
            >
              {creating ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      )}

      <div className="card-list">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <p>暂无语音笔记</p>
            <span>点击上方"新建"按钮添加第一条笔记</span>
          </div>
        ) : (
          filteredNotes.map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={selectedNotes.includes(note.id)}
              index={index}
              onSelect={toggleNoteSelection}
              onPlay={onPlayNote}
            />
          ))
        )}
      </div>

      <style>{`
        .card-list-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .card-list-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding: 0 4px;
          flex-shrink: 0;
        }

        .list-title {
          font-size: 18px;
          font-weight: 600;
          color: #E0E0E0;
          margin: 0;
        }

        .list-count {
          color: #888;
          font-size: 13px;
        }

        .add-btn {
          margin-left: auto;
          background: linear-gradient(135deg, #7C4DFF, #00BFFF);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .add-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 77, 255, 0.4);
        }

        .add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .create-form {
          background: #1E1E2E;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid rgba(124, 77, 255, 0.3);
        }

        .create-form h3 {
          margin: 0 0 12px 0;
          color: #E0E0E0;
          font-size: 14px;
        }

        .form-row {
          margin-bottom: 10px;
          position: relative;
        }

        .form-row input,
        .form-row select,
        .form-row textarea {
          width: 100%;
          background: #2A2A3A;
          border: 1px solid #3D3D3D;
          border-radius: 8px;
          padding: 10px 12px;
          color: #E0E0E0;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
        }

        .form-row textarea {
          resize: vertical;
          font-family: inherit;
        }

        .form-row input:focus,
        .form-row select:focus,
        .form-row textarea:focus {
          border-color: #7C4DFF;
        }

        .char-count {
          position: absolute;
          right: 8px;
          bottom: 6px;
          font-size: 10px;
          color: #666;
        }

        .upload-btn {
          width: 100%;
          background: #2A2A3A;
          border: 1px dashed #3D3D3D;
          border-radius: 8px;
          padding: 10px;
          color: #888;
          font-size: 12px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .upload-btn:hover {
          border-color: #7C4DFF;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .cancel-btn {
          flex: 1;
          background: #3D3D3D;
          color: #B0B0B0;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          cursor: pointer;
        }

        .submit-btn {
          flex: 1;
          background: linear-gradient(135deg, #7C4DFF, #00BFFF);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          cursor: pointer;
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-content: start;
        }

        .card-list::-webkit-scrollbar {
          width: 6px;
        }

        .card-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .card-list::-webkit-scrollbar-thumb {
          background: #3D3D3D;
          border-radius: 3px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-state p {
          margin: 0 0 8px 0;
          color: #888;
          font-size: 14px;
        }

        .empty-state span {
          font-size: 12px;
          color: #666;
        }

        @media (max-width: 768px) {
          .card-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
