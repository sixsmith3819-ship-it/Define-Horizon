'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { usePathname } from 'next/navigation';
import { ROLES } from '@/lib/constants/roles';
import {
  Home,
  Users,
  CreditCard,
  Package,
  Bell,
  FileText,
  LogOut,
  BarChart3,
  Shield,
  Building2,
  UserCircle,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useUserRole } from '@/lib/hooks/useUserRole';

export function Sidebar() {
  const { session, user, signOut } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!session) return null;

  const userRole =
    (user?.role as 'super_admin' | 'branch_manager' | 'employee' | 'auditor') || 'employee';

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, roles: Object.values(ROLES) },
    {
      href: '/customers',
      label: 'Customers',
      icon: Users,
      roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_MANAGER, ROLES.EMPLOYEE],
    },
    {
      href: '/transactions',
      label: 'Transactions',
      icon: CreditCard,
      roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_MANAGER, ROLES.EMPLOYEE],
    },
    {
      href: '/inventory',
      label: 'Inventory',
      icon: Package,
      roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_MANAGER, ROLES.EMPLOYEE],
    },
    { href: '/announcements', label: 'Announcements', icon: Bell, roles: Object.values(ROLES) },
    {
      href: '/reports',
      label: 'Reports',
      icon: BarChart3,
      roles: [ROLES.SUPER_ADMIN, ROLES.BRANCH_MANAGER, ROLES.AUDITOR],
    },
    {
      href: '/audit-logs',
      label: 'Audit Logs',
      icon: Shield,
      roles: [ROLES.SUPER_ADMIN, ROLES.AUDITOR],
    },
    { href: '/users', label: 'Users', icon: UserCircle, roles: [ROLES.SUPER_ADMIN] },
    { href: '/branches', label: 'Branches', icon: Building2, roles: [ROLES.SUPER_ADMIN] },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole));

  async function handleLogout() {
    await signOut();
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white border border-gray-200 p-2 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X size={20} className="text-gray-700" />
        ) : (
          <MenuIcon size={20} className="text-gray-700" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative w-64 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Navigation Menu</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">DH</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">DH-BMS</h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {user && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize mt-1">{userRole.replace('_', ' ')}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
