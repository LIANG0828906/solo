import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Toast from '@/components/Toast'
import Dashboard from '@/pages/Dashboard'
import TimeRecord from '@/pages/TimeRecord'
import LeaveRequest from '@/pages/LeaveRequest'

export default function App() {
  return (
    <Router>
      <Sidebar />
      <Toast />
      <main
        className="min-h-screen transition-all duration-300"
        style={{
          backgroundColor: '#f5f5f5',
          paddingLeft: 'calc(220px + 24px)',
          paddingRight: 24,
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        <style>{`
          @media (max-width: 767px) {
            main {
              padding-left: 16px !important;
              padding-right: 16px !important;
              padding-top: calc(56px + 16px) !important;
            }
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          button:active {
            transform: scale(0.97);
            transition: transform 0.2s ease-out;
          }
          .approve-btn:active, .reject-btn:active,
          .submit-btn:active, .leave-add-btn:active {
            transform: scale(0.97);
            transition: transform 0.2s ease-out;
          }
        `}</style>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/time-record" element={<TimeRecord />} />
          <Route path="/leave-request" element={<LeaveRequest />} />
        </Routes>
      </main>
    </Router>
  )
}
