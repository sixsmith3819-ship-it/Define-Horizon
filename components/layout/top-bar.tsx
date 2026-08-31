// components/layout/top-bar.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import Link from 'next/link';
import { LogOut, User, Bell, Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function TopBar() {
  const router = useRouter();
  const { session, user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
      {/* Left Section - Logo/Title */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">DH-BMS</h1>
        </div>
      </div>

      {/* Right Section - User Menu */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            title="User menu"
          >
            <span className="text-sm font-medium">User Menu</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 animate-fadeIn">
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {user?.role?.replace('_', ' ') || 'Employee'}
                </p>
              </div>

              <div className="p-2 space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                  onClick={() => setShowMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </Link>

                <button
                  onClick={() => {
                    handleSignOut();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
