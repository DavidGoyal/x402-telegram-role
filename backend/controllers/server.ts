import type { Request, Response } from "express";
import { prisma } from "../prisma/prisma.js";

// Get all servers where bot is configured
export const getAllServers = async (req: Request, res: Response) => {
  try {
    const servers = await prisma.server.findMany();

    res.status(200).json({
      success: true,
      servers: servers.map((server) => ({
        id: server.id,
        name: server.name,
        serverId: server.serverId,
        receiverSolanaAddress: server.receiverSolanaAddress,
        receiverEthereumAddress: server.receiverEthereumAddress,
        costInUsdc: server.costInUsdc.toString(),
        maxRoleApplicableTime: server.maxRoleApplicableTime,
      })),
    });
  } catch (error) {
    console.error("Error fetching servers:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get specific server by serverId
export const getServerById = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    if (!serverId) {
      return res.status(400).json({
        success: false,
        error: "Server ID is required",
      });
    }

    const server = await prisma.server.findUnique({
      where: { serverId },
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    res.status(200).json({
      success: true,
      server: {
        id: server.id,
        name: server.name,
        serverId: server.serverId,
        receiverSolanaAddress: server.receiverSolanaAddress,
        receiverEthereumAddress: server.receiverEthereumAddress,
        costInUsdc: server.costInUsdc.toString(),
        maxRoleApplicableTime: server.maxRoleApplicableTime,
      },
    });
  } catch (error) {
    console.error("Error fetching server:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
