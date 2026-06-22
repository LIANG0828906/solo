import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClassList } from '@/pages/ClassList';
import { GradingPage } from '@/pages/GradingPage';
import { StatsDashboard } from '@/pages/StatsDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClassList />} />
        <Route path="/grading/:classId/:essayId" element={<GradingPage />} />
        <Route path="/stats/:classId?" element={<StatsDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
