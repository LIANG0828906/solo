import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useStore } from '@/store';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Home from '@/pages/Home';
import Portfolio from '@/pages/Portfolio';
import BlogList from '@/pages/BlogList';
import BlogDetail from '@/pages/BlogDetail';
import BlogNew from '@/pages/BlogNew';
import Messages from '@/pages/Messages';
import Admin from '@/pages/Admin';

export default function App() {
  const { theme, init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/new" element={<BlogNew />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
