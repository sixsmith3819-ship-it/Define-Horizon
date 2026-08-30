'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Validate phone number (Zimbabwe format)
    const phoneRegex = /^\+?263\d{9,10}$/;
    if (!phoneRegex.test(formData.phone_number.replace(/[\s-]/g, ''))) {
      setError('Please enter a valid Zimbabwe phone number (e.g., +263771234567)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Network error - please try again');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className='min-h-screen relative overflow-hidden flex items-center justify-center p-4'>
        {/* Animated gradient background */}
        <div className='fixed inset-0 -z-10'>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'></div>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '1s' }}></div>
        </div>

        <div className='w-full max-w-sm z-10'>
          <div className='glass-lg backdrop-blur-2xl rounded-2xl p-8 shadow-2xl text-center'>
            <div className='w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-white mb-2'>Registration Successful!</h2>
            <p className='text-white/60 text-sm'>
              Your account has been created successfully!
            </p>
            <p className='text-white/60 text-sm mt-4'>
              You can now login with your credentials
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen relative overflow-hidden flex items-center justify-center p-4'>
      {/* Animated gradient background */}
      <div className='fixed inset-0 -z-10'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className='w-full max-w-md z-10'>
        {/* Glass card */}
        <div className='glass-lg backdrop-blur-2xl rounded-2xl p-8 shadow-2xl animate-slideInUp'>
          {/* Logo */}
          <div className='text-center mb-6'>
            <div className='inline-flex items-center justify-center mb-3'>
              <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50'>
                <Sparkles className='w-5 h-5 text-white' />
              </div>
            </div>
            <h1 className='text-2xl font-bold text-white mb-1'>Create Account</h1>
            <p className='text-white/60 text-sm'>Register as a new employee</p>
          </div>

          {/* Error message */}
          {error && (
            <div className='mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm'>
              <p className='text-red-100 text-xs font-medium'>{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className='space-y-4'>
            {/* Full Name */}
            <div>
              <label htmlFor='full_name' className='block text-xs font-semibold text-white/80 mb-1.5'>
                Full Name
              </label>
              <input
                id='full_name'
                type='text'
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className='input input-glass w-full text-sm'
                placeholder='John Doe'
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor='email' className='block text-xs font-semibold text-white/80 mb-1.5'>
                Email Address
              </label>
              <input
                id='email'
                type='email'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className='input input-glass w-full text-sm'
                placeholder='john@example.com'
                required
                disabled={loading}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor='phone_number' className='block text-xs font-semibold text-white/80 mb-1.5'>
                Phone Number
              </label>
              <input
                id='phone_number'
                type='tel'
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className='input input-glass w-full text-sm'
                placeholder='+263771234567'
                required
                disabled={loading}
              />
              <p className='text-white/40 text-xs mt-1'>Zimbabwe format (e.g., +263771234567)</p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor='password' className='block text-xs font-semibold text-white/80 mb-1.5'>
                Password
              </label>
              <div className='relative'>
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className='input input-glass w-full pr-10 text-sm'
                  placeholder='••••••••'
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors'
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
              <p className='text-white/40 text-xs mt-1'>Minimum 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor='confirm_password' className='block text-xs font-semibold text-white/80 mb-1.5'>
                Confirm Password
              </label>
              <div className='relative'>
                <input
                  id='confirm_password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className='input input-glass w-full pr-10 text-sm'
                  placeholder='••••••••'
                  required
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors'
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
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
                  <span>Creating account...</span>
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className='mt-6 pt-4 border-t border-white/10'>
            <Link
              href='/login'
              className='flex items-center justify-center text-white/60 hover:text-white text-sm transition-colors'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}