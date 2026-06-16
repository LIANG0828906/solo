import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ProgramBoard from '@/pages/ProgramBoard';
import ProgramDetail from '@/pages/ProgramDetail';
import GuestManager from '@/pages/GuestManager';
import GuestDetail from '@/pages/GuestDetail';
import PreviewSelect from '@/pages/PreviewSelect';
import PreviewPage from '@/pages/PreviewPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mainBg">
      <Sidebar />
      <main className="ml-0 md:ml-[240px] min-h-screen p-4 md:p-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/preview/:id" element={<PreviewPage />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<ProgramBoard />} />
                <Route path="/program/:id" element={<ProgramDetail />} />
                <Route path="/guests" element={<GuestManager />} />
                <Route path="/guest/:id" element={<GuestDetail />} />
                <Route path="/preview-select" element={<PreviewSelect />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
