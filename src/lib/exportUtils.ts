import { ADVENT_END_DATE, ADVENT_SCHEDULE } from '@/data/adventSchedule';
import { getTodayKstDateString } from '@/lib/dateUtils';
import type { DailyScheduleEntry, ReflectionItem } from '@/types/advent';

/**
 * 성탄절 아카이브(4페이지 묵상 스케치 & 전체 엑셀 다운로드) 공용 유틸리티
 *
 * 대표 묵상 자동 선정 원칙:
 * - 하루에 1건씩 대표 묵상을 선정해 A4 1페이지(주간 6~7칸)에 아기자기하게 담습니다.
 * - 단순 '좋아요 1등'으로 소수 작성자만 반복 선정되는 소외감을 줄이기 위해,
 *   같은 주차에서 아직 대표로 선정되지 않은 작성자 중 '아멘 ♥' 수가 가장 높은 글을 우선 선정합니다.
 * - 인쇄 화면에서는 담당자가 클릭으로 그날 올라온 다른 댓글로 손쉽게 교체할 수 있습니다.
 */

export interface WeeklySketchDayBundle {
  date: string;
  dayOfWeek: string;
  kind: DailyScheduleEntry['kind'];
  /** 카드 배지용 짧은 말씀 표기 (예: 요 1:5 / 교회력 막 13:24-37 외) */
  shortPassageLabel: string;
  /** 요약용 전체 본문 표기 */
  passageSummary: string;
  keyVerseRef?: string;
  reflectionCount: number;
  /** 그날 등록된 모든 묵상 (아멘 수 내림차순 정렬 — 인쇄 화면 교체 선택지용) */
  reflections: ReflectionItem[];
  /** 중복 작성자 배려 + 아멘 수 기반으로 자동 선정된 기본 대표 묵상 ID */
  defaultFeaturedId?: string;
}

export interface WeeklySketchBundle {
  pageNumber: 1 | 2 | 3 | 4;
  weekTitle: string;
  weekSubtitle: string;
  periodLabel: string;
  ornamentName: string;
  candleLabel: string;
  candleColor: string;
  accentColor: string;
  accentDark: string;
  tintBg: string;
  cardBg: string;
  borderColor: string;
  days: WeeklySketchDayBundle[];
  reflections: ReflectionItem[];
  /** 그 주에 묵상을 남긴 모든 참여자 이름 (가나다순, 중복 제거) */
  participants: string[];
  uniqueAuthorCount: number;
}

export interface SketchExportPayload {
  generatedAtKst: string;
  totalReflections: number;
  totalParticipants: number;
  weeks: WeeklySketchBundle[];
}

const WEEK_META: Record<
  1 | 2 | 3 | 4,
  {
    weekTitle: string;
    weekSubtitle: string;
    periodLabel: string;
    ornamentName: string;
    candleLabel: string;
    candleColor: string;
    accentColor: string;
    accentDark: string;
    tintBg: string;
    cardBg: string;
    borderColor: string;
  }
> = {
  1: {
    weekTitle: '대림절 1주차',
    weekSubtitle: '소망의 등불 · 어둠 속에 비추는 첫 번째 빛',
    periodLabel: '2026.11.29 (일) ~ 12.05 (토)',
    ornamentName: '소망의 등불',
    candleLabel: '1주차 진보라 초',
    candleColor: '#5b21b6',
    accentColor: '#7c3aed',
    accentDark: '#5b21b6',
    tintBg: '#f6f3ff',
    cardBg: '#fcfbff',
    borderColor: '#c4b5fd',
  },
  2: {
    weekTitle: '대림절 2주차',
    weekSubtitle: '평화의 종 · 나그네를 환대하는 평화의 울림',
    periodLabel: '2026.12.06 (일) ~ 12.12 (토)',
    ornamentName: '평화의 종',
    candleLabel: '2주차 연보라 초',
    candleColor: '#8b5cf6',
    accentColor: '#6d28d9',
    accentDark: '#4c1d95',
    tintBg: '#f2ecfe',
    cardBg: '#fbf9ff',
    borderColor: '#a78bfa',
  },
  3: {
    weekTitle: '대림절 3주차',
    weekSubtitle: '기쁨의 방울 · 오시는 주님을 맞이하는 기쁨',
    periodLabel: '2026.12.13 (일) ~ 12.19 (토)',
    ornamentName: '기쁨의 방울',
    candleLabel: '3주차 분홍 초',
    candleColor: '#db2777',
    accentColor: '#5b21b6',
    accentDark: '#3b0764',
    tintBg: '#eee6fd',
    cardBg: '#faf7ff',
    borderColor: '#9f7aea',
  },
  4: {
    weekTitle: '대림절 4주차 · 성탄절',
    weekSubtitle: '사랑의 마음 & 성탄의 큰 별 · 우리 안에 오신 임마누엘',
    periodLabel: '2026.12.20 (일) ~ 12.25 (금)',
    ornamentName: '사랑의 마음 · 성탄 별',
    candleLabel: '4주차 흰색 초 · 성탄 별',
    candleColor: '#d97706',
    accentColor: '#4c1d95',
    accentDark: '#2e1065',
    tintBg: '#ebe2fc',
    cardBg: '#faf6ff',
    borderColor: '#8b5cf6',
  },
};

