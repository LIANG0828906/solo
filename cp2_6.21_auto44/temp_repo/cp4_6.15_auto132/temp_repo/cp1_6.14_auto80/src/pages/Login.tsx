import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/useAuthStore';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError('');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-indigo-dark font-rajdhani">
      <div className="cyber-grid-bg absolute inset-0" />
      <div className="scan-line absolute inset-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-panel rounded-2xl p-8">
          <h1 className="neon-glow mb-2 text-center font-orbitron text-4xl font-bold tracking-widest text-cyber-blue">
            BANDFLOW
          </h1>
          <p className="mb-8 text-center text-sm tracking-wider text-gray-400 uppercase">
            Virtual Band Collaboration
          </p>

          <div className="mb-6 flex rounded-lg overflow-hidden neon-border">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-center font-rajdhani text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-cyber-blue/20 text-cyber-blue'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-center font-rajdhani text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                mode === 'register'
                  ? 'bg-cyber-purple/20 text-cyber-purple'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="neon-border w-full rounded-lg bg-indigo-deeper/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none transition-all duration-300 focus:border-cyber-blue/70 focus:shadow-[0_0_15px_rgba(0,210,255,0.3)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="neon-border w-full rounded-lg bg-indigo-deeper/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none transition-all duration-300 focus:border-cyber-blue/70 focus:shadow-[0_0_15px_rgba(0,210,255,0.3)]"
              />
            </div>

            {error && (
              <div
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400"
                style={{ boxShadow: '0 0 15px rgba(239,68,68,0.2), inset 0 0 10px rgba(239,68,68,0.05)' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cyber-btn w-full rounded-lg py-3 font-rajdhani text-sm font-bold uppercase tracking-widest text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? undefined
                  : 'linear-gradient(135deg, rgba(0,210,255,0.25), rgba(139,92,246,0.25))',
              }}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-cyber-blue transition-colors hover:text-cyber-purple hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        .cyber-grid-bg {
          background-image:
            linear-gradient(rgba(0, 210, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 210, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .scan-line {
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0, 210, 255, 0.03) 50%,
            transparent 100%
          );
          background-size: 100% 4px;
          animation: scanMove 8s linear infinite;
        }

        @keyframes scanMove {
          0% { background-position: 0 -100vh; }
          100% { background-position: 0 100vh; }
        }
      `}</style>
    </div>
  );
}
