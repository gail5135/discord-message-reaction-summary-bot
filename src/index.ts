import {
  Client,
  GatewayIntentBits,
  Partials,
  Message,
  TextChannel,
} from "discord.js";
import "dotenv/config";

/* =========================
   Discord Client
========================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

/* =========================
   Environment
========================= */

const COPY_TARGET_CHANNEL_ID = process.env.COPY_TARGET_CHANNEL_ID;
if (!COPY_TARGET_CHANNEL_ID) {
  throw new Error("COPY_TARGET_CHANNEL_ID is required");
}

/* =========================
   In-memory Map
   원본 메시지 ID → 카피 메시지 ID
========================= */

const copyMessageMap = new Map<string, string>();

/* =========================
   i18n (Lightweight)
========================= */

type Locale = "ko" | "ja";

const LABELS: Record<Locale, { organizer: string; content: string }> = {
  ko: {
    organizer: "모집자",
    content: "모집 내용",
  },
  ja: {
    organizer: "主催者",
    content: "募集説明",
  },
};

function getLocale(message: Message): Locale {
  const locale = message.guild?.preferredLocale;
  if (locale?.startsWith("ja")) return "ja";
  return "ko";
}

/* =========================
   Utils
========================= */

function buildBaseContent(original: Message): string {
  const locale = getLocale(original);
  const labels = LABELS[locale];

  return (
    `"${labels.organizer}": <@${original.author.id}>\n` +
    `"${labels.content}": ${original.content}`
  );
}

/* =========================
   Create Copy Message
========================= */

async function createCopyMessage(original: Message): Promise<Message> {
  const channel = await client.channels.fetch(COPY_TARGET_CHANNEL_ID as string);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Copy target channel is not a text channel");
  }

  const textChannel = channel as TextChannel;
  const baseContent = buildBaseContent(original);

  const copyMessage = await textChannel.send(baseContent);
  copyMessageMap.set(original.id, copyMessage.id);

  return copyMessage;
}

/* =========================
   Update Reaction Summary
========================= */

async function updateCopyMessage(copyMessage: Message) {
  const reactions = copyMessage.reactions.cache;
  const lines: string[] = [];

  for (const reaction of reactions.values()) {
    const users = await reaction.users.fetch();
    const filteredUsers = users.filter((u) => !u.bot);

    if (filteredUsers.size === 0) continue;

    const emojiDisplay = reaction.emoji.id
      ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
      : reaction.emoji.name;

    const mentions = filteredUsers.map((u) => `<@${u.id}>`).join(", ");

    lines.push(`${emojiDisplay} : ${mentions}`);
  }

  const baseContent = copyMessage.content.split("-----------")[0].trim();

  const finalContent =
    lines.length === 0
      ? baseContent
      : `${baseContent}\n-----------\n${lines.join("\n")}`;

  await copyMessage.edit(finalContent);
}

/* =========================
   Events
========================= */

// Bot ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

// Original message → create copy
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content) return;
  if (copyMessageMap.has(message.id)) return;

  try {
    await createCopyMessage(message);
  } catch (err) {
    console.error("Failed to create copy message", err);
  }
});

// Reaction add
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const message = reaction.message.partial
    ? await reaction.message.fetch()
    : reaction.message;

  if (![...copyMessageMap.values()].includes(message.id)) return;

  await updateCopyMessage(message);
});

// Reaction remove
client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const message = reaction.message.partial
    ? await reaction.message.fetch()
    : reaction.message;

  if (![...copyMessageMap.values()].includes(message.id)) return;

  await updateCopyMessage(message);
});

/* =========================
   Login
========================= */

client.login(process.env.DISCORD_TOKEN);
