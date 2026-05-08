// Nexa AI Frontend - SEO and Speed Optimized (Build Refresh: 2026-05-04)
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/toaster';
import Home from './pages/Home';
import IDE from './pages/IDE';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Refund from './pages/Refund';
import Admin from './pages/Admin';
import LowCreditsModal from './components/LowCreditsModal';

// Google Client ID (Public)
const GOOGLE_CLIENT_ID = "422402573935-uf0e7rf9q2qa29elpbc9r8e4f77hbkof.apps.googleusercontent.com".trim();

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    // Manual page view tracking for GA4 in SPA
    const trackPageView = () => {
      if (window.gtag) {
        console.log('[GA] Tracking page view:', location.pathname + location.search);
        // Track both properties
        window.gtag('config', 'G-9EBJPGCGFH', {
          page_path: location.pathname + location.search,
          send_page_view: true
        });
        window.gtag('config', 'G-D8VPRK7MVC', {
          page_path: location.pathname + location.search,
          send_page_view: true
        });
        window.gtag('config', 'AW-18028885320', {
          page_path: location.pathname + location.search,
          send_page_view: true
        });
      } else {
        console.warn('[GA] gtag not found on window');
      }
    };

    // Small delay to ensure gtag is initialized
    const timer = setTimeout(trackPageView, 500);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/ide" element={
        <ProtectedRoute>
          <IDE />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/refund" element={<Refund />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <LowCreditsModal />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
