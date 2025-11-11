-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Network" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usdcAddress" TEXT NOT NULL,
    "usdcDecimals" INTEGER NOT NULL,
    "rpcUrl" TEXT NOT NULL,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkUser" (
    "id" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "receiverSolanaAddress" TEXT NOT NULL,
    "receiverEthereumAddress" TEXT NOT NULL,
    "costInUsdc" BIGINT NOT NULL,
    "maxRoleApplicableTime" INTEGER[],

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssigned" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "expiryTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssigned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "roleApplicableTime" INTEGER NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkUser_publicKey_key" ON "NetworkUser"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkUser_privateKey_key" ON "NetworkUser"("privateKey");

-- CreateIndex
CREATE INDEX "NetworkUser_networkId_userId_idx" ON "NetworkUser"("networkId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkUser_networkId_userId_key" ON "NetworkUser"("networkId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_serverId_key" ON "Server"("serverId");

-- CreateIndex
CREATE INDEX "Server_serverId_idx" ON "Server"("serverId");

-- CreateIndex
CREATE INDEX "RoleAssigned_expiryTime_idx" ON "RoleAssigned"("expiryTime");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_token_key" ON "Invoice"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_userId_serverId_key" ON "Invoice"("userId", "serverId");

-- AddForeignKey
ALTER TABLE "NetworkUser" ADD CONSTRAINT "NetworkUser_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkUser" ADD CONSTRAINT "NetworkUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
