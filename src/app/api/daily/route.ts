import { NextRequest, NextResponse } from 'next/server';
import { ADVENT_START_DATE, getScheduleByDate } from '@/data/adventSchedule';
import {
  diffDays,
  getAdventPeriodStatus,
  getTodayKstDateString,
} from '@/lib/dateUtils';
import {
  expandRangesToVerseNumbers,
  fetchScripturePassage,
  filterVersesByRanges,
} from '@/lib/bibleScraper';
import type {
  DailyApiResponse,
  LoadedScriptureBlock,
  TranslationId,
} from '@/types/advent';

const VALID_TRANSLATIONS = new Set<TranslationId>(['GAE', 'SAE', 'COG', 'NIV']);

function parseTranslation(raw: string | null): TranslationId {
  if (raw && VALID_TRANSLATIONS.has(raw as TranslationId)) {
    return raw as TranslationId;
  }
  return 'GAE';
}

/**
 * GET /api/daily?translation=GAE|SAE|COG|NIV
 *
 * 당일 말씀 전용 정책에 따라 항상 서버 기준 한국 시간(KST) 오늘 날짜의 말씀만 내려줍니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const translation = parseTranslation(searchParams.get('translation'));
  const serverTodayKst = getTodayKstDateString();
  const effectiveDate = serverTodayKst;

  const periodStatus = getAdventPeriodStatus(effectiveDate);

  if (periodStatus === 'before_advent') {
    const payload: DailyApiResponse = {
      status: 'before_advent',
      effectiveDate,
      serverTodayKst,
      translation,
      daysUntilAdvent: Math.max(1, diffDays(effectiveDate, ADVENT_START_DATE)),
    };
    return NextResponse.json(payload);
  }

  if (periodStatus === 'after_advent') {
    const payload: DailyApiResponse = {
      status: 'after_advent',
      effectiveDate,
      serverTodayKst,
      translation,
    };
    return NextResponse.json(payload);
  }

  const entry = getScheduleByDate(effectiveDate);
  if (!entry) {
    return NextResponse.json(
      { error: '해당 날짜의 대림절 일정을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 주말(토/일): 교회력 4본문 병렬 로드
  if (entry.kind === 'weekend' && entry.lectionaryReadings) {
    const passages: LoadedScriptureBlock[] = await Promise.all(
      entry.lectionaryReadings.map(async (reading) => {
        const result = await fetchScripturePassage(reading.spec, translation);
        return {
          slot: reading.slot,
          labelKo: reading.labelKo,
          spec: reading.spec,
          verses: result.verses,
          sourceName: result.sourceName,
          errorMessage: result.errorMessage,
        };
      })
    );

    const payload: DailyApiResponse = {
      status: 'active',
      effectiveDate,
      serverTodayKst,
      translation,
      entry,
      passages,
    };
    return NextResponse.json(payload);
  }

  // 평일 및 성탄절(12/25): 함께 묵상할 본문 로드 + 기존 본문(핵심 요절) 하이라이트
  const passages: LoadedScriptureBlock[] = [];
  let keyVersePreview = undefined;

  if (entry.mainPassage) {
    const result = await fetchScripturePassage(entry.mainPassage, translation);
    const highlightedVerses = entry.keyVerse
      ? expandRangesToVerseNumbers(entry.keyVerse.ranges)
      : [];

    if (entry.keyVerse && result.verses.length > 0) {
      keyVersePreview = filterVersesByRanges(result.verses, entry.keyVerse.ranges);
    }

    passages.push({
      spec: entry.mainPassage,
      verses: result.verses,
      highlightedVerses,
      sourceName: result.sourceName,
      errorMessage: result.errorMessage,
    });
  }

  const payload: DailyApiResponse = {
    status: 'active',
    effectiveDate,
    serverTodayKst,
    translation,
    entry,
    passages,
    keyVersePreview,
  };

  return NextResponse.json(payload);
}
