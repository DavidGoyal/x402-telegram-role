import axios, { AxiosError } from "axios";
import TelegramBot from "node-telegram-bot-api";
import { withPaymentInterceptor } from "x402-axios";
import { createSigner } from "x402-fetch";
import jwt from "jsonwebtoken";

const TOKEN = process.env.TELEGRAM_TOKEN;
const API_URL = process.env.API_URL || "http://localhost:3001";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://x402-role.vercel.app";
if (!TOKEN || !API_URL || !FRONTEND_URL) {
  throw new Error("TELEGRAM_TOKEN or API_URL or FRONTEND_URL is not set");
}

const bot = new TelegramBot(TOKEN, { polling: true });

interface ServerConfig {
  id: string;
  name: string;
  serverId: string;
  defaultChannelId: string;
  receiverSolanaAddress: string;
  receiverEthereumAddress: string;
  costInUsdc: string;
  maxRoleApplicableTime: number[];
}

interface NetworkUser {
  networkId: string;
  networkName: string;
  publicKey: string;
  balance: string;
  privateKey: string;
}

async function fetchUserInfo(telegramId: string): Promise<{
  networkUsers: NetworkUser[];
} | null> {
  try {
    const response = await fetch(`${API_URL}/api/user/${telegramId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });
    if (!response.ok) {
      console.log(`User ${telegramId} not found in backend`);
      return { networkUsers: [] };
    }
    const data = (await response.json()) as {
      success: boolean;
      networkUsers: NetworkUser[];
    };
    return data.success
      ? { networkUsers: data.networkUsers }
      : { networkUsers: [] };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return { networkUsers: [] };
  }
}

// Helper function to fetch server configuration from backend
async function fetchServerConfig(
  serverId: string
): Promise<ServerConfig | null> {
  try {
    const response = await fetch(`${API_URL}/api/server/${serverId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(`Server ${serverId} not configured in backend`);
      return null;
    }

    const data = (await response.json()) as {
      success: boolean;
      server: ServerConfig;
    };
    return data.success ? data.server : null;
  } catch (error) {
    console.error("Error fetching server config:", error);
    return null;
  }
}

// Helper function to fetch all servers from backend
async function fetchAllServers(): Promise<ServerConfig[]> {
  try {
    const response = await fetch(`${API_URL}/api/servers`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log("Failed to fetch servers from backend");
      return [];
    }

    const data = (await response.json()) as {
      success: boolean;
      servers: ServerConfig[];
    };
    return data.success ? data.servers : [];
  } catch (error) {
    console.error("Error fetching all servers:", error);
    return [];
  }
}

// Track user actions and state
interface UserSubscriptionState {
  serverId?: string;
  serverName?: string;
  time?: number;
  cost?: number;
}

const userState: Record<
  string,
  "deposit_money" | "withdraw_money" | "buy_subscription" | null
> = {};

const userSubscriptionData: Record<string, UserSubscriptionState> = {};

bot.onText(/\/start/, (msg) => {
  const welcomeMessage = `*Hello! Welcome to X402 Role Distributor Bot 🤖*  

Select the server you want to buy the subscription for and the subscription applicable time.

Here are the available actions:

1. 📝 Deposit Money - To deposit money to your wallet
2. ➕ Withdraw Money - To withdraw money from your wallet
3. ❌ Buy subscription - To buy a subscription for a server
`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📝 Deposit Money", callback_data: "deposit_money" }],
        [
          { text: "➕ Withdraw Money", callback_data: "withdraw_money" },
          { text: "❌ Buy subscription", callback_data: "buy_subscription" },
        ],
      ],
    },
    parse_mode: "Markdown",
  };

  //@ts-ignore
  bot.sendMessage(msg.chat.id, welcomeMessage, options);
});

