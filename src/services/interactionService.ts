/**
 * 인터랙션 처리 서비스
 * 버튼 클릭, 모달 제출 등 사용자 인터랙션 처리
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { getOriginalId, isCopyMessage } from "../store/messageMap";

/** 버튼/모달 ID 상수 */
export const BUTTON_ID = {
  EDIT: "edit_copy_message",
} as const;

export const MODAL_ID = {
  EDIT: "edit_copy_modal",
  CONTENT_INPUT: "new_content_input",
} as const;

/** 메시지 내용 구분선 */
const SEPARATOR = "----------------------";

/**
 * 수정 버튼이 포함된 ActionRow 생성
 */
export function createEditButton(): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setCustomId(BUTTON_ID.EDIT)
    .setLabel("수정")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("✏️");

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
}

/**
 * 복사 메시지 내용에서 원본 작성자 ID 추출
 */
function extractAuthorId(content: string): string | null {
  const match = content.match(/\*\*From\*\* <@(\d+)>/);
  return match ? match[1] : null;
}

/**
 * 복사 메시지 내용에서 본문만 추출 (@everyone 포함)
 */
function extractBodyContent(content: string): string {
  const base = content.split(SEPARATOR)[0].trim();
  const lines = base.split("\n");
  // 첫 줄 (**From** @유저)과 빈 줄 제거 후 본문 반환
  return lines.slice(2).join("\n").trim();
}

/**
 * 수정 버튼 클릭 핸들러
 */
export async function handleEditButton(
  interaction: ButtonInteraction
): Promise<void> {
  const message = interaction.message;

  // 복사 메시지인지 확인
  if (!isCopyMessage(message.id)) {
    await interaction.reply({
      content: "이 메시지는 수정할 수 없습니다.",
      ephemeral: true,
    });
    return;
  }

  // 원본 작성자인지 확인
  const authorId = extractAuthorId(message.content);
  if (authorId !== interaction.user.id) {
    await interaction.reply({
      content: "본인이 작성한 메시지만 수정할 수 있습니다.",
      ephemeral: true,
    });
    return;
  }

  // 현재 본문 내용 추출
  const currentContent = extractBodyContent(message.content);

  // 모달 생성
  const modal = new ModalBuilder()
    .setCustomId(MODAL_ID.EDIT)
    .setTitle("メッセージ編集");

  const input = new TextInputBuilder()
    .setCustomId(MODAL_ID.CONTENT_INPUT)
    .setLabel("新しい内容")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("修正する内容を入力してください")
    .setValue(currentContent)
    .setRequired(true)
    .setMaxLength(2000);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(input)
  );

  await interaction.showModal(modal);
}

/**
 * 수정 모달 제출 핸들러
 */
export async function handleEditModalSubmit(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const message = interaction.message;
  if (!message) {
    await interaction.reply({
      content: "メッセージが見つかりません。",
      ephemeral: true,
    });
    return;
  }

  // 원본 작성자인지 다시 확인
  const authorId = extractAuthorId(message.content);
  if (authorId !== interaction.user.id) {
    await interaction.reply({
      content: "本人が作成したメッセージのみ修正できます。",
      ephemeral: true,
    });
    return;
  }

  // 새 내용 가져오기
  const newContent = interaction.fields.getTextInputValue(
    MODAL_ID.CONTENT_INPUT
  );

  // @everyone으로 시작하는지 확인
  if (!newContent.startsWith("@everyone")) {
    await interaction.reply({
      content: "内容は @everyone で始まる必要があります。",
      ephemeral: true,
    });
    return;
  }

  // @everyone 뒤에 내용이 있는지 확인
  const contentAfterTag = newContent.slice("@everyone".length).trim();
  if (!contentAfterTag) {
    await interaction.reply({
      content: "@everyone の後に内容を入力してください。",
      ephemeral: true,
    });
    return;
  }

  // 기존 리액션 정보 유지
  const parts = message.content.split(SEPARATOR);
  const reactionPart =
    parts.length > 1 ? `\n\n${SEPARATOR}${parts.slice(1).join(SEPARATOR)}` : "";

  // 메시지 수정
  const newBase = `**From** <@${authorId}>\n\n${newContent}`;
  await message.edit({
    content: newBase + reactionPart,
  });

  await interaction.reply({
    content: "メッセージを修正しました。",
    ephemeral: true,
  });
}
