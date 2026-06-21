import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';

const CanvasPage = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-gray-700 mb-2">Canvas Room</h1>
        <p className="text-gray-500">Loading canvas...</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<CanvasPage />} />
    </Routes>
  );
}
