import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_TOKEN;
export const bot = new TelegramBot(TOKEN!);
