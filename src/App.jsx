import { Toaster } from "@/components/ui/toaster";
import { queryClientInstance } from '@/lib/query-client';
import { Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { useAuth } from '@/lib/AuthContext';
import { ThemeProvider, useTheme } from "next-themes";
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';

import { lazy, Suspense, useEffect } from 'react';

// Eagerly loaded — on the critical path for all users
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Lazy-loaded — split into separate chunks
const Projects       = lazy(() => import('@/pages/Projects'));
const ProjectDetail  = lazy(() => import('@/pages/ProjectDetail'));
const Dashboard      = lazy(() => import('@/pages/Dashboard'));
const Profile        = lazy(() => import('@/pages/Profile'));
const CalendarPage   = lazy(() => import('@/pages/CalendarPage'));
const Admin          = lazy(() => import('@/pages/Admin'));
const AdminUsers     = lazy(() => import('@/components/admin/AdminUsers'));
const AdminProjectEdit = lazy(() => import('@/pages/AdminProjectEdit'));
const AdminUserDetail  = lazy(() => import('@/pages/AdminUserDetail'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('@/pages/ResetPassword'));
const Legal          = lazy(() => import('@/pages/Legal'));
const AboutUs        = lazy(() => import('@/pages/AboutUs'));
const Contact        = lazy(() => import('@/components/Contact'));

const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-zinc-950">
    <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Suspense fallback={<PageSpinner />}>
    <Routes>
      {/* Auth pages (no layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* All other pages use Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={user ? <Navigate to="/profile" replace /> : <Home />} />
        <Route path="/home" element={user ? <Navigate to="/profile" replace /> : <Navigate to="/" replace />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal" element={<Legal />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          <Route path="/calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
          <Route path="/admin" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
          <Route path="/admin/users" element={<ErrorBoundary><AdminUsers /></ErrorBoundary>} />
          <Route path="/admin/projects/new" element={<ErrorBoundary><AdminProjectEdit /></ErrorBoundary>} />
          <Route path="/admin/projects/:id/edit" element={<ErrorBoundary><AdminProjectEdit /></ErrorBoundary>} />
          <Route path="/admin/users/:userId" element={<ErrorBoundary><AdminUserDetail /></ErrorBoundary>} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

// Theme preference (light/dark) is a per-user setting that only makes sense once
// someone is logged in. Logged-out visitors (landing page, login, register, etc.)
// always render in the fixed dark brand theme, regardless of what an account
// previously stored in localStorage — otherwise a user who set light mode, then
// logs out, would see the public site break in light mode.
function ThemeEnforcer() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  useEffect(() => {
    if (!user) setTheme("dark");
  }, [user]);
  return null;
}

function ThemeGate({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <ThemeEnforcer />
      {children}
    </ThemeProvider>
  );
}

function App() {
  return (
    <ThemeGate>
      <ScrollToTop />
      <AuthenticatedApp />
      <Toaster />
    </ThemeGate>
  );
}

export default App;