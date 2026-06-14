import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import CustomerProfile from "@/modules/customers/CustomerProfile";
import Dashboard from "@/modules/dashboard/Dashboard";
import { CRMProvider } from "@/context/CRMContext";

export default function App() {
  return (
    <CRMProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer/:id?" element={<CustomerProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </CRMProvider>
  );
}
