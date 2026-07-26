import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Spinner from "./components/Spinner";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetsGoalsPage from "./pages/BudgetsGoalsPage";
import CategoriesPage from "./pages/CategoriesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import AIAdvisorPage from "./pages/AIAdvisorPage";
import ReceiptScannerPage from "./pages/ReceiptScannerPage";

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * Shows a loading spinner while auth state is being hydrated from localStorage.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
        <Route path="/budgets-goals" element={<ProtectedRoute><BudgetsGoalsPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/ai-advisor" element={<ProtectedRoute><AIAdvisorPage /></ProtectedRoute>} />
        <Route path="/scan-receipt" element={<ProtectedRoute><ReceiptScannerPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
