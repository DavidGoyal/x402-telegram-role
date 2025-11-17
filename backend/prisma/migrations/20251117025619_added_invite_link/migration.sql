/*
  Warnings:

  - A unique constraint covering the columns `[inviteLink]` on the table `RoleAssigned` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteLink` to the `RoleAssigned` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoleAssigned" ADD COLUMN     "inviteLink" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssigned_inviteLink_key" ON "RoleAssigned"("inviteLink");
