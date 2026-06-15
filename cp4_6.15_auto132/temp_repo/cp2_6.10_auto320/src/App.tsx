import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Garden } from './components/Garden';
import { Report } from './components/Report';
import { useGardenStore } from './store/gardenStore';

function App() {
  const { init } = useGardenStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Garden />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </Router>
  );
}

export default App;
