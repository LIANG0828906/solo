import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/hooks/useAppStore';
import Home from '@/pages/Home';
import StudentWorkspace from '@/pages/StudentWorkspace';
import TeacherDashboard from '@/pages/TeacherDashboard';
import TeacherAssignments from '@/pages/TeacherAssignments';
import TeacherReview from '@/pages/TeacherReview';

export default function App() {
  const role = useAppStore((s) => s.role);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/student"
          element={role === 'student' ? <StudentWorkspace /> : <Navigate to="/" />}
        />
        <Route
          path="/teacher"
          element={role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/teacher/assignments"
          element={role === 'teacher' ? <TeacherAssignments /> : <Navigate to="/" />}
        />
        <Route
          path="/teacher/review/:submissionId"
          element={role === 'teacher' ? <TeacherReview /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}
