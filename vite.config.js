import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        mail: fileURLToPath(new URL('./index.html', import.meta.url)),
        support: fileURLToPath(new URL('./support.html', import.meta.url)),
        chat: fileURLToPath(new URL('./chat.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
        settings: fileURLToPath(new URL('./settings.html', import.meta.url)),
        widget: fileURLToPath(new URL('./widget.html', import.meta.url)),
        'widget-site': fileURLToPath(new URL('./examples/widget/site.html', import.meta.url)),
        'widget-chat': fileURLToPath(new URL('./widget/chat.html', import.meta.url)),
        components: fileURLToPath(new URL('./components.html', import.meta.url)),
      },
    },
  },
});
