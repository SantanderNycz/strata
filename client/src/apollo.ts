import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Sempre usa /graphql — o destino muda dependendo do ambiente:
//   Local:      Vite proxy → localhost:4000/graphql  (vite.config.ts)
//   Produção:   Vercel rewrite → /api/graphql        (vercel.json)
export const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache(),
});
