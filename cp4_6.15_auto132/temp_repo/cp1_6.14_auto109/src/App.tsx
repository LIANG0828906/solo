import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DigSite from './components/DigSite';
import Workbench from './components/Workbench';
import ExhibitionHall from './components/ExhibitionHall';

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dig-site/:site" element={<DigSite />} />
        <Route path="/workbench" element={<Workbench />} />
        <Route path="/exhibition" element={<ExhibitionHall />} />
      </Routes>
    </div>
  );
}
