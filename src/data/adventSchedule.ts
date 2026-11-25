import type { DailyScheduleEntry, LectionaryReading, ScriptureSpec, VerseRange } from '@/types/advent';
import { BIBLE_BOOKS_BY_CODE } from '@/lib/bibleBooks';

/**
 * 2026 대림절 묵상 전체 일정표 (2026-11-29 대림절 첫째 주일 ~ 2026-12-25 성탄절, 총 27일)
 *
 * - 평일(월~금) 및 성탄절(12/25): 사용자가 제공한 '2026 대림절 묵상집 — 청년부 묵상 본문 확대안(수정판)' 반영
 *   - keyVerse: '기존 본문' (화면에서 핵심 요절로 강조)
 *   - mainPassage: '함께 묵상할 본문' (전체 본문 출력)
 * - 주말(토/일): 2026-2027 교회력(나 해, Revised Common Lectionary Year B) 주일 4본문 반영
 *   - 구약(OT), 시편(Psalm), 서신서(Epistle), 복음서(Gospel)
 */

export const ADVENT_START_DATE = '2026-11-29';
export const ADVENT_END_DATE = '2026-12-25';
export const CHRISTMAS_MESSAGE =
  '우리안에 성탄하신 하나님이, 우리의 한 해 동안 동행하시기를 빕니다!';

