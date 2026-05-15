import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Locally this falls back to localhost.
// In production, set VITE_GRAPHQL_URL in your Vercel project settings
// pointing to your deployed Railway server, e.g.:
// https://strata-server-production.up.railway.app/graphql
const uri =
  import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

export const client = new ApolloClient({
  link: new HttpLink({ uri }),
  cache: new InMemoryCache(),
});
