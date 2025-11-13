import { PrismaClient } from "@prisma/client";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_TOKEN;
const client = new TelegramBot(TOKEN!);
const prisma = new PrismaClient();

async function main() {
  try {
    const roleAssignedUsers = await prisma.roleAssigned.findMany({
      where: {
        expiryTime: {
          lt: new Date(),
        },
      },
    });

    for (const roleAssignedUser of roleAssignedUsers) {
      const user = await client.getChatMember(
        roleAssignedUser.serverId,
        Number(roleAssignedUser.userId)
      );

      if (!user) {
        continue;
      }

      await client.unbanChatMember(roleAssignedUser.serverId, user.user.id, {
        only_if_banned: false,
      });

      await prisma.roleAssigned.delete({
        where: {
          id: roleAssignedUser.id,
        },
      });
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

setInterval(main, 60000);
