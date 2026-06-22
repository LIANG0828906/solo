import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "@/client/shared/components/Navigation";
import Dashboard from "@/client/modules/dashboard/components/Dashboard";
import ClientList from "@/client/modules/clients/components/ClientList";
import ClientDetail from "@/client/modules/clients/components/ClientDetail";
import ExerciseLibrary from "@/client/modules/exercises/components/ExerciseLibrary";
import TrainingPlan from "@/client/modules/planning/components/TrainingPlan";
import TrainingPlanList from "@/client/modules/planning/components/TrainingPlanList";
import DailySession from "@/client/modules/tracking/components/DailySession";
import SelfAssessment from "@/client/modules/tracking/components/SelfAssessment";
import WeeklyReport from "@/client/modules/reporting/components/WeeklyReport";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg-light">
        <Navigation />
        <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen transition-all">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/exercises" element={<ExerciseLibrary />} />
            <Route path="/training-plans" element={<TrainingPlanList />} />
            <Route path="/training-plans/:clientId" element={<TrainingPlan clientId="" />} />
            <Route path="/daily-session" element={<DailySession />} />
            <Route path="/daily-session/:clientId" element={<DailySession />} />
            <Route path="/self-assessment" element={<SelfAssessment />} />
            <Route path="/self-assessment/:clientId" element={<SelfAssessment />} />
            <Route path="/reports/:clientId/:week" element={<WeeklyReport />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
