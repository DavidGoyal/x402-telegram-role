/*
  Warnings:

  - A unique constraint covering the columns `[inviteLink,serverId]` on the table `RoleAssigned` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RoleAssigned_inviteLink_key";

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssigned_inviteLink_serverId_key" ON "RoleAssigned"("inviteLink", "serverId");
