export const typeDefs = `#graphql
  type Pattern {
    id: ID!
    name: String!
    description: String
    createdAt: String!
    drillHoles: [DrillHole!]!
    terrainNodes: [TerrainNode!]!
  }

  type DrillHole {
    id: ID!
    patternId: ID!
    x: Float!
    z: Float!
    depth: Float!
    sequence: Int!
  }

  # Nó da malha de terreno.
  # gridX / gridZ: 0–10 (11 × 11 vértices cobrindo o grid 20 × 20).
  type TerrainNode {
    id: ID!
    patternId: ID!
    gridX: Int!
    gridZ: Int!
    elevation: Float!
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

    # Cria ou atualiza a cota de um nó do terreno (upsert).
    setTerrainNode(patternId: ID!, gridX: Int!, gridZ: Int!, elevation: Float!): TerrainNode!
    # Remove todos os nós de terreno de um padrão (planificar).
    clearTerrainNodes(patternId: ID!): Boolean!
  }
`;
