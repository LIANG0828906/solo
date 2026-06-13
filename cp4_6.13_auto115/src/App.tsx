import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from './pages/Editor';
import ResponseView from './pages/ResponseView';
import Share from './pages/Share';
import Survey from './pages/Survey';
import SurveyList from './pages/SurveyList';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/surveys" replace />} />
      <Route path="/admin/surveys" element={<SurveyList />} />
      <Route path="/admin/editor" element={<Editor />} />
      <Route path="/admin/editor/:id" element={<Editor />} />
      <Route path="/admin/responses/:id" element={<ResponseView />} />
      <Route path="/admin/share/:id" element={<Share />} />
      <Route path="/s/:id" element={<Survey />} />
    </Routes>
  );
}
