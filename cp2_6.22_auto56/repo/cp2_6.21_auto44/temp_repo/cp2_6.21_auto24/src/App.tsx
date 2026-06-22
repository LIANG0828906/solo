import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import CreateRecipePage from './pages/CreateRecipePage'
import RecipeDetailPage from './pages/RecipeDetailPage'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main style={{ paddingTop: '70px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateRecipePage />} />
          <Route path="/edit/:id" element={<CreateRecipePage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
