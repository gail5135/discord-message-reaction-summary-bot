export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const ORIGIN_CHANNEL_ID = process.env.ORIGIN_CHANNEL_ID;
export const COPY_TARGET_CHANNEL_ID = process.env.COPY_TARGET_CHANNEL_ID;

if (!DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is required");
}

if (!COPY_TARGET_CHANNEL_ID) {
  throw new Error("COPY_TARGET_CHANNEL_ID is required");
}
