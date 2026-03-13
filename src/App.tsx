import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthScreen } from './components/auth/AuthScreen';
import { supabase } from './lib/supabase'; 

// Pages
import { Dashboard } from './pages/Dashboard';
import { Triage } from './pages/Triage';
import { Roadmap } from './pages/Roadmap';
import { Signals } from './pages/Signals';
import { Constitution } from './pages/Constitution';
import { Budget } from './pages/Budget';
import { Settings } from './pages/Settings';
import { Ledger } from './pages/Ledger';
import { Analytics } from './pages/Analytics';
import { Generosity } from './pages/Generosity';
import { Journal } from './pages/Journal';
import { Ingestion } from './pages/Ingestion'; // NEW IMPORT

function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Initializing Uplink...</div>;

  if (!session) {
    return <AuthScreen onAuthenticated={() => {}} />; 
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onLogout={() => supabase.auth.signOut()} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/ingestion" element={<Ingestion />} /> {/* NEW ROUTE */}
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/generosity" element={<Generosity />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/constitution" element={<Constitution />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
