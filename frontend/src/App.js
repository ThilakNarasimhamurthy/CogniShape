import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GameSession from './pages/GameSession';
import CaretakerPanel from './pages/CaretakerPanel';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Payment from './pages/Payment';
import PaymentTest from './pages/PaymentTest';
import Landing from './pages/Landing';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {user && <Navbar />}
      
      <main className={user ? 'pt-16' : ''}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/game/:childId" element={
            <ProtectedRoute>
              <GameSession />
            </ProtectedRoute>
          } />
          <Route path="/caretaker/:childId" element={
            <ProtectedRoute>
              <CaretakerPanel />
            </ProtectedRoute>
          } />
          <Route path="/reports/:childId?" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/payment/:type" element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } />
          <Route path="/payment-test" element={
            <ProtectedRoute>
              <PaymentTest />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;