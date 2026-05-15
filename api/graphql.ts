/**
 * Vercel Serverless Function — expõe o Apollo Server no endpoint /graphql.
 *
 * A instância do Express e do ApolloServer é criada uma vez por container
 * (warm start). Em cold starts uma nova instância é criada automaticamente.
 */
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from '../server/src/schema';
import { resolvers } from '../server/src/resolvers';

const app = express();
const apollo = new ApolloServer({ typeDefs, resolvers });

let started = false;

async function init() {
  if (!started) {
    await apollo.start();
    app.use(cors({ origin: '*' }));
    app.use(express.json());
    app.use(expressMiddleware(apollo));
    started = true;
  }
}

export default async function handler(req: any, res: any) {
  await init();
  return app(req, res);
}
