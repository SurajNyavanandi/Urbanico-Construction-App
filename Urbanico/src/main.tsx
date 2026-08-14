if (typeof window !== 'undefined') {
  if (!(window as any).global) {
    (window as any).global = window;
  }
  if (typeof (window as any).__DEV__ === 'undefined') {
    (window as any).__DEV__ = process.env.NODE_ENV !== 'production';
  }
}

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
