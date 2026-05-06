import { execSync } from "node:child_process";

const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.DIRECT_URL);

if (!hasDbUrl) {
  console.log(
    "[postinstall] Skipping `prisma generate` (DATABASE_URL/DIRECT_URL not set).",
  );
  process.exit(0);
}

try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch {
  // Keep installs usable; builds should still run `prisma generate` explicitly.
  console.warn("[postinstall] `prisma generate` failed; continuing install.");
  process.exit(0);
}