/** 간결하게 ScriptureSpec을 생성하는 헬퍼 */
function spec(
  bookCode: string,
  chapter: number,
  ranges: VerseRange[],
  customVerseLabel?: string
): ScriptureSpec {
  const book = BIBLE_BOOKS_BY_CODE[bookCode];
  if (!book) {
    throw new Error(`알 수 없는 성경 책 코드입니다: ${bookCode}`);
  }

  const rangeText =
    customVerseLabel ??
    ranges.map((r) => (r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`)).join(', ');

  return {
    bookCode,
    chapter,
    ranges,
    referenceKo: `${book.nameKo} ${chapter}:${rangeText}`,
    shortRefKo: `${book.abbrevKo} ${chapter}:${rangeText}`,
  };
}

/** 2026년 대림절 4개 주일 교회력(RCL Year B / 나 해) 4본문 묶음 */
const RCL_ADVENT_WEEK_1: LectionaryReading[] = [
  { slot: 'ot', labelKo: '구약', spec: spec('isa', 64, [{ start: 1, end: 9 }]) },
  {
    slot: 'psalm',
    labelKo: '시편',
    spec: spec('psa', 80, [
      { start: 1, end: 7 },
      { start: 17, end: 19 },
    ]),
  },
  { slot: 'epistle', labelKo: '서신서', spec: spec('1co', 1, [{ start: 3, end: 9 }]) },
  { slot: 'gospel', labelKo: '복음서', spec: spec('mrk', 13, [{ start: 24, end: 37 }]) },
];

const RCL_ADVENT_WEEK_2: LectionaryReading[] = [
  { slot: 'ot', labelKo: '구약', spec: spec('isa', 40, [{ start: 1, end: 11 }]) },
  {
    slot: 'psalm',
    labelKo: '시편',
    spec: spec('psa', 85, [
      { start: 1, end: 2 },
      { start: 8, end: 13 },
    ]),
  },
  { slot: 'epistle', labelKo: '서신서', spec: spec('2pe', 3, [{ start: 8, end: 15 }]) },
  { slot: 'gospel', labelKo: '복음서', spec: spec('mrk', 1, [{ start: 1, end: 8 }]) },
];

const RCL_ADVENT_WEEK_3: LectionaryReading[] = [
  {
    slot: 'ot',
    labelKo: '구약',
    spec: spec('isa', 61, [
      { start: 1, end: 4 },
      { start: 8, end: 11 },
    ]),
  },
  { slot: 'psalm', labelKo: '시편', spec: spec('psa', 126, [{ start: 1, end: 6 }]) },
  { slot: 'epistle', labelKo: '서신서', spec: spec('1th', 5, [{ start: 16, end: 24 }]) },
  {
    slot: 'gospel',
    labelKo: '복음서',
    spec: spec('jhn', 1, [
      { start: 6, end: 8 },
      { start: 19, end: 28 },
    ]),
  },
];

const RCL_ADVENT_WEEK_4: LectionaryReading[] = [
  {
    slot: 'ot',
    labelKo: '구약',
    spec: spec('2sa', 7, [
      { start: 1, end: 11 },
      { start: 16, end: 16 },
    ]),
  },
  {
    slot: 'psalm',
    labelKo: '시편',
    spec: spec('psa', 89, [
      { start: 1, end: 4 },
      { start: 19, end: 26 },
    ]),
  },
  { slot: 'epistle', labelKo: '서신서', spec: spec('rom', 16, [{ start: 25, end: 27 }]) },
  { slot: 'gospel', labelKo: '복음서', spec: spec('luk', 1, [{ start: 26, end: 38 }]) },
];

export const ADVENT_SCHEDULE: DailyScheduleEntry[] = [
  // ===================== 대림절 1주차 (11/29 ~ 12/05) =====================
  {
    date: '2026-11-29',
    dayOfWeek: '일',
    dayNumber: 1,
    week: 1,
    weekLabel: '대림절 1주차',
    kind: 'weekend',
    title: '대림절 첫째 주일 교회력 말씀',
    subtitle: '2026 교회력 나 해(Year B) · 주일 성서정과 4본문',
    lectionaryLabel: '대림절 첫째 주일 (나 해)',
    lectionaryReadings: RCL_ADVENT_WEEK_1,
  },
  {
    date: '2026-11-30',
    dayOfWeek: '월',
    dayNumber: 2,
    week: 1,
    weekLabel: '대림절 1주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('jhn', 1, [{ start: 5, end: 5 }]),
    mainPassage: spec('jhn', 1, [{ start: 1, end: 13 }]),
  },
  {
    date: '2026-12-01',
    dayOfWeek: '화',
    dayNumber: 3,
    week: 1,
    weekLabel: '대림절 1주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('gen', 3, [{ start: 24, end: 24 }]),
    mainPassage: spec('gen', 3, [{ start: 14, end: 24 }]),
  },
  {
    date: '2026-12-02',
    dayOfWeek: '수',
    dayNumber: 4,
    week: 1,
    weekLabel: '대림절 1주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('gen', 12, [{ start: 1, end: 2 }]),
    mainPassage: spec('gen', 12, [{ start: 1, end: 9 }]),
  },
  {
    date: '2026-12-03',
    dayOfWeek: '목',
    dayNumber: 5,
    week: 1,
    weekLabel: '대림절 1주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('gen', 28, [{ start: 21, end: 21 }]),
    mainPassage: spec('gen', 28, [{ start: 10, end: 22 }]),
  },
  {
    date: '2026-12-04',
    dayOfWeek: '금',
    dayNumber: 6,
    week: 1,
    weekLabel: '대림절 1주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('heb', 11, [{ start: 13, end: 14 }]),
    mainPassage: spec('heb', 11, [{ start: 8, end: 16 }]),
  },
  {
    date: '2026-12-05',
    dayOfWeek: '토',
    dayNumber: 7,
    week: 1,
    weekLabel: '대림절 1주차',
    kind: 'weekend',
    title: '주말 교회력 말씀 (대림절 둘째 주일 예비)',
    subtitle: '토요일 · 다가오는 대림절 둘째 주일 성서정과 4본문',
    lectionaryLabel: '대림절 둘째 주일 (나 해)',
    lectionaryReadings: RCL_ADVENT_WEEK_2,
  },

  // ===================== 대림절 2주차 (12/06 ~ 12/12) =====================
  {
    date: '2026-12-06',
    dayOfWeek: '일',
    dayNumber: 8,
    week: 2,
    weekLabel: '대림절 2주차',
    kind: 'weekend',
    title: '대림절 둘째 주일 교회력 말씀',
    subtitle: '2026 교회력 나 해(Year B) · 주일 성서정과 4본문',
    lectionaryLabel: '대림절 둘째 주일 (나 해)',
    lectionaryReadings: RCL_ADVENT_WEEK_2,
  },
  {
    date: '2026-12-07',
    dayOfWeek: '월',
    dayNumber: 9,
    week: 2,
    weekLabel: '대림절 2주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('heb', 13, [{ start: 1, end: 2 }]),
    mainPassage: spec('heb', 13, [{ start: 1, end: 8 }]),
  },
  {
    date: '2026-12-08',
    dayOfWeek: '화',
    dayNumber: 10,
    week: 2,
    weekLabel: '대림절 2주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('gen', 19, [{ start: 1, end: 1 }]),
    mainPassage: spec('gen', 19, [{ start: 1, end: 11 }]),
  },
  {
    date: '2026-12-09',
    dayOfWeek: '수',
    dayNumber: 11,
    week: 2,
    weekLabel: '대림절 2주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('gen', 21, [{ start: 14, end: 14 }]),
    mainPassage: spec('gen', 21, [{ start: 8, end: 21 }]),
  },
  {
    date: '2026-12-10',
    dayOfWeek: '목',
    dayNumber: 12,
    week: 2,
    weekLabel: '대림절 2주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('1sa', 30, [{ start: 11, end: 11 }]),
    mainPassage: spec('1sa', 30, [{ start: 11, end: 20 }]),
  },
  {
    date: '2026-12-11',
    dayOfWeek: '금',
    dayNumber: 13,
    week: 2,
    weekLabel: '대림절 2주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('mat', 1, [{ start: 6, end: 6 }]),
    mainPassage: spec('mat', 1, [{ start: 1, end: 17 }]),
  },
  {
    date: '2026-12-12',
    dayOfWeek: '토',
    dayNumber: 14,
    week: 2,
    weekLabel: '대림절 2주차',
    kind: 'weekend',
    title: '주말 교회력 말씀 (대림절 셋째 주일 예비)',
    subtitle: '토요일 · 다가오는 대림절 셋째 주일 성서정과 4본문',
    lectionaryLabel: '대림절 셋째 주일 (나 해)',
    lectionaryReadings: RCL_ADVENT_WEEK_3,
  },

  // ===================== 대림절 3주차 (12/13 ~ 12/19) =====================
  {
    date: '2026-12-13',
    dayOfWeek: '일',
    dayNumber: 15,
    week: 3,
    weekLabel: '대림절 3주차',
    kind: 'weekend',
    title: '대림절 셋째 주일 교회력 말씀',
    subtitle: '2026 교회력 나 해(Year B) · 주일 성서정과 4본문',
    lectionaryLabel: '대림절 셋째 주일 (나 해)',
    lectionaryReadings: RCL_ADVENT_WEEK_3,
  },
  {
    date: '2026-12-14',
    dayOfWeek: '월',
    dayNumber: 16,
    week: 3,
    weekLabel: '대림절 3주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('mrk', 1, [{ start: 2, end: 3 }]),
    mainPassage: spec('mrk', 1, [{ start: 1, end: 11 }]),
  },
  {
    date: '2026-12-15',
    dayOfWeek: '화',
    dayNumber: 17,
    week: 3,
    weekLabel: '대림절 3주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('jhn', 8, [{ start: 34, end: 35 }]),
    mainPassage: spec('jhn', 8, [{ start: 31, end: 38 }]),
  },
  {
    date: '2026-12-16',
    dayOfWeek: '수',
    dayNumber: 18,
    week: 3,
    weekLabel: '대림절 3주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('luk', 2, [{ start: 7, end: 7 }]),
    mainPassage: spec('luk', 2, [{ start: 1, end: 14 }]),
  },
  {
    date: '2026-12-17',
    dayOfWeek: '목',
    dayNumber: 19,
    week: 3,
    weekLabel: '대림절 3주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('mat', 8, [{ start: 20, end: 20 }]),
    mainPassage: spec('mat', 8, [{ start: 18, end: 27 }]),
  },
  {
    date: '2026-12-18',
    dayOfWeek: '금',
    dayNumber: 20,
    week: 3,
    weekLabel: '대림절 3주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('mat', 11, [{ start: 28, end: 28 }]),
    mainPassage: spec('mat', 11, [{ start: 25, end: 30 }]),
  },
  {
    date: '2026-12-19',
    dayOfWeek: '토',
    dayNumber: 21,
    week: 3,
    weekLabel: '대림절 3주차',
    kind: 'weekend',
    title: '주말 교회력 말씀 (대림절 넷째 주일 예비)',
    subtitle: '토요일 · 다가오는 대림절 넷째 주일 성서정과 4본문',
    lectionaryLabel: '대림절 넷째 주일 (나 해)',
    lectionaryReadings: RCL_ADVENT_WEEK_4,
  },

  // ===================== 대림절 4주차 (12/20 ~ 12/24) =====================
  {
    date: '2026-12-20',
    dayOfWeek: '일',
    dayNumber: 22,
    week: 4,
    weekLabel: '대림절 4주차',
    kind: 'weekend',
    title: '대림절 넷째 주일 교회력 말씀',
    subtitle: '2026 교회력 나 해(Year B) · 주일 성서정과 4본문',
    lectionaryLabel: '대림절 넷째 주일 (나 해)',
    lectionaryReadings: RCL_ADVENT_WEEK_4,
  },
  {
    date: '2026-12-21',
    dayOfWeek: '월',
    dayNumber: 23,
    week: 4,
    weekLabel: '대림절 4주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('jhn', 1, [{ start: 14, end: 14 }]),
    mainPassage: spec('jhn', 1, [{ start: 14, end: 18 }]),
  },
  {
    date: '2026-12-22',
    dayOfWeek: '화',
    dayNumber: 24,
    week: 4,
    weekLabel: '대림절 4주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('eph', 2, [{ start: 19, end: 19 }]),
    mainPassage: spec('eph', 2, [{ start: 11, end: 22 }]),
  },
  {
    date: '2026-12-23',
    dayOfWeek: '수',
    dayNumber: 25,
    week: 4,
    weekLabel: '대림절 4주차',
    kind: 'weekday',
    title: '오늘의 말씀 묵상',
    keyVerse: spec('jhn', 14, [{ start: 2, end: 2 }]),
    mainPassage: spec('jhn', 14, [{ start: 1, end: 7 }]),
  },
  {
    date: '2026-12-24',
    dayOfWeek: '목',
    dayNumber: 26,
    week: 4,
    weekLabel: '대림절 4주차',
    kind: 'weekday',
    title: '성탄 전야 말씀 묵상',
    keyVerse: spec('luk', 24, [{ start: 30, end: 31 }]),
    mainPassage: spec('luk', 24, [{ start: 13, end: 35 }]),
  },

  // ===================== 성탄절 (12/25) =====================
  {
    date: '2026-12-25',
    dayOfWeek: '금',
    dayNumber: 27,
    week: 5,
    weekLabel: '성탄절',
    kind: 'christmas',
    title: '성탄절 말씀 묵상',
    subtitle: '생명의 떡으로 우리 안에 오신 예수 그리스도',
    keyVerse: spec('jhn', 6, [{ start: 35, end: 35 }]),
    mainPassage: spec('jhn', 6, [{ start: 1, end: 71 }], '1-71 (6장 전체)'),
    specialMessage: CHRISTMAS_MESSAGE,
  },
];

const SCHEDULE_BY_DATE = new Map<string, DailyScheduleEntry>(
  ADVENT_SCHEDULE.map((entry) => [entry.date, entry])
);

export function getScheduleByDate(dateStr: string): DailyScheduleEntry | undefined {
  return SCHEDULE_BY_DATE.get(dateStr);
}
