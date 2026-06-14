import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/client/modules/dashboard/components/Dashboard";
import ClientList from "@/client/modules/clients/components/ClientList";
import ClientDetail from "@/client/modules/clients/components/ClientDetail";
import ExerciseLibrary from "@/client/modules/exercises/components/ExerciseLibrary";
import WeeklyReport from "@/client/modules/reporting/components/WeeklyReport";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-6">
          <a href="/" className="text-lg font-bold text-orange-500">FitPulse</a>
          <a href="/" className="text-sm text-gray-600 hover:text-orange-500 transition">仪表盘</a>
          <a href="/clients" className="text-sm text-gray-600 hover:text-orange-500 transition">客户</a>
          <a href="/exercises" className="text-sm text-gray-600 hover:text-orange-500 transition">动作库</a>
        </nav>
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/exercises" element={<ExerciseLibrary />} />
            <Route path="/reports/:clientId/:week" element={<WeeklyReport />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
