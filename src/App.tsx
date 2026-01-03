import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Triage } from './pages/Triage';
import { Roadmap } from './pages/Roadmap';
import { Signals } from './pages/Signals';
import { Constitution } from './pages/Constitution';
import { Budget } from './pages/Budget';
import { Settings } from './pages/Settings';
import { Ledger } from './pages/Ledger';
import { Journal } from './pages/Journal'; // NEW IMPORT

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Financial Engine */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/ledger" element={<Ledger />} />
          
          {/* Research Engine */}
          <Route path="/signals" element={<Signals />} />
          
          {/* Principles */}
          <Route path="/constitution" element={<Constitution />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Operational */}
          <Route path="/journal" element={<Journal />} /> {/* UPDATED ROUTE */}
          
          {/* Redirect unknown routes to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
