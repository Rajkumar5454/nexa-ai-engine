import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/toaster';
import Home from './pages/Home';
import IDE from './pages/IDE';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import LowCreditsModal from './components/LowCreditsModal';

import { useState, useEffect } from 'react';
import axios from 'axios';

// Set base URL for axios if needed (should already be set in services/api.js, but let's be safe here)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

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
    </Routes>
  );
}

function App() {
  const [googleClientId, setGoogleClientId] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Try to get from env first (local dev)
        if (process.env.REACT_APP_GOOGLE_CLIENT_ID) {
          setGoogleClientId(process.env.REACT_APP_GOOGLE_CLIENT_ID);
          setLoadingConfig(false);
          return;
        }

        // Otherwise fetch from backend (production)
        const response = await axios.get(`${BACKEND_URL}/api/config`);
        if (response.data && response.data.googleClientId) {
          setGoogleClientId(response.data.googleClientId);
        }
      } catch (error) {
        console.error("Error fetching Google Config:", error);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, []);

  if (loadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If we still don't have a client ID, we'll try to render anyway (fallback)
  // but it's better to show an error or use the env var
  const finalClientId = googleClientId || process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <div className="App">
      <GoogleOAuthProvider clientId={finalClientId}>
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
