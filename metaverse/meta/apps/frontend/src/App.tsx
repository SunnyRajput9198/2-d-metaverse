
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // Make sure path is correct
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SpacePage from './Space/[spaceid]/page';
import HomePage from './pages/Homepage'; // ✅ New homepage
import FeaturesPage from './pages/featurepage';

interface PrivateRouteProps {
  children: React.ReactNode;
}

// A private route component to protect authenticated routescdconst PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // --- THIS IS THE KEY PART ---
  const { isAuthenticated, isLoadingAuth } = useAuth();

  // 1. If authentication status is still loading, render a loading indicator.
  //    This prevents premature redirects while localStorage is being checked.
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-xl">
        Loading authentication...
      </div>
    );
  }

  // 2. Once loading is complete, then check isAuthenticated.
  //    If authenticated, render the children (the protected page).
  //    If not authenticated, redirect to the login page.
  if (!isAuthenticated) {
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    return <Navigate to="/login" />;
  }
  return <>{children}</>;

};

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>

        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />
        <Route path="/space/:spaceId" element={
          <PrivateRoute>
            <SpacePage />
          </PrivateRoute>
        } />
        <Route path="/features" element={
          <PrivateRoute>
            <FeaturesPage />
          </PrivateRoute>
        } />
      
<Route path="*" element={<Navigate to="/" />} /> {/* Optional catch-all */}

      </Routes>
    </div>
  );
};

export default App;
