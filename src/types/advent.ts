/**
 * 2026 대림절 묵상 웹앱 핵심 도메인 타입 정의
 */

/** 지원하는 4개 성경 번역본 코드 (대한성서공회 3종 + BibleGateway NIV) */
export type TranslationId = 'GAE' | 'SAE' | 'COG' | 'NIV';

export interface TranslationOption {
  id: TranslationId;
  label: string;
  shortLabel: string;
  sourceName: string;
}

export const TRANSLATION_OPTIONS: TranslationOption[] = [
  { id: 'GAE', label: '개역개정', shortLabel: '개역개정', sourceName: '대한성서공회' },
  { id: 'SAE', label: '새번역', shortLabel: '새번역', sourceName: '대한성서공회' },
  { id: 'COG', label: '공동번역', shortLabel: '공동번역', sourceName: '대한성서공회' },
  { id: 'NIV', label: 'NIV', shortLabel: 'NIV', sourceName: 'BibleGateway' },
];

/** 대림절 주차 (1~4주차, 5는 12월 25일 성탄절) */
export type AdventWeek = 1 | 2 | 3 | 4 | 5;

/** 한 장 안의 절 구간 (예: 1-7절, 17-19절) */
export interface VerseRange {
  start: number;
  end: number;
}

/** 성경 본문 1개 명세 */
export interface ScriptureSpec {
  /** 대한성서공회 3글자 책 코드 (예: jhn, gen, psa) */
  bookCode: string;
  chapter: number;
  /** 다중 절 범위 지원 (시편 등 건너뛰는 교회력 본문 대응) */
  ranges: VerseRange[];
  /** 화면 표시용 전체 표기 (예: 요한복음 1:1-13) */
  referenceKo: string;
  /** 간략 표기 (예: 요 1:1-13) */
  shortRefKo: string;
}

/** 주일·토요일 교회력(RCL) 4대 본문 슬롯 */
export type LectionarySlotKey = 'ot' | 'psalm' | 'epistle' | 'gospel';

export interface LectionaryReading {
  slot: LectionarySlotKey;
  labelKo: string;
  spec: ScriptureSpec;
}

/** 하루치 대림절 말씀 일정 데이터 */
export interface DailyScheduleEntry {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 일, 월, 화, 수, 목, 금, 토
  dayNumber: number; // 1 ~ 27 (11/29 ~ 12/25)
  week: AdventWeek;
  weekLabel: string;
  kind: 'weekday' | 'weekend' | 'christmas';
  title: string;
  subtitle?: string;
  /** 평일/성탄절: 엑셀의 '기존 본문' (핵심 요절 하이라이트용) */
  keyVerse?: ScriptureSpec;
  /** 평일/성탄절: 엑셀의 '함께 묵상할 본문' */
  mainPassage?: ScriptureSpec;
  /** 토/일: 교회력 주일 이름 */
  lectionaryLabel?: string;
  /** 토/일: 교회력 4본문 (구약·시편·서신서·복음서) */
  lectionaryReadings?: LectionaryReading[];
  /** 12월 25일 성탄절 특별 축하 메시지 */
  specialMessage?: string;
}

/** 파싱/캐시된 성경 구절 1줄 */
export interface BibleVerse {
  verse: number;
  text: string;
}

/** API가 내려주는 본문 1개 응답 묶음 */
export interface LoadedScriptureBlock {
  slot?: LectionarySlotKey;
  labelKo?: string;
  spec: ScriptureSpec;
  verses: BibleVerse[];
  highlightedVerses?: number[];
  sourceName: string;
  errorMessage?: string;
}

/** GET /api/daily 응답 형태 */
export interface DailyApiResponse {
  status: 'active' | 'before_advent' | 'after_advent';
  effectiveDate: string;
  serverTodayKst: string;
  translation: TranslationId;
  daysUntilAdvent?: number;
  entry?: DailyScheduleEntry;
  /** 평일/성탄절은 1개(mainPassage), 토/일은 최대 4개(교회력 4본문) */
  passages?: LoadedScriptureBlock[];
  /** 평일/성탄절의 핵심 요절 발췌 텍스트 */
  keyVersePreview?: BibleVerse[];
}

/** 묵상 나눔(댓글) 아이템 */
export interface ReflectionItem {
  id: string;
  devotionDate: string;
  authorName: string;
  content: string;
  amenCount: number;
  createdAt: string;
}
