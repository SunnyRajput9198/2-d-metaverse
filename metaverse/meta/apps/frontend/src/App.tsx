import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SpacePage = lazy(() => import('./Space/[spaceid]/page'));
const HomePage = lazy(() => import('./pages/Homepage'));
const FeaturesPage = lazy(() => import('./pages/featurepage'));
const AvatarScene = lazy(() => import('./components/AvatarScene'));

const PageLoader = () => <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading…</div>;

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </div>
  );
};

export default App;
