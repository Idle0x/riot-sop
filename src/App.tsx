import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Placeholder Pages (We will build these one by one)
const Dashboard = () => <div className="text-2xl font-bold">Dashboard Coming Soon</div>;
const Triage = () => <div className="text-2xl font-bold">Triage Wizard Coming Soon</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/roadmap" element={<div>Roadmap</div>} />
          <Route path="/signals" element={<div>Signals</div>} />
          <Route path="/journal" element={<div>Journal</div>} />
          <Route path="/settings" element={<div>Settings</div>} />
          
          {/* Catch all - Redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
