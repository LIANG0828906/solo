import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import QuestionnaireModule from './QuestionnaireModule';
import TraineeModule from './TraineeModule';
import TraineeQuestionnaire from './components/TraineeQuestionnaire';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/questionnaires" replace />} />
        <Route path="questionnaires" element={<QuestionnaireModule />} />
        <Route path="trainees" element={<TraineeModule />} />
      </Route>
      <Route path="/questionnaire/trainee/:traineeId" element={<TraineeQuestionnaire />} />
    </Routes>
  );
}
