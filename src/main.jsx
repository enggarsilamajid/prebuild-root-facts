import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '/sw.js',
      );

      console.log(
        'Service Worker berhasil diregistrasi:',
        registration.scope,
      );
    } catch (error) {
      console.error(
        'Service Worker gagal diregistrasi:',
        error,
      );
    }
  });
}