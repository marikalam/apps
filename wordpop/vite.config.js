import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The website lives under /apps/wordpop/; the iOS app (built with
// `--mode ios`) serves the same files from its own root.
export default defineConfig(({ mode }) => ({
  base: mode === 'ios' ? '/' : '/apps/wordpop/',
  plugins: [react()],
  optimizeDeps: {
    // Emscripten-based WASM loaders resolve their own asset URLs at load
    // time; Vite's pre-bundling breaks that, so leave them unbundled.
    exclude: ['@mintplex-labs/piper-tts-web', 'onnxruntime-web'],
  },
}));
