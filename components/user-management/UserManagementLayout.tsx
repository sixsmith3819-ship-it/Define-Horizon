'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, User, Home } from 'lucide-react';
import clsx from 'clsx';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface UserManagementLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * Responsive User Management Layout
 * Handles desktop (full sidebar), tablet (collapsible), and mobile (hamburger menu)
 */
export function UserManagementLayout({
  children,
  title,
  breadcrumbs,
}: UserManagementLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  const navigationItems = [
    { label: 'Dashboard', href: '/users', icon: '📊' },
    { label: 'Users', href: '/users/list', icon: '👥' },
    { label: 'Roles', href: '/users/roles', icon: '🔐' },
    { label: 'Activity Log', href: '/users/activity', icon: '📋' },
    { label: 'Audit Log', href: '/users/audit', icon: '🔍' },
    { label: 'Branches', href: '/users/branches', icon: '🏢' },
  ];

  const handleLogout = async () => {
    // Call logout API
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed md:static left-0 top-0 h-screen w-64 bg-slate-900 text-white transition-all duration-300 z-40',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 md:hidden hover:bg-slate-800 rounded"
          aria-label="Close sidebar"
        >
          <X size={24} />
        </button>

        {/* Sidebar header */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Home size={24} />
            DH-BMS
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {navigationItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 md:hidden hover:bg-slate-100 rounded"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>

          {/* Title */}
          {title && (
            <h1 className="hidden md:block text-xl font-semibold text-slate-900">
              {title}
            </h1>
          )}

          {/* User menu */}
          <div className="relative ml-auto">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <User size={20} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                Account
              </span>
            </button>

            {/* User menu dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="px-4 md:px-6 py-3 bg-slate-50 border-b border-slate-200">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-slate-600 hover:text-slate-900">
                Home
              </Link>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <span className="text-slate-400">/</span>
                  {item.href ? (
                    <Link href={item.href} className="text-slate-600 hover:text-slate-900">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-medium">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
