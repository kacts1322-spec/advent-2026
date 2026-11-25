import { ADVENT_END_DATE, ADVENT_START_DATE } from '@/data/adventSchedule';

/**
 * 날짜/시간 유틸리티 (항상 한국 표준시 KST, UTC+9 기준)
 *
 * 왜 기기 로컬 시간이 아니라 KST 기준으로 계산하나:
 * - "당일 말씀만 보기" 정책에서 사용자 브라우저 타임존이 다르거나 기기 시간이 달라도
 *   교회 공동체 전체가 동일한 '오늘의 말씀'을 보도록 보장하기 위함입니다.
 */

/** 현재 시각 기준 한국 시간(Asia/Seoul)의 YYYY-MM-DD 문자열을 반환합니다. */
export function getTodayKstDateString(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/** YYYY-MM-DD 두 날짜 사이의 일수 차이 (target - base)를 계산합니다. */
export function diffDays(baseDateStr: string, targetDateStr: string): number {
  const [by, bm, bd] = baseDateStr.split('-').map(Number);
  const [ty, tm, td] = targetDateStr.split('-').map(Number);
  const baseUtc = Date.UTC(by, bm - 1, bd);
  const targetUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((targetUtc - baseUtc) / (1000 * 60 * 60 * 24));
}

/** 대림절 기간 판별 (before_advent | active | after_advent) */
export function getAdventPeriodStatus(dateStr: string): 'before_advent' | 'active' | 'after_advent' {
  if (dateStr < ADVENT_START_DATE) return 'before_advent';
  if (dateStr > ADVENT_END_DATE) return 'after_advent';
  return 'active';
}

/** 화면 표기용 날짜 포맷 (예: 2026.11.30) */
export function formatDisplayDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.');
}

/** 댓글 작성 시각을 한국어 간결 형식으로 표기 (예: 11. 30. 오후 2:15) */
export function formatCommentTimeKst(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
