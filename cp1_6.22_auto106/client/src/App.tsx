import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPanel from './pages/StudentPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student/:code" element={<StudentPanel />} />
        <Route path="/" element={<Navigate to="/teacher" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
