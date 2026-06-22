import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import BookList from './components/BookList'
import BookDetail from './components/BookDetail'
import ReservationPanel from './components/ReservationPanel'
import Statistics from './components/Statistics'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-50">
        <Header />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<BookList />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/reservations" element={<ReservationPanel />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </main>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#343A40',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: '14px',
              padding: '12px 20px',
            },
            success: {
              iconTheme: {
                primary: '#34D399',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#F87171',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
