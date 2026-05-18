/*
  Warnings:

  - You are about to drop the column `order` on the `Link` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Link" ("clicks", "createdAt", "id", "isPublic", "label", "platform", "url", "position", "userId") SELECT "clicks", "createdAt", "id", "isPublic", "label", "platform", "url", "order", "userId" FROM "Link";
DROP TABLE "Link";
ALTER TABLE "new_Link" RENAME TO "Link";
CREATE INDEX "Link_userId_position_idx" ON "Link"("userId", "position");
CREATE INDEX "Link_userId_createdAt_idx" ON "Link"("userId", "createdAt");
CREATE UNIQUE INDEX "Link_userId_platform_key" ON "Link"("userId", "platform");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
