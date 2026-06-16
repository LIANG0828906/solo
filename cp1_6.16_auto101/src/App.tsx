import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import BookList from './books/BookList'
import BookDetail from './books/BookDetail'
import DoodleCanvas from './doodle/DoodleCanvas'
import Navbar from './components/Navbar'
import './App.css'

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<BookList />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/book/:id/doodle" element={<DoodleCanvas />} />
        </Routes>
      </div>
    </Router>
  )
}
