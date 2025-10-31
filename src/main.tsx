import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { NotificationProvider } from './components/NotificationContext';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element with id "root" not found');
}

createRoot(container).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>
);

