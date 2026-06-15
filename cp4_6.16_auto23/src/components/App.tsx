import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import EditorPage from '../pages/EditorPage';
import { useStore } from '../store/useStore';

export default function App() {
  const loadMemes = useStore((state) => state.loadMemes);

  useEffect(() => {
    loadMemes();
  }, [loadMemes]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/editor/:id" element={<EditorPage />} />
    </Routes>
  );
}
