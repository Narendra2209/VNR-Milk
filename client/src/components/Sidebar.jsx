import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

const allLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['owner'] },
  { to: '/customers', label: 'Customers', icon: '👥', roles: ['owner'] },
  { to: '/morning', label: 'Morning Entry', icon: '🌅', roles: ['owner'] },
  { to: '/evening', label: 'Evening Entry', icon: '🌙', roles: ['owner'] },
  { to: '/reports', label: 'Reports', icon: '📈', roles: ['owner'] },
  { to: '/users', label: 'Users', icon: '🔐', roles: ['admin'] },
  { to: '/dairies', label: 'Dairies', icon: '🏭', roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin', 'owner'] }
];

function SidebarBody({ onClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = allLinks.filter((l) => !user || l.roles.includes(user.role));

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-full p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white grid place-items-center font-bold">VM</div>
        <div>
          <div className="font-bold text-slate-900 dark:text-white">VNR Milk</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Collection System</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`
            }
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-6 space-y-2">
        {user && (
          <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700">
            <div className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.username}</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">
              {user.role === 'admin'
                ? 'Admin'
                : `Owner · ${(user.dairies && user.dairies.length) ? user.dairies.join(', ') : '—'}`}
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <span>🚪</span><span>Sign out</span>
        </button>
        <div className="text-xs text-slate-400">v1.0.0</div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, setOpen }) {
  return (
    <>
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <SidebarBody />
      </aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-800 z-50 md:hidden"
            >
              <SidebarBody onClick={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
