import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorPage from '@/pages/EditorPage';
import SharePage from '@/pages/SharePage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/share/:id" element={<SharePage />} />
      </Routes>
    </Router>
  );
}
