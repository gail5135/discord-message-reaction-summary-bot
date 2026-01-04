import { Client, Message, TextChannel } from "discord.js";
import { COPY_TARGET_CHANNEL_ID } from "../config/env";
import { setMapping } from "../store/messageMap";

function buildBaseContent(original: Message): string {
  return `**From** <@${original.author.id}>\n\n${original.content}`;
}

export async function createCopyMessage(
  client: Client,
  original: Message
): Promise<Message> {
  const channel = await client.channels.fetch(COPY_TARGET_CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Copy target channel is not a text channel");
  }

  const textChannel = channel as TextChannel;
  const baseContent = buildBaseContent(original);

  const copy = await textChannel.send(baseContent);
  setMapping(original.id, copy.id);

  return copy;
}
