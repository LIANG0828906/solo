import { Routes, Route } from 'react-router-dom';
import Timeline from './Timeline';
import AddEntry from './AddEntry';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Timeline />} />
      <Route path="/add" element={<AddEntry />} />
    </Routes>
  );
}

export default App;
