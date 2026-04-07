import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/register";
import Login from "./components/login";
import Journal from "./components/Journal";
import AddJournalEntry from "./components/AddJournalEntry";
import JournalEntry from "./components/JournalEntry";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/journal"
          element={<ProtectedRoute><Journal /></ProtectedRoute>}
        />
        <Route
          path="/journal/new"
          element={<ProtectedRoute><AddJournalEntry /></ProtectedRoute>}
        />
        <Route
          path="/journal/:id"
          element={<ProtectedRoute><JournalEntry /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/journal" replace />} />
      </Routes>
    </Router>
  );
}

export default App;