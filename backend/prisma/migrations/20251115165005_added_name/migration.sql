-- AlterTable
ALTER TABLE "RoleAssigned" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "RoleAssigned" ADD CONSTRAINT "RoleAssigned_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
