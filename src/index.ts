import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Message } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
  ],
});

/**
 * 원본 → 카피
 */
const originalToCopyMap = new Map<string, string>();

/**
 * 카피 → 원본
 */
const copyToOriginalMap = new Map<string, string>();

/**
 * 이모지 문자열 변환
 */
function getEmojiDisplay(emoji: any): string {
  return emoji.id ? `<:${emoji.name}:${emoji.id}>` : emoji.name;
}

/**
 * 메시지 생성 시: 카피 메시지 생성
 */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.channel?.isTextBased()) return;

  const copyMessage = await message.channel.send(
    message.content || "(내용 없음)"
  );

  originalToCopyMap.set(message.id, copyMessage.id);
  copyToOriginalMap.set(copyMessage.id, message.id);
});

/**
 * 카피 메시지 업데이트
 */
async function updateCopyMessage(copyMessage: Message) {
  if (!copyMessage.channel?.isTextBased()) return;

  // 🔒 카피 메시지가 아니면 무시
  if (!copyToOriginalMap.has(copyMessage.id)) return;

  const originalContent = copyMessage.content.split("\n-----------\n")[0];

  const emojiMap = new Map<string, string[]>();

  for (const reaction of copyMessage.reactions.cache.values()) {
    const emoji = getEmojiDisplay(reaction.emoji);
    const users = await reaction.users.fetch();

    const mentions = users.filter((u) => !u.bot).map((u) => `<@${u.id}>`);

    if (mentions.length > 0) {
      emojiMap.set(emoji, mentions);
    }
  }

  // 반응 없으면 원본 텍스트만 유지
  if (emojiMap.size === 0) {
    await copyMessage.edit(originalContent);
    return;
  }

  const lines = [originalContent, "-----------"];

  for (const [emoji, users] of emojiMap) {
    lines.push(`${emoji} : ${users.join(", ")}`);
  }

  await copyMessage.edit(lines.join("\n"));
}

/**
 * 리액션 추가
 */
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const message = reaction.message as Message;

  // ✅ 카피 메시지에만 반응 허용
  if (!copyToOriginalMap.has(message.id)) return;

  await updateCopyMessage(message);
});

/**
 * 리액션 제거
 */
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const message = reaction.message as Message;

  // ✅ 카피 메시지에만 반응 허용
  if (!copyToOriginalMap.has(message.id)) return;

  await updateCopyMessage(message);
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
