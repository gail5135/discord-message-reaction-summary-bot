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
import {
  hasOriginal,
  isOriginalMessage,
  isTrackedMessage,
} from "./store/messageMap";
import {
  createCopyMessage,
  updateCopyMessageContent,
} from "./services/copyService";
import { handleReactionChange } from "./services/reactionService";
import {
  BUTTON_ID,
  MODAL_ID,
  handleEditButton,
  handleEditModalSubmit,
} from "./services/interactionService";

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
 * @everyone으로 시작하고 내용이 있는 메시지만 타겟 채널로 복사
 */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content) return;
  if (hasOriginal(message.id)) return;
  if (message.channel.id !== ORIGIN_CHANNEL_ID) return;

  // @everyone으로 시작하지 않으면 무시
  if (!message.content.startsWith("@everyone")) return;

  // @everyone 뒤에 내용이 없으면 무시
  const contentAfterTag = message.content.slice("@everyone".length).trim();
  if (!contentAfterTag) return;

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

/**
 * 메시지 수정 이벤트
 * 원본 메시지 수정 시 복사본도 동기화
 */
client.on("messageUpdate", async (oldMessage, newMessage) => {
  const message = await fetchFullMessage(newMessage as Message);

  if (message.author.bot) return;
  if (!isOriginalMessage(message.id)) return;

  await updateCopyMessageContent(client, message);
});

/**
 * 인터랙션 이벤트 (버튼 클릭, 모달 제출 등)
 */
client.on("interactionCreate", async (interaction) => {
  // 버튼 클릭
  if (interaction.isButton()) {
    if (interaction.customId === BUTTON_ID.EDIT) {
      await handleEditButton(interaction);
    }
    return;
  }

  // 모달 제출
  if (interaction.isModalSubmit()) {
    if (interaction.customId === MODAL_ID.EDIT) {
      await handleEditModalSubmit(interaction);
    }
    return;
  }
});

client.login(DISCORD_TOKEN);
