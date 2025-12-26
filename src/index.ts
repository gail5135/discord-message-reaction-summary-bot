import "dotenv/config";
import { Client, GatewayIntentBits, Partials } from "discord.js";

import { DISCORD_TOKEN, ORIGIN_CHANNEL_ID } from "./config/env";
import { copyMessageMap } from "./store/messageMap";
import { createCopyMessage } from "./services/copyService";
import { updateCopyMessage } from "./services/reactionService";

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
  if (copyMessageMap.has(message.id)) return;
  if (message.channel.id !== ORIGIN_CHANNEL_ID) return;

  await createCopyMessage(client, message);
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const message = reaction.message.partial
    ? await reaction.message.fetch()
    : reaction.message;

  if (![...copyMessageMap.values()].includes(message.id)) return;
  await updateCopyMessage(message);
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const message = reaction.message.partial
    ? await reaction.message.fetch()
    : reaction.message;

  if (![...copyMessageMap.values()].includes(message.id)) return;
  await updateCopyMessage(message);
});

client.login(DISCORD_TOKEN);
