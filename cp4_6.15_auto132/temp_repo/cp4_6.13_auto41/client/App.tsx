import { Routes, Route, Navigate } from 'react-router-dom';
import BoardPage from './pages/BoardPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/join" replace />} />
      <Route path="/join" element={<LoginPage />} />
      <Route path="/board/:roomId" element={<BoardPage />} />
    </Routes>
  );
}

export default App;
