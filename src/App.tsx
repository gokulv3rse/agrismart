import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import History from "@/pages/History";
import ResultDetail from "@/pages/ResultDetail";
import Settings from "@/pages/Settings";
import Rules from "@/pages/Rules";
import { RequireAuth } from "@/components/RequireAuth";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <History />
            </RequireAuth>
          }
        />
        <Route
          path="/results/:id"
          element={
            <RequireAuth>
              <ResultDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
        <Route
          path="/rules"
          element={
            <RequireAuth>
              <Rules />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}
