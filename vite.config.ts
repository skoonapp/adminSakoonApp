
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Using injectManifest strategy to have full control over the service worker,
      // including custom push notification logic, while still getting precaching.
      injectManifest: {
        swSrc: 'sw.js', // Using the new service worker at the project root
        swDest: 'sw.js', // The output file will be dist/sw.js
      },
      manifest: {
        "name": "SakoonApp Admin",
        "short_name": "Sakoon Admin",
        "description": "The admin and management app for Sakoon Listeners.",
        "theme_color": "#4338ca", // Darker color for a more integrated splash screen
        "background_color": "#1e1b4b", // Dark background for splash screen to match app theme
        "display": "standalone",
        "scope": "/",
        "start_url": "/",
        "orientation": "portrait-primary",
        "icons": [
          {
            "src": "icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icon-maskable-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ]
      },
    })
  ],
});
