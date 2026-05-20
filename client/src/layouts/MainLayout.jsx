import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

export default function MainLayout({ dark, setDark }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="flex-1 flex flex-col md:ml-64">
        <Topbar onMenu={() => setOpen(true)} dark={dark} setDark={setDark} />
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
