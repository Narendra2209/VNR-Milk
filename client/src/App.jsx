import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import MainLayout from './layouts/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import MorningEntry from './pages/MorningEntry.jsx';
import EveningEntry from './pages/EveningEntry.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Users from './pages/Users.jsx';
import Dairies from './pages/Dairies.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Spinner from './components/Spinner.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/users' : '/dashboard'} replace />;
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <PrivateRoute>
              <MainLayout dark={dark} setDark={setDark} />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<RoleHome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/morning" element={<MorningEntry />} />
          <Route path="/evening" element={<EveningEntry />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/dairies" element={<AdminRoute><Dairies /></AdminRoute>} />
          <Route path="/settings" element={<Settings dark={dark} setDark={setDark} />} />
        </Route>
      </Routes>
    </>
  );
}
