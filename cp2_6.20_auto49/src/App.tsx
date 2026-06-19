import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import FabMenu from '@/components/FabMenu';

const EditorPage = () => <div className="p-8 text-center text-lg">Editor Page</div>;
const GraphPage = () => <div className="p-8 text-center text-lg">Graph Page</div>;
const SearchPage = () => <div className="p-8 text-center text-lg">Search Page</div>;

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
