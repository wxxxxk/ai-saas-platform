import type { Job } from "@/lib/api";

// ─── 공개 타입 ────────────────────────────────────────────────────────────────

export type ParsedOutput =
  | { type: "image"; url: string; provider: string; model: string }
  | { type: "text";  content: string; provider: string; model: string }
  | { type: "raw";   value: string };  // JSON envelope지만 미지원 type

// ─── 내부 타입 ────────────────────────────────────────────────────────────────

interface ResultEnvelope {
  version: number;
  type: string;
  data: Record<string, unknown>;
}

// ─── 파서 ─────────────────────────────────────────────────────────────────────

/**
 * Job.outputPayload를 구조화된 ParsedOutput으로 변환한다.
 *
 * 처리 우선순위:
 *  1. outputPayload가 없으면 null 반환
 *  2. JSON.parse 성공 + version===1 + type 존재 → JSON envelope로 처리
 *  3. JSON.parse 실패 → raw string fallback
 *     - IMAGE_GENERATION 모듈이면 url로 처리
 *     - 그 외 모듈은 text content로 처리
 *
 * 목적: 현재 raw string 포맷과 향후 JSON envelope 포맷 모두 처리하는
 * backward-compatible compatibility layer. 백엔드/DB 변경 없이 동작한다.
 */
export function parseOutput(job: Job): ParsedOutput | null {
  if (!job.outputPayload) return null;

  // JSON envelope 시도 (향후 포맷)
  try {
    const parsed = JSON.parse(job.outputPayload) as ResultEnvelope;
    if (parsed.version === 1 && typeof parsed.type === "string" && parsed.data) {
      switch (parsed.type) {
        case "image":
          return {
            type: "image",
            url:      String(parsed.data.url      ?? ""),
            provider: String(parsed.data.provider ?? ""),
            model:    String(parsed.data.model    ?? ""),
          };
        case "text":
          return {
            type: "text",
            content:  String(parsed.data.content  ?? ""),
            provider: String(parsed.data.provider ?? ""),
            model:    String(parsed.data.model    ?? ""),
          };
        default:
          // 지원하지 않는 type은 raw로 보존
          return { type: "raw", value: job.outputPayload };
      }
    }
  } catch {
    // JSON이 아님 — raw string으로 처리
  }

  // Raw string fallback (현재 포맷)
  if (job.moduleName === "IMAGE_GENERATION") {
    return {
      type:     "image",
      url:      job.outputPayload,
      provider: job.provider.toLowerCase(),
      model:    "unknown",
    };
  }

  return {
    type:     "text",
    content:  job.outputPayload,
    provider: job.provider.toLowerCase(),
    model:    "unknown",
  };
}
