import { Telegraf } from "telegraf";
import { z } from "zod";
import { loadRootEnv } from "./config/env.js";

loadRootEnv();

const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  const userId = ctx.from.id;
  const firstName = ctx.from.first_name || "User";
  const username = ctx.from.username ? `@${ctx.from.username}` : "No username";
  
  ctx.reply(
    `👋 Welcome to Finance21 Bot, ${firstName}!\n\n` +
    `📋 Your Telegram Information:\n` +
    `🆔 User ID: \`${userId}\`\n` +
    `👤 Username: ${username}\n\n` +
    `💡 Copy your User ID above and paste it in the Settings page of Finance21.\n\n` +
    `Use /help for available commands.`,
    { parse_mode: "Markdown" }
  );
});

bot.command("help", (ctx) =>
  ctx.reply(
    [
      "📚 Finance21 Bot Commands:",
      "",
      "/start - Show your Telegram User ID",
      "/help - Show this help message",
      "/ping - Check if bot is online",
      "",
      "💡 Your User ID is shown when you use /start command.",
    ].join("\n")
  )
);
bot.command("ping", (ctx) => ctx.reply("✅ pong - Bot is online!"));

bot.on("text", (ctx) => ctx.reply("Received. (More features coming soon.)"));

bot.launch().then(() => {
  console.log("[telegrambot] started (long polling)");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));


