import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const include = { drillHoles: true } as const;

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
      args: {
        patternId: string;
        x: number;
        z: number;
        depth: number;
        sequence: number;
      },
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
  },
};
