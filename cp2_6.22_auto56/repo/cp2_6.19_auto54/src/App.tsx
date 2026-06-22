import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BookList } from './modules/book/BookList';
import { AdminBookManager } from './modules/book/AdminBookManager';
import { ExchangeHistory } from './modules/exchange/ExchangeHistory';
import { UserProfile } from './modules/user/UserProfile';
import './styles/index.css';

function App() {
  const location = useLocation();

  return (
    <div>
      <Navbar />
      <main className="main-content" key={location.pathname}>
        <Routes>
          <Route path="/" element={<BookList />} />
          <Route path="/books" element={<BookList />} />
          <Route path="/admin/books" element={<AdminBookManager />} />
          <Route path="/exchange/history" element={<ExchangeHistory />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
