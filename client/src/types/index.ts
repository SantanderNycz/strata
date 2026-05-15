export interface DrillHole {
  id: string;
  patternId: string;
  x: number;
  z: number;
  depth: number;
  sequence: number;
}

// Nó da malha de terreno — gridX/gridZ 0–10, mapeados para -10..+10 no mundo.
export interface TerrainNode {
  id: string;
  patternId: string;
  gridX: number;
  gridZ: number;
  elevation: number;
}

export interface Pattern {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  drillHoles: DrillHole[];
  terrainNodes: TerrainNode[];
}

/** Estado temporário de um furo sendo configurado antes da mutation */
export interface PendingHole {
  x: number;
  z: number;
}
