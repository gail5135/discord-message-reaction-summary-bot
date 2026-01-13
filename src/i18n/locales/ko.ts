export const ko = {
  error: {
    cannotEdit: "이 메시지는 수정할 수 없습니다.",
    onlyAuthorEdit: "본인이 작성한 메시지만 수정할 수 있습니다.",
    messageNotFound: "메시지를 찾을 수 없습니다.",
    mustStartWithEveryone: "내용은 @everyone으로 시작해야 합니다.",
    emptyAfterEveryone: "@everyone 뒤에 내용을 입력해주세요.",
    cannotDelete: "이 메시지는 삭제할 수 없습니다.",
    onlyAuthorDelete: "본인이 작성한 메시지만 삭제할 수 있습니다.",
  },
  modal: {
    editTitle: "메시지 수정",
    newContentLabel: "새로운 내용",
    placeholder: "수정할 내용을 입력해주세요",
  },
  button: {
    edit: "수정",
    delete: "삭제",
  },
  success: {
    edited: "메시지를 수정했습니다.",
    deleted: "메시지를 삭제했습니다.",
  },
} as const;