/** 성탄절 출력 기능 접근 가능 여부를 확인합니다 (서버 기준 KST 12월 25일 이후 오픈). */
export function isChristmasExportUnlocked(): boolean {
  return getTodayKstDateString() >= ADVENT_END_DATE;
}

/** 일정 1건의 본문 표기를 한 줄 요약 문자열로 만듭니다. */
export function getDayPassageLabel(entry: DailyScheduleEntry): string {
  if (entry.kind === 'weekend' && entry.lectionaryReadings) {
    const gospel = entry.lectionaryReadings.find((r) => r.slot === 'gospel');
    const ot = entry.lectionaryReadings.find((r) => r.slot === 'ot');
    return `교회력 (${[ot?.spec.shortRefKo, gospel?.spec.shortRefKo].filter(Boolean).join(' · ')} 외)`;
  }
  if (entry.mainPassage) {
    return entry.keyVerse
      ? `${entry.mainPassage.shortRefKo} (핵심: ${entry.keyVerse.shortRefKo})`
      : entry.mainPassage.shortRefKo;
  }
  return entry.title;
}

/** 아기자기한 스케치 카드 뱃지용 초간결 말씀 라벨 */
function getShortCardPassageLabel(entry: DailyScheduleEntry): string {
  if (entry.kind === 'weekend' && entry.lectionaryReadings) {
    const gospel = entry.lectionaryReadings.find((r) => r.slot === 'gospel');
    return gospel ? `교회력 · ${gospel.spec.shortRefKo}` : '주말 교회력';
  }
  if (entry.keyVerse) {
    return entry.keyVerse.shortRefKo;
  }
  return entry.mainPassage?.shortRefKo ?? entry.title;
}

/** 아멘 수 내림차순, 동점이면 먼저 작성한 순으로 정렬 */
function sortByAmenDesc(items: ReflectionItem[]): ReflectionItem[] {
  return [...items].sort((a, b) => {
    const amenDiff = (b.amenCount ?? 0) - (a.amenCount ?? 0);
    if (amenDiff !== 0) return amenDiff;
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}

/** 전체 묵상을 정확히 4개 주차(1~4페이지) 묶음으로 집계합니다. */
export function buildWeeklySketchPayload(allReflections: ReflectionItem[]): SketchExportPayload {
  const byDate = new Map<string, ReflectionItem[]>();
  for (const r of allReflections) {
    const list = byDate.get(r.devotionDate) ?? [];
    list.push(r);
    byDate.set(r.devotionDate, list);
  }

  const allAuthors = new Set<string>();
  for (const r of allReflections) {
    if (r.authorName.trim()) allAuthors.add(r.authorName.trim());
  }

  const pages: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
  const weeks: WeeklySketchBundle[] = pages.map((pageNumber) => {
    const meta = WEEK_META[pageNumber];
    const scheduleEntries = ADVENT_SCHEDULE.filter((entry) =>
      pageNumber === 4 ? entry.week === 4 || entry.week === 5 : entry.week === pageNumber
    );

    const weekReflections: ReflectionItem[] = [];
    const weekAuthors = new Set<string>();
    // 같은 주차 안에서 특정 지체만 계속 뽑히지 않도록 이미 대표로 선정된 작성자 추적
    const featuredAuthorsInWeek = new Set<string>();

    const days: WeeklySketchDayBundle[] = scheduleEntries.map((entry) => {
      const rawDayItems = byDate.get(entry.date) ?? [];
      const sortedItems = sortByAmenDesc(rawDayItems);

      for (const item of rawDayItems) {
        weekReflections.push(item);
        if (item.authorName.trim()) weekAuthors.add(item.authorName.trim());
      }

      let defaultFeaturedId: string | undefined;
      if (sortedItems.length > 0) {
        // 1순위: 이번 주에 아직 대표로 안 실린 작성자 중 아멘 수 1등
        const freshCandidate = sortedItems.find(
          (item) => !featuredAuthorsInWeek.has(item.authorName.trim())
        );
        const picked = freshCandidate ?? sortedItems[0];
        defaultFeaturedId = picked.id;
        if (picked.authorName.trim()) {
          featuredAuthorsInWeek.add(picked.authorName.trim());
        }
      }

      return {
        date: entry.date,
        dayOfWeek: entry.dayOfWeek,
        kind: entry.kind,
        shortPassageLabel: getShortCardPassageLabel(entry),
        passageSummary: getDayPassageLabel(entry),
        keyVerseRef: entry.keyVerse?.shortRefKo,
        reflectionCount: sortedItems.length,
        reflections: sortedItems,
        defaultFeaturedId,
      };
    });

    const participants = Array.from(weekAuthors).sort((a, b) => a.localeCompare(b, 'ko'));

    return {
      pageNumber,
      ...meta,
      days,
      reflections: weekReflections,
      participants,
      uniqueAuthorCount: participants.length,
    };
  });

  const generatedAtKst = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return {
    generatedAtKst,
    totalReflections: allReflections.length,
    totalParticipants: allAuthors.size,
    weeks,
  };
}
