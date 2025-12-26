import {
  Client,
  GatewayIntentBits,
  Partials,
  Message,
  TextChannel,
} from "discord.js";
import "dotenv/config";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// 원본 메시지 ID → 카피 메시지 ID
const copyMessageMap = new Map<string, string>();

const COPY_TARGET_CHANNEL_ID = process.env.COPY_TARGET_CHANNEL_ID!;
if (!COPY_TARGET_CHANNEL_ID) {
  throw new Error("COPY_TARGET_CHANNEL_ID is required");
}

// 로그인 확인
client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

/**
 * 카피 메시지 생성
 */
async function createCopyMessage(original: Message): Promise<Message> {
  const channel = await client.channels.fetch(COPY_TARGET_CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Copy target channel is not a text channel");
  }

  const textChannel = channel as TextChannel;

  const copy = await textChannel.send(original.content || "(내용 없음)");
  copyMessageMap.set(original.id, copy.id);

  return copy;
}

/**
 * 카피 메시지 내용 업데이트 (리액션 요약)
 */
async function updateCopyMessage(copyMessage: Message) {
  const reactions = copyMessage.reactions.cache;

  const lines: string[] = [];

  for (const reaction of reactions.values()) {
    const users = await reaction.users.fetch();
    const filtered = users.filter((u) => !u.bot);

    if (filtered.size === 0) continue;

    const emojiDisplay = reaction.emoji.id
      ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
      : reaction.emoji.name;

    const mentions = filtered.map((u) => `<@${u.id}>`).join(", ");

    lines.push(`${emojiDisplay} : ${mentions}`);
  }

  const baseContent = copyMessage.content.split("-----------")[0].trim();

  const finalContent =
    lines.length === 0
      ? baseContent
      : `${baseContent}\n-----------\n${lines.join("\n")}`;

  await copyMessage.edit(finalContent);
}

/**
 * 원본 메시지 감지 → 카피 생성
 */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content) return;

  // 이미 카피된 메시지는 무시
  if (copyMessageMap.has(message.id)) return;

  try {
    await createCopyMessage(message);
  } catch (err) {
    console.error("Failed to create copy message", err);
  }
});

/**
 * 리액션 추가
 */
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const message = reaction.message.partial
    ? await reaction.message.fetch()
    : reaction.message;

  // 카피 메시지에만 반응
  if (![...copyMessageMap.values()].includes(message.id)) return;

  await updateCopyMessage(message);
});

/**
 * 리액션 제거
 */
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const message = reaction.message.partial
    ? await reaction.message.fetch()
    : reaction.message;

  if (![...copyMessageMap.values()].includes(message.id)) return;

  await updateCopyMessage(message);
});

client.login(process.env.DISCORD_TOKEN);
