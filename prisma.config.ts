import "dotenv/config";

const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!url) {
  throw new Error(
    "Missing database connection string. Set DATABASE_URL (preferred) or DIRECT_URL.",
  );
}

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
};
