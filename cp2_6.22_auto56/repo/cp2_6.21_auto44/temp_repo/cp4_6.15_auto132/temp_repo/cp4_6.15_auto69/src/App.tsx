import { Routes, Route, Navigate } from 'react-router-dom';
import RoomListPage from '@/pages/RoomListPage';
import StoryLinePage from '@/pages/StoryLinePage';
import ReadingMode from '@/pages/ReadingMode';

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<RoomListPage />} />
        <Route path="/story/:id" element={<StoryLinePage />} />
        <Route path="/story/:id/read" element={<ReadingMode />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
