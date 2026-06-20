import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorLayout from '@/components/EditorLayout';
import ShareLoader from '@/components/ShareLoader';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EditorLayout />} />
        <Route path="/share/:courseId" element={<ShareLoader />} />
      </Routes>
    </Router>
  );
}
