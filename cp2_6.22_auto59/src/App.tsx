import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Search from '@/pages/Search';
import Settings from '@/pages/Settings';
import Report from '@/pages/Report';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
