import "dotenv/config";
import { Client, GatewayIntentBits, Message, Partials } from "discord.js";

import { DISCORD_TOKEN, ORIGIN_CHANNEL_ID } from "./config/env";
import { hasOriginal, isTrackedMessage } from "./store/messageMap";
import { createCopyMessage } from "./services/copyService";
import { handleReactionChange } from "./services/reactionService";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content) return;
  if (hasOriginal(message.id)) return;
  if (message.channel.id !== ORIGIN_CHANNEL_ID) return;

  await createCopyMessage(client, message);
});

async function fetchFullMessage(message: Message): Promise<Message> {
  return message.partial ? await message.fetch() : message;
}

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const message = await fetchFullMessage(reaction.message as Message);
  if (!isTrackedMessage(message.id)) return;

  await handleReactionChange(message);
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const message = await fetchFullMessage(reaction.message as Message);
  if (!isTrackedMessage(message.id)) return;

  await handleReactionChange(message);
});

client.login(DISCORD_TOKEN);
