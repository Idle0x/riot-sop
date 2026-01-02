import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Triage } from './pages/Triage';
import { Roadmap } from './pages/Roadmap';
import { Signals } from './pages/Signals';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Financial Engine */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/roadmap" element={<Roadmap />} />
          
          {/* Research Engine (New) */}
          <Route path="/signals" element={<Signals />} />
          
          {/* Placeholders */}
          <Route path="/journal" element={<div className="p-8 text-white">Journal Coming Soon</div>} />
          <Route path="/settings" element={<div className="p-8 text-white">Settings Coming Soon</div>} />
          
          {/* Redirect unknown routes to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
