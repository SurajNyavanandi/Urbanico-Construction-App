if (typeof window !== 'undefined') {
  if (!(window as any).global) {
    (window as any).global = window;
  }
  if (typeof (window as any).__DEV__ === 'undefined') {
    (window as any).__DEV__ = process.env.NODE_ENV !== 'production';
  }
  const win = window as any;
  win.expo = win.expo || {};
  if (!win.expo.EventEmitter) {
    class MockEventEmitter {
      private listeners = new Map<string, Set<Function>>();
      addListener(event: string, fn: Function) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(fn);
        return { remove: () => this.removeListener(event, fn) };
      }
      removeListener(event: string, fn: Function) {
        if (this.listeners.has(event)) this.listeners.get(event)!.delete(fn);
      }
      emit(event: string, ...args: any[]) {
        if (this.listeners.has(event)) {
          this.listeners.get(event)!.forEach((fn) => fn(...args));
        }
      }
      removeAllListeners() {
        this.listeners.clear();
      }
    }
    win.expo.EventEmitter = MockEventEmitter;
  }
  win.expo.modules = win.expo.modules || {};
}

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
