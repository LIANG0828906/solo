import { Routes, Route, Navigate } from 'react-router-dom';
import HostPanel from './components/HostPanel';
import VoterView from './components/VoterView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/host" replace />} />
      <Route path="/host" element={<HostPanel />} />
      <Route path="/voter/:voteId" element={<VoterView />} />
    </Routes>
  );
}

export default App;
