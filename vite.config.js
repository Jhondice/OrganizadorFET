import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// `base: './'` => rutas relativas: funciona en https://usuario.github.io/<repo>/
// sin importar cómo se llame el repositorio.
export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 700 },
});
