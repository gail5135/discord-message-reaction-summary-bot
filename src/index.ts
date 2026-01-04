/**
 * Discord 메시지 리액션 요약 봇
 *
 * 기능:
 * 1. 원본 채널에 메시지 작성 시 → 타겟 채널에 복사
 * 2. 원본/복사 메시지에 리액션 추가/제거 시 → 복사 메시지에 리액션 정보 기록
 * 3. 양쪽 메시지의 리액션을 합산하여 중복 없이 기록
 */

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

/**
 * 새 메시지 생성 이벤트
 * 원본 채널의 메시지를 타겟 채널로 복사
 */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content) return;
  if (hasOriginal(message.id)) return;
  if (message.channel.id !== ORIGIN_CHANNEL_ID) return;

  await createCopyMessage(client, message);
});

/**
 * Partial 메시지를 완전한 메시지로 fetch
 */
async function fetchFullMessage(message: Message): Promise<Message> {
  return message.partial ? await message.fetch() : message;
}

/**
 * 리액션 추가 이벤트
 */
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const message = await fetchFullMessage(reaction.message as Message);
  if (!isTrackedMessage(message.id)) return;

  await handleReactionChange(message);
});

/**
 * 리액션 제거 이벤트
 */
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const message = await fetchFullMessage(reaction.message as Message);
  if (!isTrackedMessage(message.id)) return;

  await handleReactionChange(message);
});

client.login(DISCORD_TOKEN);
