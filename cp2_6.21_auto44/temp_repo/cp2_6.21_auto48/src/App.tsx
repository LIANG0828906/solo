import { Routes, Route } from 'react-router-dom';
import BoardList from './pages/BoardList';
import BoardRoom from './pages/BoardRoom';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<BoardList />} />
      <Route path="/board/:id" element={<BoardRoom />} />
    </Routes>
  );
};

export default App;
