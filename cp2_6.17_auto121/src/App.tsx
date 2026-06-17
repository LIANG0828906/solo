import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RecipeDetail from './pages/RecipeDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/recipe/:id" element={<RecipeDetail />} />
    </Routes>
  )
}

export default App
