import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
