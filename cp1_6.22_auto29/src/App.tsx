import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';

export default function App() {
  return (
    <div className="paper-bg">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:id" element={<Room />} />
      </Routes>
    </div>
  );
}
