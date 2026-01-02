import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard'; // Import the new page

// Keep other placeholders for now
const Triage = () => <div className="text-2xl font-bold p-8">Triage Wizard Coming Soon</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} /> {/* Use the real component */}
          <Route path="/triage" element={<Triage />} />
          {/* ... other routes ... */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
