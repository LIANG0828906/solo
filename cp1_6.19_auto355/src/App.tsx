import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import SurveyList from '@/components/SurveyList';
import SurveyEditor from '@/components/SurveyEditor';
import SurveyForm from '@/components/SurveyForm';
import DataDashboard from '@/components/DataDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '12px 24px',
        marginBottom: '24px',
      }}>
        <Link to="/" style={{
          color: '#1677ff',
          fontWeight: 'bold',
          fontSize: '20px',
          textDecoration: 'none',
        }}>
          📋 微型问卷
        </Link>
      </div>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px',
      }}>
        <Routes>
          <Route path="/" element={<SurveyList />} />
          <Route path="/editor/:surveyId?" element={<SurveyEditor />} />
          <Route path="/survey/:surveyId" element={<SurveyForm />} />
          <Route path="/dashboard/:surveyId" element={<DataDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
