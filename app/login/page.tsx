'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('auth_session', JSON.stringify(data.session));
      router.push('/');
    } catch (err) {
      setError('Network error - please try again');
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen relative overflow-hidden flex items-center justify-center p-4'>
      {/* Animated gradient background */}
      <div className='fixed inset-0 -z-10'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'></div>
        
        {/* Floating orbs */}
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className='w-full max-w-sm z-10'>
        
        {/* Glass card */}
        <div className='glass-lg backdrop-blur-2xl rounded-2xl p-8 shadow-2xl animate-slideInUp'>
          {/* Logo */}
          <div className='text-center mb-6'>
            <div className='inline-flex items-center justify-center mb-3'>
              <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50'>
                <Sparkles className='w-5 h-5 text-white' />
              </div>
            </div>
            <h1 className='text-2xl font-bold text-white mb-1'>Welcome Back</h1>
            <p className='text-white/60 text-sm'>Sign in to your account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className='mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm'>
              <p className='text-red-100 text-xs font-medium'>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className='space-y-4'>
            {/* Email field */}
            <div>
              <label htmlFor='email' className='block text-xs font-semibold text-white/80 mb-1.5'>
                Email Address
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='input input-glass w-full text-sm'
                placeholder='your@email.com'
                required
                disabled={loading}
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor='password' className='block text-xs font-semibold text-white/80 mb-1.5'>
                Password
              </label>
              <div className='relative'>
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='input input-glass w-full pr-10 text-sm'
                  placeholder='••••••••'
                  required
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors'
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type='submit'
              disabled={loading}
              className='btn-primary w-full mt-6 text-sm'
            >
              {loading ? (
                <span className='flex items-center justify-center space-x-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-white/10'></div>
            </div>
            <div className='relative flex justify-center text-xs'>
              <span className='px-2 bg-slate-900/50 text-white/50'>New employee?</span>
            </div>
          </div>

          {/* Register button */}
          <Link
            href='/register'
            className='block w-full text-center px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02]'
          >
            Create Account
          </Link>

          {/* Footer */}
          <div className='mt-6 pt-4 border-t border-white/10 text-center'>
            <p className='text-white/50 text-xs'>
              © 2025 Define Horizon BMS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}