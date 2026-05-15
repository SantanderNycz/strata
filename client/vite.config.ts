import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento, redireciona /graphql → localhost:4000
    // Em produção o Vercel faz esse roteamento via vercel.json
    proxy: {
      '/graphql': 'http://localhost:4000',
    },
  },
});
