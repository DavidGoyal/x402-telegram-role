import type { Request, Response } from "express";
import { prisma } from "../prisma/prisma.js";
import jwt from "jsonwebtoken";

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

export const getMyServers = async (req: Request, res: Response) => {
  try {
    const cookie = req.cookies["x402roleaccess-siwe"];
    if (!cookie) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const address = jwt.verify(cookie, process.env.JWT_SECRET!) as string;
    if (!address) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const servers = await prisma.server.findMany({
      where: {
        ownerAddress: { equals: address, mode: "insensitive" },
      },
    });

    res.status(200).json({
      success: true,
      servers: servers.map((server) => ({
        id: server.id,
        serverId: server.serverId,
        serverName: server.name,
        walletAddresses: server.receiverEthereumAddress,
      })),
    });
  } catch (error) {
    console.error("Error fetching my servers:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const getMyServerByServerId = async (req: Request, res: Response) => {
  try {
    const cookie = req.cookies["x402roleaccess-siwe"];
    if (!cookie) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const address = jwt.verify(cookie, process.env.JWT_SECRET!) as string;
    if (!address) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const { serverId } = req.params;
    if (!serverId) {
      return res.status(400).json({
        success: false,
        error: "Server ID is required",
      });
    }

    const server = await prisma.server.findUnique({
      where: {
        serverId,
        ownerAddress: { equals: address, mode: "insensitive" },
      },
      include: {
        roleAssigneds: true,
      },
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    res.status(200).json({
      success: true,
      serverName: server.name,
      rolesAssigned: server.roleAssigneds.map((roleAssigned) => ({
        id: roleAssigned.id,
        userId: roleAssigned.userId,
        serverId: roleAssigned.serverId,
        createdAt: roleAssigned.createdAt,
        expiryTime: roleAssigned.expiryTime,
        active: roleAssigned.active,
      })),
    });
  } catch (error) {
    console.error("Error fetching my server by server ID:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
