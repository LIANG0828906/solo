import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import BoardList from './components/BoardList';
import BoardDetail from './components/BoardDetail';
import { fetchBoards, createBoard } from './api';
import { BoardSummary } from './types';

function CreateBoardModal({ onClose, onCreated }: { onClose: () => void; onCreated: (b: BoardSummary) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const board = await createBoard(name.trim(), description.trim());
    onCreated(board);
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 20, color: '#00D4AA', fontSize: 20 }}>创建看板</h2>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>看板名称</label>
          <input
            style={{ ...inputStyle, width: 300 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入看板名称"
            autoFocus
          />
          <label style={labelStyle}>看板描述</label>
          <textarea
            style={{ ...inputStyle, width: '100%', minHeight: 80, resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入看板描述（可选）"
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>取消</button>
            <button type="submit" style={submitBtnStyle} disabled={!name.trim()}>创建</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
};

const modalStyle: React.CSSProperties = {
  background: '#2A2A3E', borderRadius: 12, padding: 28, width: 400, maxWidth: '90vw',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, marginTop: 14, color: '#aaa', fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  background: '#25253A', border: '1px solid #444', borderRadius: 8, padding: '10px 14px',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: 8,
  padding: '8px 20px', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
};

const submitBtnStyle: React.CSSProperties = {
  background: '#00D4AA', border: 'none', color: '#1E1E2E', borderRadius: 8,
  padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
};

function BoardDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return null;
  return <BoardDetail boardId={id} onBack={() => navigate('/')} />;
}

export default function App() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const loadBoards = async () => {
    const data = await fetchBoards();
    setBoards(data);
  };

  useEffect(() => { loadBoards(); }, []);

  const handleBoardCreated = (board: BoardSummary) => {
    setBoards((prev) => [...prev, board]);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1E1E2E' }}>
      <Routes>
        <Route path="/" element={
          <BoardList
            boards={boards}
            onBoardClick={(id) => navigate(`/board/${id}`)}
            onCreateBoard={() => setShowCreate(true)}
          />
        } />
        <Route path="/board/:id" element={<BoardDetailWrapper />} />
      </Routes>
      {showCreate && (
        <CreateBoardModal onClose={() => setShowCreate(false)} onCreated={handleBoardCreated} />
      )}
    </div>
  );
}
