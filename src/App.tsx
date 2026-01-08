import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginScreen } from './components/auth/LoginScreen';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Triage } from './pages/Triage';
import { Roadmap } from './pages/Roadmap';
import { Signals } from './pages/Signals';
import { Constitution } from './pages/Constitution';
import { Budget } from './pages/Budget';
import { Settings } from './pages/Settings';
import { Ledger } from './pages/Ledger';
import { Journal } from './pages/Journal';
import { Analytics } from './pages/Analytics';
import { Generosity } from './pages/Generosity'; // NEW IMPORT

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session storage (Temporary access for this tab only)
    const sessionAuth = sessionStorage.getItem('riot_auth_session');
    if (sessionAuth === 'active') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('riot_auth_session', 'active');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('riot_auth_session');
    setIsAuthenticated(false);
  };

  if (isLoading) return null; // Or a loading spinner

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onLogout={handleLogout} />}> {/* Pass logout handler */}
          {/* Financial Engine */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/generosity" element={<Generosity />} /> {/* NEW ROUTE */}

          {/* Research Engine */}
          <Route path="/signals" element={<Signals />} />

          {/* Principles */}
          <Route path="/constitution" element={<Constitution />} />
          <Route path="/settings" element={<Settings />} />

          {/* Operational */}
          <Route path="/journal" element={<Journal />} />

          {/* Redirect unknown routes to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
