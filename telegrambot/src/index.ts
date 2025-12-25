import { Telegraf } from "telegraf";
import { z } from "zod";
import { loadRootEnv } from "./config/env.js";
import { PrismaClient } from "@prisma/client";

loadRootEnv();

const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
const prisma = new PrismaClient();

bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const firstName = ctx.from.first_name || "User";
  const username = ctx.from.username ? `@${ctx.from.username}` : "No username";
  
  let message = `👋 Welcome to Finance21 Bot, ${firstName}!\n\n` +
    `📋 Your Telegram Information:\n` +
    `🆔 User ID: \`${userId}\`\n` +
    `👤 Username: ${username}\n\n`;

  try {
    // Check if user is an accountant
    const accountant = await prisma.accountant.findFirst({
      where: {
        telegramId: userId,
      },
      include: {
        roles: {
          where: {
            role: "ACCOUNTANT",
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                tin: true,
              },
            },
          },
        },
      },
    });

    if (accountant && accountant.roles.length > 0) {
      message += `👨‍💼 You are registered as an Accountant!\n\n`;
      message += `📊 Companies you are managing:\n\n`;
      
      accountant.roles.forEach((role, index) => {
        if (role.company) {
          message += `${index + 1}. ${role.company.name.toUpperCase()}\n`;
          message += `   STIR: ${role.company.tin}\n\n`;
        }
      });
      
      message += `💡 You can manage invoices and documents for these companies.\n\n`;
    } else {
      message += `💡 Copy your User ID above and paste it in the Settings page of Finance21.\n\n`;
    }
  } catch (error) {
    console.error("[telegrambot] Error checking accountant:", error);
    message += `💡 Copy your User ID above and paste it in the Settings page of Finance21.\n\n`;
  }

  message += `Use /help for available commands.`;

  ctx.reply(message, { parse_mode: "Markdown" });
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

bot.launch()
  .then(() => {
    console.log("[telegrambot] started (long polling)");
  })
  .catch((error) => {
    console.error("[telegrambot] Failed to start:", error);
    process.exit(1);
  });

// Graceful shutdown
process.once("SIGINT", async () => {
  await bot.stop("SIGINT");
  await prisma.$disconnect();
  process.exit(0);
});

process.once("SIGTERM", async () => {
  await bot.stop("SIGTERM");
  await prisma.$disconnect();
  process.exit(0);
});


