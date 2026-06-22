import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import CardView from '@/components/CardView';
import CardEditor from '@/components/CardEditor';
import CardDetail from '@/components/CardDetail';
import ReviewView from '@/components/ReviewView';
import GraphView from '@/components/GraphView';
import '@/App.css';

export default function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<CardView />} />
            <Route path="/card/new" element={<CardEditor />} />
            <Route path="/card/edit/:id" element={<CardEditor />} />
            <Route path="/card/:id" element={<CardDetail />} />
            <Route path="/review" element={<ReviewView />} />
            <Route path="/graph" element={<GraphView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
