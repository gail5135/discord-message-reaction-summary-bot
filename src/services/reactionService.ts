/**
 * 리액션 처리 서비스
 * 원본/복사 메시지의 리액션을 합산하여 복사 메시지에 기록
 */

import { Message } from "discord.js";
import { getCopyId, getOriginalId } from "../store/messageMap";

/** 이모지 → 유저 ID Set 매핑 타입 */
type ReactionMap = Map<string, Set<string>>;

/** 메시지 내용 구분선 */
const SEPARATOR = "----------------------";

/**
 * 메시지에서 리액션 정보 수집
 * @returns 이모지별 유저 ID Set
 */
async function collectReactions(message: Message): Promise<ReactionMap> {
  const result: ReactionMap = new Map();

  for (const reaction of message.reactions.cache.values()) {
    const users = await reaction.users.fetch();
    const filtered = users.filter((u) => !u.bot);
    if (filtered.size === 0) continue;

    // 커스텀 이모지는 <:name:id> 형식, 일반 이모지는 그대로
    const emoji = reaction.emoji.id
      ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
      : reaction.emoji.name!;

    const userIds = result.get(emoji) ?? new Set<string>();
    filtered.forEach((u) => userIds.add(u.id));
    result.set(emoji, userIds);
  }

  return result;
}

/**
 * 여러 리액션 맵을 합산 (중복 유저 제거)
 */
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

/**
 * 리액션 정보를 복사 메시지에 업데이트
 */
async function updateCopyMessage(
  originalMessage: Message | null,
  copyMessage: Message
): Promise<void> {
  // 양쪽 메시지에서 리액션 수집
  const copyReactions = await collectReactions(copyMessage);
  const originalReactions = originalMessage
    ? await collectReactions(originalMessage)
    : new Map<string, Set<string>>();

  // 리액션 합산 (중복 유저 자동 제거)
  const merged = mergeReactions(originalReactions, copyReactions);

  // 리액션 라인 생성
  const lines: string[] = [];
  for (const [emoji, userIds] of merged.entries()) {
    const mentions = [...userIds].map((id) => `<@${id}>`).join(", ");
    lines.push(`${emoji} : ${mentions}`);
  }

  // 메시지 내용 조합
  const base = copyMessage.content.split(SEPARATOR)[0].trim();
  const final =
    lines.length === 0 ? base : `${base}\n\n${SEPARATOR}\n${lines.join("\n")}`;

  await copyMessage.edit(final);
}

/**
 * 리액션 변경 이벤트 핸들러
 * 원본/복사 메시지를 판별하여 복사 메시지 업데이트
 */
export async function handleReactionChange(message: Message): Promise<void> {
  let originalMessage: Message | null = null;
  let copyMessage: Message;

  const copyId = getCopyId(message.id);

  if (copyId) {
    // 현재 메시지가 원본인 경우
    originalMessage = message;
    copyMessage = await message.channel.messages
      .fetch(copyId)
      .catch(() => null as any);
    if (!copyMessage) return;
  } else {
    // 현재 메시지가 복사본인 경우
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
