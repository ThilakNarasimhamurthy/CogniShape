import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  FileText, 
  CreditCard,
  Brain,
  Monitor
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navLinks = [
    {
      to: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      active: isActive('/dashboard')
    },
    {
      to: '/reports',
      icon: FileText,
      label: 'Reports',
      active: isActive('/reports')
    },
    {
      to: '/profile',
      icon: User,
      label: 'Profile',
      active: isActive('/profile')
    }
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">NeuroNest</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      link.active
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* User role indicator */}
            <div className="hidden sm:block">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                user?.role === 'doctor' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {user?.role === 'doctor' ? 'Doctor' : 'Parent'}
              </span>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  
                  <Link
                    to="/payment/license"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Upgrade License</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    link.active
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;