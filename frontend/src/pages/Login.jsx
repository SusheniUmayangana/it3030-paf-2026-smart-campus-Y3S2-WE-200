import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMessage = location.state?.message || '';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(initialMessage);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Something went wrong.');
        setSubmitting(false);
        return;
      }

      onLoginSuccess({
        authenticated: true,
        name: data.name,
        email: data.email,
        role: data.role,
        picture: data.profilePicture,
      });
      // The router's AuthRoute will automatically redirect to '/' since user is now set
    } catch {
      setError('Cannot connect to server. Make sure the backend is running.');
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  return (
    <div className="animate-fade-in w-full max-w-md">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="mb-6 inline-flex">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-2xl shadow-primary-500/20 animate-float">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="gradient-text">Smart Campus</span>
        </h1>
        <p className="text-surface-500 text-sm">
          Sign in to your account
        </p>
      </div>

      {/* Form Card */}
      <div className="glass rounded-2xl p-6 md:p-8">
        {/* Error / Success Messages */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 placeholder-surface-600 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 placeholder-surface-600 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
            />
          </div>

          <button
            id="submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-800/50" />
          <span className="text-xs text-surface-600">or</span>
          <div className="flex-1 h-px bg-surface-800/50" />
        </div>

        <button
          id="google-login-btn"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-surface-500 mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
            Sign Up
          </Link>
        </p>
      </div>

      <p className="text-surface-600 text-xs mt-4 text-center">
        Smart Campus Operations Hub • SLIIT © 2026
      </p>
    </div>
  );
}
