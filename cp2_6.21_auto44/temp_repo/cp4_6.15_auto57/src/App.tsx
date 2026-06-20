import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StoryboardList from '@/modules/storyboard/StoryboardList';
import StoryboardDetail from '@/modules/storyboard/StoryboardDetail';
import ShareView from '@/modules/share/ShareView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StoryboardList />} />
        <Route path="/storyboard/:id" element={<StoryboardDetail />} />
        <Route path="/share/:code" element={<ShareView />} />
      </Routes>
    </Router>
  );
}
