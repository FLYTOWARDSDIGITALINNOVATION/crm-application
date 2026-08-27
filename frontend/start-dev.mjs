import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 5173);

const server = await createServer({
  root: process.cwd(),
  configFile: false,
  appType: 'spa',
  plugins: [react(), tailwindcss()],
  server: {
    host,
    port,
    strictPort: false,
  },
});

await server.listen();
server.printUrls();
