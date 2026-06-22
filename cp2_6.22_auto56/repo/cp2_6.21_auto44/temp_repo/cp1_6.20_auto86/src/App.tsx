import React, { useState, useCallback } from 'react';
import CanvasPage from './pages/CanvasPage';
import type { User, Room } from './types';

export default function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showJoin, setShowJoin] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');

  const handleCreateRoom = useCallback(async () => {
    const name = joinName.trim() || 'Anonymous';
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setRoom(data.room);
    setCurrentUser(data.user);
    setShowJoin(false);
  }, [joinName]);

  const handleJoinRoom = useCallback(async () => {
    const code = joinCode.trim();
    const name = joinName.trim() || 'Anonymous';
    if (!code) return;
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoom(data.room);
      setCurrentUser(data.user);
      setShowJoin(false);
    } else {
      alert('Room not found');
    }
  }, [joinCode, joinName]);

  if (showJoin || !room || !currentUser) {
    return (
      <div className="join-modal-overlay">
        <div className="join-modal">
          <h2>IllustraSync</h2>
          <div className="join-modal-inputs">
            <input
              placeholder="Your name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
            <input
              placeholder="Room code (leave empty to create new)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  joinCode ? handleJoinRoom() : handleCreateRoom();
                }
              }}
            />
          </div>
          <div className="join-modal-actions">
            <button className="btn btn-primary" onClick={handleCreateRoom}>
              Create Room
            </button>
            <button className="btn btn-secondary" onClick={handleJoinRoom}>
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CanvasPage
      initialRoom={room}
      currentUser={currentUser}
      onRoomUpdate={setRoom}
    />
  );
}
