import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function bootstrap() {
  const app = express();

  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();

  app.use(cors<cors.CorsRequest>({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json());
  app.use('/graphql', expressMiddleware(apollo));

  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => {
    console.log(`\n🪨  Strata server  →  http://localhost:${port}/graphql\n`);
  });
}

bootstrap().catch(console.error);
