import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import NotificationBar from './components/NotificationBar';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import PublishPage from './pages/PublishPage';
import ComparePage from './pages/ComparePage';
import SellerDashboard from './pages/SellerDashboard';
import './index.css';

export default function App() {
  return (
    <Router>
      <NotificationBar />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}
