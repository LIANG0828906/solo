import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleSelect } from '@/pages/RoleSelect';
import { StudentPage } from '@/pages/StudentPage';
import { TeacherPage } from '@/pages/TeacherPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="font-sans">
        <Routes>
          <Route path="/" element={<RoleSelect />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
