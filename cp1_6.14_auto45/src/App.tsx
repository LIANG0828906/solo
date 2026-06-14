import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoomList from '@/pages/RoomList';
import RoomDetail from '@/pages/RoomDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomList />} />
        <Route path="/room/:id" element={<RoomDetail />} />
      </Routes>
    </Router>
  );
}
