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
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log("[telegrambot] Database connection established");
  })
  .catch((error) => {
    console.error("[telegrambot] Database connection failed:", error);
    // Don't exit - bot can still work without DB for basic commands
  });

bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const firstName = ctx.from.first_name || "User";
    const username = ctx.from.username ? `@${ctx.from.username}` : "No username";
    
    let message = `👋 Welcome to Finance21 Bot, ${firstName}!\n\n` +
      `📋 Your Telegram Information:\n` +
      `🆔 User ID: ${userId}\n` +
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
      }).catch((dbError) => {
        console.error("[telegrambot] Database query error:", dbError);
        return null;
      });

      if (accountant && accountant.roles && accountant.roles.length > 0) {
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
    } catch (dbError) {
      console.error("[telegrambot] Error checking accountant:", dbError);
      message += `💡 Copy your User ID above and paste it in the Settings page of Finance21.\n\n`;
    }

    message += `Use /help for available commands.`;

    await ctx.reply(message);
  } catch (error) {
    console.error("[telegrambot] Error in /start command:", error);
    try {
      await ctx.reply("❌ An error occurred. Please try again later.");
    } catch (replyError) {
      console.error("[telegrambot] Error sending error message:", replyError);
    }
  }
});

bot.command("help", async (ctx) => {
  try {
    await ctx.reply(
      [
        "📚 Finance21 Bot Commands:",
        "",
        "/start - Show your Telegram User ID",
        "/help - Show this help message",
        "/ping - Check if bot is online",
        "",
        "💡 Your User ID is shown when you use /start command.",
      ].join("\n")
    );
  } catch (error) {
    console.error("[telegrambot] Error in /help command:", error);
  }
});

bot.command("ping", async (ctx) => {
  try {
    await ctx.reply("✅ pong - Bot is online!");
  } catch (error) {
    console.error("[telegrambot] Error in /ping command:", error);
  }
});

bot.on("text", async (ctx) => {
  try {
    await ctx.reply("Received. (More features coming soon.)");
  } catch (error) {
    console.error("[telegrambot] Error handling text message:", error);
  }
});

// Error handling for bot
bot.catch((err, ctx) => {
  console.error("[telegrambot] Error occurred:", err);
  console.error("[telegrambot] Update:", ctx.update);
  // Don't crash on individual message errors
});

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


