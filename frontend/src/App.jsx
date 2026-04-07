import { useState, useEffect } from 'react';
import { API_BASE } from './config';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [loginMsg, setLoginMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/status`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  // ========== Loading State ==========
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-3xl" />

      {/* Navbar */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 72px)' }}>
        {user ? (
          <Landing user={user} />
        ) : mode === 'login' ? (
          <Login 
            onLoginSuccess={setUser}
            onSwitchToSignup={() => { setMode('signup'); setLoginMsg(''); }}
            initialMessage={loginMsg}
          />
        ) : (
          <Signup 
            onSignupSuccess={(msg) => { setMode('login'); setLoginMsg(msg); }}
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
