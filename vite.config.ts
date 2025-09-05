
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use injectManifest to combine our custom SW logic with precaching
      injectManifest: {
        swSrc: 'public/sw.js',
      },
      manifest: {
        "name": "SakoonApp Admin",
        "short_name": "Admin",
        "description": "The admin and management app for Sakoon Listeners.",
        "theme_color": "#4f46e5",
        "background_color": "#F1F5F9",
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