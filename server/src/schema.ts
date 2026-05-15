/**
 * GraphQL type definitions.
 * clearPatternHoles is a convenience extension not in the original spec —
 * it lets the frontend clear all holes without N separate deleteDrillHole calls.
 */
export const typeDefs = `#graphql
  type Pattern {
    id: ID!
    name: String!
    description: String
    createdAt: String!
    drillHoles: [DrillHole!]!
  }

  type DrillHole {
    id: ID!
    patternId: ID!
    x: Float!
    z: Float!
    depth: Float!
    sequence: Int!
  }

  type Query {
    patterns: [Pattern!]!
    pattern(id: ID!): Pattern
  }

  type Mutation {
    createPattern(name: String!, description: String): Pattern!
    addDrillHole(patternId: ID!, x: Float!, z: Float!, depth: Float!, sequence: Int!): DrillHole!
    deleteDrillHole(id: ID!): Boolean!
    deletePattern(id: ID!): Boolean!
    clearPatternHoles(patternId: ID!): Boolean!
  }
`;
