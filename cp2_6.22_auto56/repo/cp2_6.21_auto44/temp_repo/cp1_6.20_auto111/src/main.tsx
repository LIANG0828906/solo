import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { store } from './store/poemStore'
import PoemEditorPage from './pages/PoemEditorPage'
import PoemReaderPage from './pages/PoemReaderPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PoemReaderPage />} />
          <Route path="/editor" element={<PoemEditorPage />} />
          <Route path="/poem/:id" element={<PoemReaderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
