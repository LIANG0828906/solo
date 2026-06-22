import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SolarScene from './scene/SolarScene';
import ControlPanel from './ui/ControlPanel';
import PlanetInfo from './ui/PlanetInfo';
import { useSolarStore } from './store/useSolarStore';
import { fetchPlanets } from './api/planets';
import { COLORS } from './utils/constants';

function Home() {
  const setPlanets = useSolarStore((state) => state.setPlanets);

  useEffect(() => {
    fetchPlanets()
      .then((data) => {
        setPlanets(data);
      })
      .catch((error) => {
        console.error('Failed to fetch planets:', error);
      });
  }, [setPlanets]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
      }}
    >
      <SolarScene />
      <ControlPanel />
      <PlanetInfo />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
