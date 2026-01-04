/**
 * 환경변수 로더
 * 필수 환경변수가 없으면 에러를 발생시킴
 */

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

/** Discord 봇 토큰 */
export const DISCORD_TOKEN = requireEnv("DISCORD_TOKEN");

/** 원본 메시지를 감지할 채널 ID */
export const ORIGIN_CHANNEL_ID = requireEnv("ORIGIN_CHANNEL_ID");

/** 복사 메시지를 작성할 채널 ID */
export const COPY_TARGET_CHANNEL_ID = requireEnv("COPY_TARGET_CHANNEL_ID");
