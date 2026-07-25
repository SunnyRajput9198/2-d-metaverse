import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SpacePage from './Space/[spaceid]/page';
import HomePage from './pages/Homepage';
import FeaturesPage from './pages/featurepage';
import AvatarScene from './components/AvatarScene';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-xl">
        Loading authentication...
      </div>
    );
  }

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
        <Route path="/avatar-demo" element={<AvatarScene />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;
