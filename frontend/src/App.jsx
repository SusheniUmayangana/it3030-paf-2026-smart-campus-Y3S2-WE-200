import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { API_BASE } from './config';
import AppRoutes from './routes/AppRoutes';
import Facilities from './pages/Facilities';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

    <BrowserRouter>
      <AppRoutes user={user} onSetUser={setUser} onLogout={handleLogout} />

      <div className="App">
        <Facilities />
      </div>

    </BrowserRouter>


  );
}

export default App;