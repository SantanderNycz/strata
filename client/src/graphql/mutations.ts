import { gql } from '@apollo/client';

export const CREATE_PATTERN = gql`
  mutation CreatePattern($name: String!, $description: String) {
    createPattern(name: $name, description: $description) {
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
    }
  }
`;

export const ADD_DRILL_HOLE = gql`
  mutation AddDrillHole(
    $patternId: ID!
    $x: Float!
    $z: Float!
    $depth: Float!
    $sequence: Int!
  ) {
    addDrillHole(
      patternId: $patternId
      x: $x
      z: $z
      depth: $depth
      sequence: $sequence
    ) {
      id
      patternId
      x
      z
      depth
      sequence
    }
  }
`;

export const DELETE_DRILL_HOLE = gql`
  mutation DeleteDrillHole($id: ID!) {
    deleteDrillHole(id: $id)
  }
`;

export const DELETE_PATTERN = gql`
  mutation DeletePattern($id: ID!) {
    deletePattern(id: $id)
  }
`;

export const CLEAR_PATTERN_HOLES = gql`
  mutation ClearPatternHoles($patternId: ID!) {
    clearPatternHoles(patternId: $patternId)
  }
`;
