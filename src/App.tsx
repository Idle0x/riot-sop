import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Triage } from './pages/Triage';
import { Roadmap } from './pages/Roadmap'; // <--- IMPORT THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/roadmap" element={<Roadmap />} /> {/* <--- ADD THIS */}
          
          <Route path="/signals" element={<div>Signals</div>} />
          <Route path="/journal" element={<div>Journal</div>} />
          <Route path="/settings" element={<div>Settings</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
