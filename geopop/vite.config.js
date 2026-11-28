import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The website lives under /apps/geopop/, next to MathPop.
export default defineConfig({
  base: '/apps/geopop/',
  plugins: [react()],
  optimizeDeps: {
    // Emscripten-based WASM loaders resolve their own asset URLs at load
    // time; Vite's pre-bundling breaks that, so leave them unbundled.
    exclude: ['@mintplex-labs/piper-tts-web', 'onnxruntime-web'],
  },
});
