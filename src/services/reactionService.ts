import { Message } from "discord.js";
import { getCopyId, getOriginalId } from "../store/messageMap";

type ReactionMap = Map<string, Set<string>>;

const SEPARATOR = "----------------------";

async function collectReactions(message: Message): Promise<ReactionMap> {
  const result: ReactionMap = new Map();

  for (const reaction of message.reactions.cache.values()) {
    const users = await reaction.users.fetch();
    const filtered = users.filter((u) => !u.bot);
    if (filtered.size === 0) continue;

    const emoji = reaction.emoji.id
      ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
      : reaction.emoji.name!;

    const userIds = result.get(emoji) ?? new Set<string>();
    filtered.forEach((u) => userIds.add(u.id));
    result.set(emoji, userIds);
  }

  return result;
}

function mergeReactions(...reactionMaps: ReactionMap[]): ReactionMap {
  const merged: ReactionMap = new Map();

  for (const map of reactionMaps) {
    for (const [emoji, userIds] of map.entries()) {
      const existing = merged.get(emoji) ?? new Set<string>();
      userIds.forEach((id) => existing.add(id));
      merged.set(emoji, existing);
    }
  }

  return merged;
}

async function updateCopyMessage(
  originalMessage: Message | null,
  copyMessage: Message
): Promise<void> {
  const copyReactions = await collectReactions(copyMessage);
  const originalReactions = originalMessage
    ? await collectReactions(originalMessage)
    : new Map<string, Set<string>>();

  const merged = mergeReactions(originalReactions, copyReactions);

  const lines: string[] = [];
  for (const [emoji, userIds] of merged.entries()) {
    const mentions = [...userIds].map((id) => `<@${id}>`).join(", ");
    lines.push(`${emoji} : ${mentions}`);
  }

  const base = copyMessage.content.split(SEPARATOR)[0].trim();
  const final =
    lines.length === 0 ? base : `${base}\n\n${SEPARATOR}\n${lines.join("\n")}`;

  await copyMessage.edit(final);
}

export async function handleReactionChange(message: Message): Promise<void> {
  let originalMessage: Message | null = null;
  let copyMessage: Message;

  const copyId = getCopyId(message.id);

  if (copyId) {
    originalMessage = message;
    copyMessage = await message.channel.messages
      .fetch(copyId)
      .catch(() => null as any);
    if (!copyMessage) return;
  } else {
    copyMessage = message;
    const originalId = getOriginalId(message.id);
    if (originalId) {
      originalMessage = await message.channel.messages
        .fetch(originalId)
        .catch(() => null);
    }
  }

  await updateCopyMessage(originalMessage, copyMessage);
}
