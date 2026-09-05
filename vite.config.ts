import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const squareToken = env.SQUARE_ACCESS_TOKEN || env.VITE_SQUARE_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN || process.env.VITE_SQUARE_ACCESS_TOKEN || '';
  const squareEnv = env.SQUARE_ENVIRONMENT || env.VITE_SQUARE_ENVIRONMENT || process.env.SQUARE_ENVIRONMENT || process.env.VITE_SQUARE_ENVIRONMENT || 'production';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_SQUARE_ACCESS_TOKEN': JSON.stringify(squareToken),
      'import.meta.env.VITE_SQUARE_ENVIRONMENT': JSON.stringify(squareEnv),
      'process.env.SQUARE_ACCESS_TOKEN': JSON.stringify(squareToken),
      'process.env.SQUARE_ENVIRONMENT': JSON.stringify(squareEnv),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
