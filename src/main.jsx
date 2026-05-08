import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(
  document.getElementById('root'),
).render(
  <App />,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration =
        await navigator.serviceWorker.register(
          '/sw.js',
        );

      console.log(
        'Service Worker registered:',
        registration,
      );

      if (registration.waiting) {
        registration.waiting.postMessage({
          type: 'SKIP_WAITING',
        });
      }

      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          window.location.reload();
        },
      );
    } catch (error) {
      console.error(
        'Service Worker registration failed:',
        error,
      );
    }
  });
}
