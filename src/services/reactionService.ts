import { Message } from "discord.js";

export async function updateCopyMessage(copyMessage: Message) {
  const lines: string[] = [];

  for (const reaction of copyMessage.reactions.cache.values()) {
    const users = await reaction.users.fetch();
    const filtered = users.filter((u) => !u.bot);
    if (filtered.size === 0) continue;

    const emoji = reaction.emoji.id
      ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
      : reaction.emoji.name;

    const mentions = filtered.map((u) => `<@${u.id}>`).join(", ");
    lines.push(`${emoji} : ${mentions}`);
  }

  const base = copyMessage.content.split("-----------")[0].trim();

  const final =
    lines.length === 0 ? base : `${base}\n-----------\n${lines.join("\n")}`;

  await copyMessage.edit(final);
}
