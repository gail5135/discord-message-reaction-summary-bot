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
import { isCopyMessage } from "../store/messageMap";
import { SEPARATOR } from "../utils/constants";
import { t } from "../i18n";

/** 버튼/모달 ID 상수 */
export const BUTTON_ID = {
  EDIT: "edit_copy_message",
  DELETE: "delete_copy_message",
} as const;

export const MODAL_ID = {
  EDIT: "edit_copy_modal",
  CONTENT_INPUT: "new_content_input",
} as const;

import {
  extractAuthorId,
  extractBodyContent,
  formatMessageBody,
} from "../utils/messageFormat";

/**
 * 편집/삭제 버튼이 포함된 ActionRow 생성
 */
export function createActionButtons(
  locale: string = "ja"
): ActionRowBuilder<ButtonBuilder> {
  const editButton = new ButtonBuilder()
    .setCustomId(BUTTON_ID.EDIT)
    .setLabel(t("button.edit", locale))
    .setStyle(ButtonStyle.Primary)
    .setEmoji("✏️");

  const deleteButton = new ButtonBuilder()
    .setCustomId(BUTTON_ID.DELETE)
    .setLabel(t("button.delete", locale))
    .setStyle(ButtonStyle.Danger)
    .setEmoji("🗑️");

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    editButton,
    deleteButton
  );
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
      content: t("error.cannotEdit", interaction.locale),
      ephemeral: true,
    });
    return;
  }

  // 원본 작성자인지 확인
  const authorId = extractAuthorId(message.content);
  if (authorId !== interaction.user.id) {
    await interaction.reply({
      content: t("error.onlyAuthorEdit", interaction.locale),
      ephemeral: true,
    });
    return;
  }

  // 현재 본문 내용 추출
  const currentContent = extractBodyContent(message.content);

  // 모달 생성
  const modal = new ModalBuilder()
    .setCustomId(MODAL_ID.EDIT)
    .setTitle(t("modal.editTitle", interaction.locale));

  const input = new TextInputBuilder()
    .setCustomId(MODAL_ID.CONTENT_INPUT)
    .setLabel(t("modal.newContentLabel", interaction.locale))
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(t("modal.placeholder", interaction.locale))
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
      content: t("error.messageNotFound", interaction.locale),
      ephemeral: true,
    });
    return;
  }

  // 원본 작성자인지 다시 확인
  const authorId = extractAuthorId(message.content);
  if (authorId !== interaction.user.id) {
    await interaction.reply({
      content: t("error.onlyAuthorEdit", interaction.locale),
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
      content: t("error.mustStartWithEveryone", interaction.locale),
      ephemeral: true,
    });
    return;
  }

  // @everyone 뒤에 내용이 있는지 확인
  const contentAfterTag = newContent.slice("@everyone".length).trim();
  if (!contentAfterTag) {
    await interaction.reply({
      content: t("error.emptyAfterEveryone", interaction.locale),
      ephemeral: true,
    });
    return;
  }

  // 기존 리액션 정보 추출
  const parts = message.content.split(SEPARATOR);
  let reactionLines: string[] = [];
  if (parts.length > 1) {
    reactionLines = parts[1]
      .split("\n")
      .map((line) => line.replace(/\u200b/g, "").trim())
      .filter((line) => line.length > 0);
  }

  // 메시지 수정
  const final = formatMessageBody(authorId, newContent, reactionLines);
  await message.edit(final);

  await interaction.reply({
    content: t("success.edited", interaction.locale),
    ephemeral: true,
  });
}

/**
 * 삭제 버튼 클릭 핸들러
 */
export async function handleDeleteButton(
  interaction: ButtonInteraction
): Promise<void> {
  const message = interaction.message;

  // 복사 메시지인지 확인
  if (!isCopyMessage(message.id)) {
    await interaction.reply({
      content: t("error.cannotDelete", interaction.locale),
      ephemeral: true,
    });
    return;
  }

  // 원본 작성자인지 확인
  const authorId = extractAuthorId(message.content);
  if (authorId !== interaction.user.id) {
    await interaction.reply({
      content: t("error.onlyAuthorDelete", interaction.locale),
      ephemeral: true,
    });
    return;
  }

  // 메시지 삭제
  await message.delete();

  await interaction.reply({
    content: t("success.deleted", interaction.locale),
    ephemeral: true,
  });
}
