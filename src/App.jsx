import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Redeem from "./pages/Redeem";
import Admin from "./pages/Admin"; // ⬅️ penting
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/userDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/redeem" element={<Redeem />} />
        <Route path="/admin" element={<Admin />} /> {/* ⬅️ WAJIB */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* ⬅️ penting */}
        <Route path="/me" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
