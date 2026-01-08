/**
 * 메시지 복사 서비스
 * 원본 채널의 메시지를 타겟 채널로 복사 후 원본 삭제
 */

import { Client, Message, TextChannel } from "discord.js";
import { TARGET_CHANNEL_ID } from "../config/env";
import { addCopyMessage } from "../store/messageMap";
import { createActionButtons } from "./interactionService";

import { formatMessageBody } from "../utils/messageFormat";

/**
 * 원본 메시지를 타겟 채널에 복사하고 원본 삭제
 */
export async function createCopyMessage(
  client: Client,
  original: Message
): Promise<Message> {
  const channel = await client.channels.fetch(TARGET_CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Copy target channel is not a text channel");
  }

  const textChannel = channel as TextChannel;
  const content = formatMessageBody(original.author.id, original.content);

  const copy = await textChannel.send({
    content,
    components: [createActionButtons()],
  });
  addCopyMessage(copy.id);

  // 원본 메시지 삭제 (권한 없으면 무시)
  await original.delete().catch(() => null);

  return copy;
}
