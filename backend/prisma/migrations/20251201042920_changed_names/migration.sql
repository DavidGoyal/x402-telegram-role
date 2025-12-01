/*
  Warnings:

  - You are about to drop the column `serverNormalId` on the `RoleAssigned` table. All the data in the column will be lost.
  - You are about to drop the column `serverId` on the `Server` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serverTelegramId]` on the table `Server` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serverTelegramId` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RoleAssigned" DROP CONSTRAINT "RoleAssigned_serverNormalId_fkey";

-- DropIndex
DROP INDEX "Server_serverId_idx";

-- DropIndex
DROP INDEX "Server_serverId_key";

-- AlterTable
ALTER TABLE "RoleAssigned" DROP COLUMN "serverNormalId";

-- AlterTable
ALTER TABLE "Server" DROP COLUMN "serverId",
ADD COLUMN     "expiresOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "numberOfTxns" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "serverTelegramId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Server_serverTelegramId_key" ON "Server"("serverTelegramId");

-- CreateIndex
CREATE INDEX "Server_serverTelegramId_idx" ON "Server"("serverTelegramId");

-- AddForeignKey
ALTER TABLE "RoleAssigned" ADD CONSTRAINT "RoleAssigned_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
