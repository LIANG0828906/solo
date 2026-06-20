import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import EditorPage from '@/pages/EditorPage';
import GraphPage from '@/pages/GraphPage';
import SearchPage from '@/pages/SearchPage';
import FabMenu from '@/components/FabMenu';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-garden-warm">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
        <FabMenu />
      </div>
    </Router>
  );
}
