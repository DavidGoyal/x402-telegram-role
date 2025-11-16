/*
  Warnings:

  - Added the required column `serverNormalId` to the `RoleAssigned` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RoleAssigned" DROP CONSTRAINT "RoleAssigned_serverId_fkey";

-- AlterTable
ALTER TABLE "RoleAssigned" ADD COLUMN     "serverNormalId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "RoleAssigned" ADD CONSTRAINT "RoleAssigned_serverNormalId_fkey" FOREIGN KEY ("serverNormalId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
