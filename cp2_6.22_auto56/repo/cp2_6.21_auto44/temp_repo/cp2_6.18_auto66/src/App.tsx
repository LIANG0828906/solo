import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IssueList from '@/components/IssueList';
import IssueDetail from '@/components/IssueDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IssueList />} />
        <Route path="/issue/:id" element={<IssueDetail />} />
      </Routes>
    </Router>
  );
}
