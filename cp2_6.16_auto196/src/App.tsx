import { Routes, Route, Navigate } from 'react-router-dom'
import TemplateList from './pages/TemplateList'
import ContractEdit from './pages/ContractEdit'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/templates" replace />} />
        <Route path="templates" element={<TemplateList />} />
        <Route path="contract/new" element={<ContractEdit />} />
        <Route path="contract/:id" element={<ContractEdit />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
