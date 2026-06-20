import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookShelf } from './components/BookShelf';
import { BookDetail } from './components/BookDetail';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<BookShelf />} />
          <Route path="/book/:id" element={<BookDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
