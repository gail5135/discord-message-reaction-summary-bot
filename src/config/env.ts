const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

export const DISCORD_TOKEN = requireEnv("DISCORD_TOKEN");
export const ORIGIN_CHANNEL_ID = requireEnv("ORIGIN_CHANNEL_ID");
export const COPY_TARGET_CHANNEL_ID = requireEnv("COPY_TARGET_CHANNEL_ID");
