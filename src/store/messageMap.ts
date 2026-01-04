/**
 * 메시지 ID 매핑 스토어
 * 원본 메시지 ID ↔ 복사 메시지 ID 관계를 관리
 * JSON 파일로 영속화하여 봇 재시작 시에도 데이터 유지
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "messageMap.json");

/** 원본 ID → 복사 ID */
const originalToCopy = new Map<string, string>();

/** 복사 ID → 원본 ID (역방향 조회 최적화) */
const copyToOriginal = new Map<string, string>();

/**
 * JSON 파일에서 매핑 데이터를 로드
 */
function loadMap(): void {
  if (!fs.existsSync(FILE_PATH)) return;

  const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
  for (const [origId, copyId] of Object.entries(data)) {
    originalToCopy.set(origId, copyId as string);
    copyToOriginal.set(copyId as string, origId);
  }
}

/**
 * 매핑 데이터를 JSON 파일로 저장
 */
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

/**
 * 원본-복사 메시지 매핑 추가
 */
export function setMapping(originalId: string, copyId: string): void {
  originalToCopy.set(originalId, copyId);
  copyToOriginal.set(copyId, originalId);
  saveMap();
}

/**
 * 해당 ID가 복사 메시지인지 확인
 */
export function isCopyMessage(messageId: string): boolean {
  return copyToOriginal.has(messageId);
}

/**
 * 해당 ID가 원본 메시지인지 확인
 */
export function isOriginalMessage(messageId: string): boolean {
  return originalToCopy.has(messageId);
}

/**
 * 해당 ID가 추적 대상 메시지인지 확인 (원본 또는 복사)
 */
export function isTrackedMessage(messageId: string): boolean {
  return isOriginalMessage(messageId) || isCopyMessage(messageId);
}

/**
 * 원본 메시지 ID로 복사 메시지 ID 조회
 */
export function getCopyId(originalId: string): string | undefined {
  return originalToCopy.get(originalId);
}

/**
 * 복사 메시지 ID로 원본 메시지 ID 조회
 */
export function getOriginalId(copyId: string): string | undefined {
  return copyToOriginal.get(copyId);
}

/**
 * 원본 메시지 ID 존재 여부 확인 (메시지 중복 생성 방지용)
 */
export function hasOriginal(originalId: string): boolean {
  return originalToCopy.has(originalId);
}
