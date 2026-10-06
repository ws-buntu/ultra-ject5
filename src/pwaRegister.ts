export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Only register service worker in standalone production builds outside preview iframes
  const isPreview = window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost');
  const isProd = Boolean((import.meta as any).env?.PROD) && !isPreview;

  if (isProd) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[PWA] ServiceWorker registration failed:', error);
        });
    });
  } else {
    // In dev / preview iframe environments, unregister service workers to avoid stale cache or display issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }
}

