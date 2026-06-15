import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectList } from '@/pages/ProjectList';
import { ProjectReader } from '@/pages/ProjectReader';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:id" element={<ProjectReader />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
