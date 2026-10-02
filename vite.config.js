import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        mail: fileURLToPath(new URL('./index.html', import.meta.url)),
        support: fileURLToPath(new URL('./support.html', import.meta.url)),
        components: fileURLToPath(new URL('./components.html', import.meta.url)),
      },
    },
  },
});
