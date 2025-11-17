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
        username: roleAssigned.username,
        txnLink: roleAssigned.txnLink,
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

export const getMyServerRevenueStats = async (req: Request, res: Response) => {
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
    const { period = "day" } = req.query;

    if (!serverId) {
      return res.status(400).json({
        success: false,
        error: "Server ID is required",
      });
    }

    // Verify server ownership
    const server = await prisma.server.findUnique({
      where: {
        serverId,
        ownerAddress: { equals: address, mode: "insensitive" },
      },
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Server not found or you don't have permission to access it",
      });
    }

    // Fetch all role assignments for the server
    const roleAssignments = await prisma.roleAssigned.findMany({
      where: {
        serverId: serverId,
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group revenue by the specified period
    const revenueMap = new Map<string, number>();

    roleAssignments.forEach((assignment) => {
      const date = new Date(assignment.createdAt);
      let key: string;

      if (period === "day") {
        // Group by day
        key = date.toISOString().split("T")[0] || "";
      } else if (period === "week") {
        // Group by week (ISO week)
        const weekNumber = getISOWeek(date);
        const year = date.getFullYear();
        key = `${year}-W${weekNumber.toString().padStart(2, "0")}`;
      } else if (period === "month") {
        // Group by month
        key = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
      } else {
        // Default to day
        key = date.toISOString().split("T")[0] || "";
      }

      const amount = Number(assignment.amount);
      revenueMap.set(key, (revenueMap.get(key) || 0) + amount);
    });

    // Convert map to array and sort
    const revenueData = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue: revenue / 1e6, // Convert from smallest unit to USDC (6 decimals)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      data: revenueData,
      period,
    });
    return;
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
    return;
  }
};

// Helper function to get ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNumber;
}
