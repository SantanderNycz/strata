import { gql } from '@apollo/client';

const DRILL_HOLE_FIELDS = gql`
  fragment DrillHoleFields on DrillHole {
    id
    patternId
    x
    z
    depth
    sequence
  }
`;

export const GET_PATTERNS = gql`
  ${DRILL_HOLE_FIELDS}
  query GetPatterns {
    patterns {
      id
      name
      description
      createdAt
      drillHoles {
        ...DrillHoleFields
      }
    }
  }
`;
