import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Redeem from "./pages/Redeem";
import Admin from "./pages/Admin"; // ⬅️ penting

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/redeem" element={<Redeem />} />
        <Route path="/admin" element={<Admin />} /> {/* ⬅️ WAJIB */}
      </Routes>
    </Router>
  );
}

export default App;
