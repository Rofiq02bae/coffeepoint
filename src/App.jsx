import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Redeem from "./pages/Redeem";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/redeem" element={<Redeem />} />
      </Routes>
    </Router>
  );
}

export default App;
