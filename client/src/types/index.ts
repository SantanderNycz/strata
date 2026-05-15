export interface DrillHole {
  id: string;
  patternId: string;
  x: number;
  z: number;
  depth: number;
  sequence: number;
}

export interface Pattern {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  drillHoles: DrillHole[];
}

/** Temporary state for a hole being configured before mutation fires */
export interface PendingHole {
  x: number;
  z: number;
}
