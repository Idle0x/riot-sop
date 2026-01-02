import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FinancialProvider } from './context/FinancialContext'; // Import this

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FinancialProvider> {/* Wrap App */}
      <App />
    </FinancialProvider>
  </React.StrictMode>,
);
