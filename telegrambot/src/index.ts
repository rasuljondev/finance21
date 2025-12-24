import { Telegraf } from "telegraf";
import { z } from "zod";
import { loadRootEnv } from "./config/env.js";

loadRootEnv();

const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply("Finance21 bot is online. Use /help"));
bot.command("help", (ctx) =>
  ctx.reply(
    [
      "Finance21 Bot Commands:",
      "- /help",
      "- /ping",
    ].join("\n")
  )
);
bot.command("ping", (ctx) => ctx.reply("pong"));

bot.on("text", (ctx) => ctx.reply("Received. (More features coming soon.)"));

bot.launch().then(() => {
  console.log("[telegrambot] started (long polling)");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));


