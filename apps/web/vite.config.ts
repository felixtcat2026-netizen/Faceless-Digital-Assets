import { defineConfig } from 'vite';
import { createApiMiddleware } from './src/server/viteApiPlugin';

export default defineConfig({
  plugins: [
    {
      name: 'faceless-api-middleware',
      configureServer(server) {
        server.middlewares.use(createApiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createApiMiddleware());
      }
    }
  ]
});
