import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { Button } from './Ui';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      show: true
    },
    {
      label: 'Take Assessment',
      path: '/assessment',
      icon: <ClipboardList className="mr-2 h-4 w-4" />,
      show: true
    },
    {
      label: 'History',
      path: '/history',
      icon: <History className="mr-2 h-4 w-4" />,
      show: true
    },
    {
      label: 'Admin Panel',
      path: '/admin',
      icon: <ShieldAlert className="mr-2 h-4 w-4" />,
      show: user?.role === 'admin'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex shrink-0 items-center">
                <Link to="/" className="flex items-center text-xl font-bold">
                  <span className="mr-2 inline-block h-6 w-2.5 rounded-xs bg-indigo-600 dark:bg-indigo-500" />
                  PathFinder
                </Link>
              </div>

              <nav className="hidden items-center space-x-4 md:ml-8 md:flex">
                {navItems
                  .filter((item) => item.show)
                  .map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
              </nav>
            </div>

            <div className="hidden items-center space-x-4 md:flex">
              <ThemeToggle />

              <div className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900/50">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[120px] truncate text-slate-700 dark:text-slate-300">
                  {user?.name}
                </span>
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {user?.role}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="cursor-pointer text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>

            <div className="flex items-center space-x-2 md:hidden">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="space-y-1 border-b border-slate-200 bg-white px-2 pt-2 pb-4 dark:border-slate-800 dark:bg-slate-900 md:hidden">
            {navItems
              .filter((item) => item.show)
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="mr-1 scale-110">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

            <div className="mt-2 flex flex-col space-y-3 border-t border-slate-100 px-3 pt-2 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  {user?.name} ({user?.role})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start px-0 text-left text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} PathFinder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