// Handle button clicks
bot.on("callback_query", async (query) => {
  const chatId = query.message!.chat.id;
  const userId = query.from.id.toString();
  const action = query.data;

  // Clear any previous state to avoid conflicting actions
  userState[userId] = null;

  const userInfo = await fetchUserInfo(userId);

  if (!userInfo || userInfo.networkUsers.length === 0) {
    bot.sendMessage(chatId, "User not found or no wallets configured");
    return;
  }

  if (action === "deposit_money") {
    // Build the deposit message
    let depositMessage = "💵 *Deposit Funds*\n\n";
    depositMessage +=
      "Send USDC to one of the addresses below to add funds to your account.\n\n";

    // Add each network's address and balance
    for (const networkUser of userInfo.networkUsers) {
      depositMessage += `*${networkUser.networkName.toUpperCase()} ADDRESS*\n`;
      depositMessage += `\`${networkUser.publicKey}\`\n\n`;
      depositMessage += `*${networkUser.networkName.toUpperCase()} BALANCE*\n`;
      depositMessage += `*${Number(networkUser.balance) / 1000000} USDC*\n\n`;
    }

    // Add instructions
    depositMessage += "📋 *Instructions*\n";
    depositMessage +=
      "1. Send USDC to either address above (choose your preferred network)\n";
    depositMessage += "2. Wait for blockchain confirmation (1-5 minutes)\n";
    depositMessage += "3. Your balance will be updated automatically.\n\n";

    // Add important warnings
    depositMessage += "⚠️ *Important*\n";
    depositMessage += "• Only send USDC tokens to these addresses\n";
    depositMessage += "• Make sure you're on the correct network.";

    bot.sendMessage(chatId, depositMessage, { parse_mode: "Markdown" });

    console.log(`💵 User ${userId} clicked Deposit button`);
  } else if (action === "withdraw_money") {
    bot.sendMessage(chatId, "Closing ATAs...");
  } else if (action === "buy_subscription") {
    const servers = await fetchAllServers();

    if (servers.length === 0) {
      bot.sendMessage(chatId, "No servers available at the moment.");
      return;
    }

    // Create inline keyboard with server options
    const serverButtons = servers.map((server) => [
      {
        text: `🎮 Server Name: ${server.name}`,
        callback_data: `server_${server.serverId}`,
      },
    ]);

    bot.sendMessage(
      chatId,
      "🎮 *Select a Server*\n\nChoose the server you want to buy a subscription for:",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: serverButtons,
        },
      }
    );

    userState[userId] = "buy_subscription";
    userSubscriptionData[userId] = {};
  } else if (action?.startsWith("server_")) {
    // User selected a server
    const serverId = action.replace("server_", "");

    if (!serverId) {
      bot.sendMessage(chatId, "Invalid server selection.");
      return;
    }

    const serverConfig = await fetchServerConfig(serverId);

    if (!serverConfig) {
      bot.sendMessage(chatId, "Server configuration not found.");
      return;
    }

    // Store server selection
    userSubscriptionData[userId] = {
      serverId: serverConfig.serverId,
      serverName: serverConfig.name,
    };

    // Create time options based on maxRoleApplicableTime
    const timeButtons = serverConfig.maxRoleApplicableTime.map((time) => [
      {
        text: `⏰ ${(time / 86400).toFixed(2)} days - ${
          (Number(serverConfig.costInUsdc) * (time / 86400)) / 1000000
        } USDC`,
        callback_data: `time_${time}_${serverId}`,
      },
    ]);

    bot.sendMessage(
      chatId,
      `⏰ *Select Subscription Duration*\n\nServer: ${
        serverConfig.name
      }\nCost per day: ${
        Number(serverConfig.costInUsdc) / 1000000
      } USDC\n\nChoose how long you want the subscription:`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: timeButtons,
        },
      }
    );
  } else if (action?.startsWith("time_")) {
    // User selected a time duration
    const parts = action.split("_");
    const time = parts[1];
    const serverId = parts.slice(2).join("_");
    const subData = userSubscriptionData[userId];

    if (!time || !serverId || !subData) {
      bot.sendMessage(chatId, "Invalid selection.");
      return;
    }

    const serverConfig = await fetchServerConfig(serverId as string);
    if (!serverConfig) {
      bot.sendMessage(chatId, "Server configuration not found.");
      return;
    }

    if (!serverConfig.maxRoleApplicableTime.includes(Number(time))) {
      bot.sendMessage(chatId, "Invalid time selection.");
      return;
    }
    const totalCost = Number(serverConfig.costInUsdc) * (Number(time) / 86400);

    // Update user subscription data
    if (!userSubscriptionData[userId]) {
      userSubscriptionData[userId] = {};
    }
    userSubscriptionData[userId].time = Number(time);
    userSubscriptionData[userId].cost = totalCost;
    userSubscriptionData[userId].serverId = serverId;

    // Ask for payment mode
    bot.sendMessage(
      chatId,
      `💳 *Choose Payment Method*\n\nServer: ${
        subData.serverName
      }\nDuration: ${(Number(time) / 86400).toFixed(2)} days\nTotal Cost: ${
        totalCost / 1000000
      } USDC\n\nHow would you like to pay?`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💰 Pay from Wallet", callback_data: "payment_wallet" }],
            [{ text: "📄 Generate Invoice", callback_data: "payment_invoice" }],
          ],
        },
      }
    );
  } else if (action === "payment_wallet") {
    // User chose to pay from wallet
    const subData = userSubscriptionData[userId];
    const roleCost = Number(subData?.cost);
    const baseNetworkUser = userInfo.networkUsers.find(
      (user) => user.networkName === "base-sepolia"
    );
    const userBalance = baseNetworkUser?.balance;

    if (!subData || !subData.serverId || !subData.cost || !subData.time) {
      bot.sendMessage(chatId, "Please start the subscription process again.");
      return;
    }

    if (!baseNetworkUser) {
      bot.sendMessage(
        chatId,
        "You do not have enough balance to purchase this role."
      );
      return;
    }

    if (userBalance && Number(userBalance) < roleCost) {
      bot.sendMessage(
        chatId,
        "You do not have enough balance to purchase this role."
      );
      return;
    }

    const privateKey = jwt.verify(
      baseNetworkUser?.privateKey ?? "",
      process.env.JWT_SECRET!
    ) as { privateKey: string };

    const signer = await createSigner(
      "base-sepolia",
      privateKey?.privateKey ?? ""
    );

    try {
      const api = withPaymentInterceptor(
        axios.create({
          baseURL: API_URL,
        }),
        signer
      );
      const response = await api.post(
        `/api/user/access`,
        {
          telegramId: userId,
          networkId: baseNetworkUser?.networkId,
          serverId: subData.serverId,
          roleApplicableTime: subData.time,
        },
        {
          headers: {
            AUTHORIZATION: `Bearer ${process.env.BACKEND_API_KEY}`,
          },
        }
      );

      if (!response.data.success) {
        bot.sendMessage(
          chatId,
          "Failed to process your payment. Please try again."
        );
        return;
      }
    } catch (error) {
      console.error(
        error instanceof AxiosError
          ? (error as AxiosError).response?.data
          : "Unknown error"
      );
      bot.sendMessage(
        chatId,
        "An error occurred while processing your payment. Please try again."
      );
      return;
    }
  } else if (action === "payment_invoice") {
    // User chose to generate invoice
    const subData = userSubscriptionData[userId];

    if (!subData || !subData.serverId || !subData.cost || !subData.time) {
      bot.sendMessage(chatId, "Please start the subscription process again.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/user/invoice`,
        {
          telegramId: userId,
          serverId: subData.serverId,
          roleApplicableTime: subData.time,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
          },
        }
      );

      if (!response.data.success) {
        bot.sendMessage(chatId, "Failed to create invoice.");
        return;
      }
      const token = response.data.token;

      const durationInDays = Number(subData.time) / 86400;

      bot.sendMessage(
        chatId,
        `💰 Payment Invoice for ${
          subData.serverName
        } subscription\n\n**Duration:** ${durationInDays.toFixed(
          2
        )} days\n\n**Please visit the following link to pay:** ${FRONTEND_URL}/invoice/telegram/${token}\n\n**Please pay within 5 minutes of generating the invoice**`
      );

      return;
    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, "Failed to create invoice.");
      return;
    }
  }

  bot.answerCallbackQuery(query.id);
});

// Listen for messages after button clicks
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from!.id.toString();
  const text = msg.text?.trim();

  if (!text) return;

  // Handle text messages for future features if needed
  // Currently all interactions are handled via inline buttons
});

console.log("Bot is running...");
