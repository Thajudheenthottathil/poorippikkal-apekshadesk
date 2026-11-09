import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent third-party browser extensions (e.g. VPN / request interceptors) from crashing
// when attempting to overwrite window.fetch in environments where fetch has only a getter,
// and purge any stale cached Service Worker bundles.
if (typeof window !== 'undefined') {
  try {
    let activeFetch = window.fetch ? window.fetch.bind(window) : undefined;
    if (activeFetch) {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        enumerable: true,
        get() {
          return activeFetch;
        },
        set(fn) {
          if (typeof fn === 'function') {
            activeFetch = fn;
          }
        },
      });
    }
  } catch {
    // Ignore descriptor lock errors
  }

  try {
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).catch(() => {});
        });
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
          reg.unregister().catch(() => {});
        });
      });
    }
  } catch {
    // Ignore cache cleanup errors
  }
}

createRoot(document.getElementById('root')!).render(<App />);
