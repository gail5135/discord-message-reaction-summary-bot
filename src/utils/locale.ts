import { Message } from "discord.js";
import { Locale } from "../config/i18n";

export function getLocale(message: Message): Locale {
  const locale = message.guild?.preferredLocale;
  if (locale?.startsWith("ja")) return "ja";
  return "ko";
}
