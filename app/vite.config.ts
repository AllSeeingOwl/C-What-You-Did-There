import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every link relative, so the built site works from any
// folder, including a GitHub Pages project address.
export default defineConfig({
  base: './',
  plugins: [react()],
});
