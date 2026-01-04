import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "messageMap.json");

const originalToCopy = new Map<string, string>();
const copyToOriginal = new Map<string, string>();

function loadMap(): void {
  if (!fs.existsSync(FILE_PATH)) return;

  const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
  for (const [origId, copyId] of Object.entries(data)) {
    originalToCopy.set(origId, copyId as string);
    copyToOriginal.set(copyId as string, origId);
  }
}

function saveMap(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(
    FILE_PATH,
    JSON.stringify(Object.fromEntries(originalToCopy), null, 2)
  );
}

loadMap();

export function setMapping(originalId: string, copyId: string): void {
  originalToCopy.set(originalId, copyId);
  copyToOriginal.set(copyId, originalId);
  saveMap();
}

export function isCopyMessage(messageId: string): boolean {
  return copyToOriginal.has(messageId);
}

export function isOriginalMessage(messageId: string): boolean {
  return originalToCopy.has(messageId);
}

export function isTrackedMessage(messageId: string): boolean {
  return isOriginalMessage(messageId) || isCopyMessage(messageId);
}

export function getCopyId(originalId: string): string | undefined {
  return originalToCopy.get(originalId);
}

export function getOriginalId(copyId: string): string | undefined {
  return copyToOriginal.get(copyId);
}

export function hasOriginal(originalId: string): boolean {
  return originalToCopy.has(originalId);
}
