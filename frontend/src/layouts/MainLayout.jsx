import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function MainLayout({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Shared Navbar */}
      <Navbar user={user} onLogout={onLogout} />

      {/* Sidebar + Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden pointer-events-auto min-h-[calc(100vh-72px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
