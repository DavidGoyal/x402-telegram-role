import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) {
  throw new Error("TELEGRAM_TOKEN is not set");
}

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Hello! I am your bot. How can I assist you?");
});

bot.on("message", async (msg) => {
  if (msg.text !== "/start") {
    bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
  }
  console.log(msg.from?.id);

  const inviteLink = await bot.createChatInviteLink(-1003495511053, {
    member_limit: 1,
  });

  bot.sendMessage(msg.chat.id, inviteLink.invite_link);
});

console.log("Bot is running...");
