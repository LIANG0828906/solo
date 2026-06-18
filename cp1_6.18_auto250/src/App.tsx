import { Routes, Route, Navigate } from 'react-router-dom';
import CreateRoomPage from './pages/CreateRoomPage';
import VoteRoomPage from './pages/VoteRoomPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateRoomPage />} />
      <Route path="/room/:roomId" element={<VoteRoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
