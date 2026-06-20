import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import App from './App'
import CreateEvent from './pages/CreateEvent'
import VotePage from './pages/VotePage'
import ResultsPage from './pages/ResultsPage'
import HomePage from './pages/HomePage'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'create', element: <CreateEvent /> },
      { path: 'vote/:eventId', element: <VotePage /> },
      { path: 'results/:eventId', element: <ResultsPage /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
