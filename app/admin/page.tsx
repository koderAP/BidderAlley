'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === 'admin@igts') {
      localStorage.setItem('admin_authenticated', 'true');
      router.push('/admin/dashboard');
    } else {
      setError('Access denied — invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] shadow-[0_0_40px_rgba(0,255,65,0.08)] p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2 tracking-wide">🔒 COMMAND CENTER</h1>
          <p className="text-gray-500 font-mono text-sm">Enter credentials to access tactical management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2 font-mono">
              ACCESS CODE
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-200 placeholder-gray-600"
              placeholder="Enter access code"
              required
            />
            {error && (
              <p className="mt-2 text-sm text-red-400 font-mono">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-800 text-green-100 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium border border-green-600 font-mono tracking-wider"
          >
            AUTHENTICATE
          </button>

          <div className="text-center">
            <a href="/" className="text-sm text-green-500 hover:text-green-400 font-mono">
              ← Back to Public Dashboard
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
