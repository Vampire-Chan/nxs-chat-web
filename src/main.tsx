import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'
import process from 'process'
import util from './util-polyfill'

// NODE POLYFILLS
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = process;
(window as any).util = util;

if (!process.nextTick) {
  process.nextTick = (callback: Function, ...args: any[]) => setTimeout(() => callback(...args), 0);
}

import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { BrowserRouter } from 'react-router-dom'

console.log('🚀 Yantravani CLIENT BOOTSTRAPPING...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
