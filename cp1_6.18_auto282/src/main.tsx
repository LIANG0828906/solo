import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ReportMap from './components/ReportMap'
import ReportForm from './components/ReportForm'
import ReportDetail from './components/ReportDetail'
import AdminPanel from './components/AdminPanel'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ReportMap />} />
          <Route path="submit" element={<ReportForm />} />
          <Route path="report/:id" element={<ReportDetail />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
