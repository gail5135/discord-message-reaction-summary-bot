/**
 * 메시지 복사 서비스
 * 원본 채널의 메시지를 타겟 채널로 복사
 */

import { Client, Message, TextChannel } from "discord.js";
import { COPY_TARGET_CHANNEL_ID } from "../config/env";
import { setMapping } from "../store/messageMap";

/**
 * 복사 메시지의 기본 내용 생성
 * 형식: **From** @작성자\n\n원본내용
 */
function buildBaseContent(original: Message): string {
  return `**From** <@${original.author.id}>\n\n${original.content}`;
}

/**
 * 원본 메시지를 타겟 채널에 복사하고 매핑 저장
 */
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
