import { Routes, Route } from 'react-router-dom'
import StartPage from './pages/StartPage'
import EditorCanvas from './modules/editor/EditorCanvas'
import StoryEngine from './modules/engine/StoryEngine'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/editor" element={<EditorCanvas />} />
      <Route path="/play/:storyId" element={<StoryEngine />} />
    </Routes>
  )
}
