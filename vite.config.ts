import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    base: '/mandarin-snap-learn/', // GitHub Pages base path
    define: {
      // Injects the API Key from the GitHub Secret into the code during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});