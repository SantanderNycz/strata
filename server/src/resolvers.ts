import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const include = { drillHoles: true, terrainNodes: true } as const;

export const resolvers = {
  Query: {
    patterns: () => prisma.pattern.findMany({ include }),
    pattern: (_: unknown, { id }: { id: string }) =>
      prisma.pattern.findUnique({ where: { id }, include }),
  },

  Mutation: {
    createPattern: (
      _: unknown,
      { name, description }: { name: string; description?: string },
    ) => prisma.pattern.create({ data: { name, description }, include }),

    addDrillHole: (
      _: unknown,
      args: { patternId: string; x: number; z: number; depth: number; sequence: number },
    ) => prisma.drillHole.create({ data: args }),

    deleteDrillHole: async (_: unknown, { id }: { id: string }) => {
      await prisma.drillHole.delete({ where: { id } });
      return true;
    },

    deletePattern: async (_: unknown, { id }: { id: string }) => {
      await prisma.pattern.delete({ where: { id } });
      return true;
    },

    clearPatternHoles: async (_: unknown, { patternId }: { patternId: string }) => {
      await prisma.drillHole.deleteMany({ where: { patternId } });
      return true;
    },

    // Upsert: cria ou atualiza a cota de um nó pelo índice único (patternId, gridX, gridZ).
    setTerrainNode: (
      _: unknown,
      args: { patternId: string; gridX: number; gridZ: number; elevation: number },
    ) =>
      prisma.terrainNode.upsert({
        where: {
          patternId_gridX_gridZ: {
            patternId: args.patternId,
            gridX: args.gridX,
            gridZ: args.gridZ,
          },
        },
        update: { elevation: args.elevation },
        create: args,
      }),

    clearTerrainNodes: async (_: unknown, { patternId }: { patternId: string }) => {
      await prisma.terrainNode.deleteMany({ where: { patternId } });
      return true;
    },
  },
};
