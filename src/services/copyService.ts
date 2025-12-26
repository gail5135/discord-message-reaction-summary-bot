import { Client, Message, TextChannel } from "discord.js";
import { COPY_TARGET_CHANNEL_ID } from "../config/env";
import { LABELS } from "../config/i18n";
import { getLocale } from "../utils/locale";
import { copyMessageMap } from "../store/messageMap";

function buildBaseContent(original: Message): string {
  const locale = getLocale(original);
  const labels = LABELS[locale];

  return (
    `"${labels.organizer}": <@${original.author.id}>\n` +
    `"${labels.content}": ${original.content}`
  );
}

export async function createCopyMessage(
  client: Client,
  original: Message
): Promise<Message> {
  const channel = await client.channels.fetch(COPY_TARGET_CHANNEL_ID as string);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Copy target channel is not a text channel");
  }

  const textChannel = channel as TextChannel;
  const baseContent = buildBaseContent(original);

  const copy = await textChannel.send(baseContent);
  copyMessageMap.set(original.id, copy.id);

  return copy;
}
