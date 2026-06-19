import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import JobList from './modules/jobs/JobList';
import JobDetail from './modules/jobs/JobDetail';
import ReferralTracker from './modules/referrals/ReferralTracker';
import RewardCalculator from './modules/rewards/RewardCalculator';
import { NotificationProvider } from './context/NotificationContext';

const App = () => {
  return (
    <NotificationProvider>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%'
      }}>
        <Navbar />
        
        <main style={{
          flex: 1,
          backgroundColor: '#F5F5F5',
          padding: '24px',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Routes>
            <Route path="/" element={<JobList />} />
            <Route path="/job/:id" element={<JobDetail />} />
            <Route path="/referrals" element={<ReferralTracker />} />
            <Route path="/rewards" element={<RewardCalculator />} />
          </Routes>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default App;
