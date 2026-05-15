import { gql } from '@apollo/client';

export const GET_PATTERNS = gql`
  query GetPatterns {
    patterns {
      id
      name
      description
      createdAt
      drillHoles {
        id
        patternId
        x
        z
        depth
        sequence
      }
      terrainNodes {
        id
        patternId
        gridX
        gridZ
        elevation
      }
    }
  }
`;
