import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import History from "@/pages/History";
import ResultDetail from "@/pages/ResultDetail";
import Settings from "@/pages/Settings";
import Rules from "@/pages/Rules";
import Plants from "@/pages/Plants";
import PlantDetail from "@/pages/PlantDetail";
import Analytics from "@/pages/Analytics";
import SpraySchedule from "@/pages/SpraySchedule";
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
        <Route
          path="/plants"
          element={
            <RequireAuth>
              <Plants />
            </RequireAuth>
          }
        />
        <Route
          path="/plants/:id"
          element={
            <RequireAuth>
              <PlantDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <Analytics />
            </RequireAuth>
          }
        />
        <Route
          path="/schedules"
          element={
            <RequireAuth>
              <SpraySchedule />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}
