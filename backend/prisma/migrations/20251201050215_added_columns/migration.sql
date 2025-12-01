/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `expiryTime` on the `RoleAssigned` table. All the data in the column will be lost.
  - Added the required column `expiresOn` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresOn` to the `RoleAssigned` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "RoleAssigned_expiryTime_idx";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "expiresAt",
ADD COLUMN     "expiresOn" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RoleAssigned" DROP COLUMN "expiryTime",
ADD COLUMN     "expiresOn" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "RoleAssigned_expiresOn_idx" ON "RoleAssigned"("expiresOn");
