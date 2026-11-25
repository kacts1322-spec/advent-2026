'use client';

import { useCallback, useEffect, useState } from 'react';
import AdventTreeScene from '@/components/AdventTreeScene';
import AdventGuideAccordion from '@/components/AdventGuideAccordion';
import MorningAlarmBar from '@/components/MorningAlarmBar';
import ScripturePanel from '@/components/ScripturePanel';
import ReflectionSection from '@/components/ReflectionSection';
import { CHRISTMAS_MESSAGE } from '@/data/adventSchedule';
import { formatDisplayDate } from '@/lib/dateUtils';
import { getThemeForWeek } from '@/lib/theme';
import type {
  AdventWeek,
  DailyApiResponse,
  ReflectionItem,
  TranslationId,
} from '@/types/advent';
import Link from 'next/link';
import { FileSpreadsheet, Printer, Sparkles } from 'lucide-react';

/**
 * 2026 대림절 말씀 묵상 메인 컨테이너
 *
 * - 서버 기준 한국 시간(KST) 당일 말씀과 당일 묵상 나눔만 조회합니다.
 * - 대림절 주차(1~4주차, 성탄절)에 따라 페이지 전체의 보라색 톤이 단계적으로 깊어집니다.
 */

interface AdventAppProps {
  serverTodayKst: string;
}

const TRANSLATION_STORAGE_KEY = 'advent-2026-translation';

export default function AdventApp({ serverTodayKst }: AdventAppProps) {
  const [translation, setTranslation] = useState<TranslationId>('GAE');
  const [dailyData, setDailyData] = useState<DailyApiResponse | null>(null);
  const [loadingDaily, setLoadingDaily] = useState<boolean>(true);
  const [dailyFetchError, setDailyFetchError] = useState<string | null>(null);

  const [reflections, setReflections] = useState<ReflectionItem[]>([]);
  const [loadingReflections, setLoadingReflections] = useState<boolean>(true);

  // 마지막에 선택한 번역본을 기억합니다.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TRANSLATION_STORAGE_KEY);
      if (saved === 'GAE' || saved === 'SAE' || saved === 'COG' || saved === 'NIV') {
        setTranslation(saved);
      }
    } catch {
      // 무시
    }
  }, []);

  const handleTranslationChange = (next: TranslationId) => {
    setTranslation(next);
    try {
      window.localStorage.setItem(TRANSLATION_STORAGE_KEY, next);
    } catch {
      // 무시
    }
  };

  const fetchDaily = useCallback(async () => {
    setLoadingDaily(true);
    setDailyFetchError(null);
    try {
      const params = new URLSearchParams({ translation });
      const res = await fetch(`/api/daily?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as DailyApiResponse;
      setDailyData(data);
    } catch (err) {
      setDailyFetchError(
        `오늘의 말씀을 불러오는 데 실패했습니다. (${err instanceof Error ? err.message : '오류'})`
      );
    } finally {
      setLoadingDaily(false);
    }
  }, [translation]);

  const fetchReflections = useCallback(async () => {
    setLoadingReflections(true);
    try {
      const res = await fetch('/api/reflections', { cache: 'no-store' });
      if (!res.ok) {
        setReflections([]);
        return;
      }
      const data = (await res.json()) as { items?: ReflectionItem[] };
      setReflections(data.items ?? []);
    } catch {
      setReflections([]);
    } finally {
      setLoadingReflections(false);
    }
  }, []);

  useEffect(() => {
    void fetchDaily();
  }, [fetchDaily]);

  useEffect(() => {
    void fetchReflections();
  }, [fetchReflections]);

  const activeWeek: AdventWeek =
    dailyData?.status === 'active' && dailyData.entry
      ? dailyData.entry.week
      : dailyData?.status === 'after_advent'
        ? 5
        : 1;

  const unlockedCountWeek =
    dailyData?.status === 'before_advent'
      ? 0
      : dailyData?.status === 'after_advent'
        ? 5
        : activeWeek;

  const theme = getThemeForWeek(activeWeek);
  const isChristmas =
    dailyData?.status === 'active' && dailyData.entry?.kind === 'christmas';

  const themeCssVars = {
    '--page-bg': theme.pageBg,
    '--panel-bg': theme.panelBg,
    '--panel-bg-soft': theme.panelBgSoft,
    '--frame-gold': theme.frameGold,
    '--frame-gold-dark': theme.frameGoldDark,
    '--accent-purple': theme.accentPurple,
    '--highlight-bg': theme.highlightBg,
    '--highlight-border': theme.highlightBorder,
    '--text-primary': theme.textPrimary,
    '--text-muted': theme.textMuted,
  } as React.CSSProperties;

  const dateDisplay = dailyData?.entry
    ? `${formatDisplayDate(dailyData.entry.date)} (${dailyData.entry.dayOfWeek})`
    : formatDisplayDate(dailyData?.effectiveDate ?? serverTodayKst);

  const weekLabelDisplay =
    dailyData?.status === 'before_advent'
      ? '대림절 준비 기간'
      : dailyData?.status === 'after_advent'
        ? '성탄절기'
        : dailyData?.entry?.weekLabel ?? '대림절 1주차';

  return (
    <div style={themeCssVars} className="min-h-screen transition-colors duration-500">
      <div
        className="min-h-screen pb-14"
        style={{
          background: `radial-gradient(circle at top, ${theme.skyBottom}40 0%, ${theme.pageBg} 52%)`,
        }}
      >
        <main className="mx-auto max-w-4xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8">
          {/* 12월 25일 성탄절 특별 축하 배너 + 4페이지 묵상 스케치 & 전체 엑셀 출력 */}
          {isChristmas && (
            <div
              className="pixel-panel px-5 py-4 text-center"
              style={{
                background:
                  'linear-gradient(180deg, rgba(240, 207, 112, 0.2) 0%, rgba(33, 19, 69, 0.92) 100%)',
              }}
            >
              <div className="font-pixel flex items-center justify-center gap-2 text-xs text-amber-200">
                <Sparkles className="h-4 w-4" />
                <span>MERRY CHRISTMAS · 2026.12.25</span>
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="font-pixel mt-2.5 text-sm leading-relaxed text-amber-100 sm:text-base">
                {dailyData.entry?.specialMessage ?? CHRISTMAS_MESSAGE}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 border-t border-amber-200/20 pt-3.5">
                <Link
                  href="/print/sketch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pixel-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs"
                  style={{
                    backgroundColor: '#2c1957',
                    color: '#f0cf70',
                  }}
                >
                  <Printer className="h-3.5 w-3.5" />
                  4주 묵상 스케치 출력 (4페이지)
                </Link>
                <a
                  href="/api/export/excel"
                  className="pixel-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs"
                  style={{
                    backgroundColor: '#1f1240',
                    color: '#a7f3d0',
                  }}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  전체 묵상 엑셀 다운로드 (.xlsx)
                </a>
              </div>
            </div>
          )}

          {/* 2D 픽셀 크리스마스 트리 & 대림초 4개 씬 */}
          <AdventTreeScene
            currentWeek={activeWeek}
            unlockedCountWeek={unlockedCountWeek}
            theme={theme}
            isChristmas={Boolean(isChristmas || dailyData?.status === 'after_advent')}
            dayNumber={dailyData?.entry?.dayNumber}
            dateLabel={dateDisplay}
            weekLabel={weekLabelDisplay}
          />

          {/* 대림절·성탄절 유래 및 전통 성탄목 신앙 교육 안내 (기본 접힘) */}
          <AdventGuideAccordion theme={theme} />

          {/* 매일 아침 7시 대림절 말씀묵상 알림 (PWA 웹 푸시 + 캘린더 .ics 일괄 등록) */}
          <MorningAlarmBar theme={theme} />

          {/* API 통신 자체 실패 시 */}
          {dailyFetchError && (
            <div className="pixel-panel p-6 text-center">
              <p className="text-sm text-rose-200">{dailyFetchError}</p>
              <button
                type="button"
                onClick={() => void fetchDaily()}
                className="pixel-btn mt-4 px-4 py-1.5 text-xs"
                style={{ backgroundColor: theme.panelBgSoft, color: theme.frameGold }}
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 대림절 시작 전 화면 (2026-11-29 이전) */}
          {!dailyFetchError && dailyData?.status === 'before_advent' && (
            <section className="pixel-panel p-6 text-center sm:p-8">
              <p className="font-pixel text-xs" style={{ color: theme.accentPurple }}>
                COMING SOON · 2026.11.29 ~ 2026.12.25
              </p>
              <h2
                className="font-pixel mt-2 text-xl sm:text-2xl"
                style={{ color: theme.frameGold }}
              >
                대림절 시작까지 D-{dailyData.daysUntilAdvent ?? 1}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                2026년 11월 29일(대림절 첫째 주일)부터 매일 당일의 말씀이 열립니다.
                하루에 하나씩 말씀을 묵상하며 성탄을 함께 기다려요.
              </p>
            </section>
          )}

          {/* 대림절 종료 후 화면 (2026-12-25 이후) */}
          {!dailyFetchError && dailyData?.status === 'after_advent' && (
            <section className="pixel-panel p-6 text-center sm:p-8">
              <p className="font-pixel text-xs text-amber-200">2026 ADVENT COMPLETE</p>
              <h2 className="font-pixel mt-2 text-lg leading-relaxed text-amber-100 sm:text-xl">
                {CHRISTMAS_MESSAGE}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                2026 대림절 묵상 여정에 함께해 주셔서 감사합니다.
                성탄의 평화와 은혜가 다가오는 한 해에도 가득하기를 기도합니다.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  href="/print/sketch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pixel-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs"
                  style={{ backgroundColor: '#2c1957', color: '#f0cf70' }}
                >
                  <Printer className="h-3.5 w-3.5" />
                  4주 묵상 스케치 출력 (4페이지)
                </Link>
                <a
                  href="/api/export/excel"
                  className="pixel-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs"
                  style={{ backgroundColor: '#1f1240', color: '#a7f3d0' }}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  전체 묵상 엑셀 다운로드 (.xlsx)
                </a>
              </div>
            </section>
          )}

          {/* 대림절 본문 및 묵상 나눔 (11/29 ~ 12/25) */}
          {!dailyFetchError && dailyData?.status === 'active' && dailyData.entry && (
            <>
              <ScripturePanel
                entry={dailyData.entry}
                passages={dailyData.passages ?? []}
                keyVersePreview={dailyData.keyVersePreview}
                translation={translation}
                onChangeTranslation={handleTranslationChange}
                isLoading={loadingDaily}
                onRetry={() => void fetchDaily()}
                theme={theme}
              />

              <ReflectionSection
                devotionDate={dailyData.effectiveDate}
                reflections={reflections}
                isLoading={loadingReflections}
                onCreated={(item) => setReflections((prev) => [item, ...prev])}
                onUpdated={(updated) =>
                  setReflections((prev) =>
                    prev.map((item) => (item.id === updated.id ? updated : item))
                  )
                }
                theme={theme}
              />
            </>
          )}

          {/* 최초 마운트 시 데이터 로딩 스켈레톤 */}
          {!dailyData && loadingDaily && !dailyFetchError && (
            <section className="pixel-panel py-12 text-center">
              <p className="font-pixel animate-pulse text-sm" style={{ color: theme.frameGold }}>
                오늘의 대림절 말씀을 준비하고 있습니다...
              </p>
            </section>
          )}

          {/* 절제된 하단 푸터 */}
          <footer className="pt-2 text-center text-[11px]" style={{ color: theme.textMuted }}>
            <p className="font-pixel opacity-80">2026 청년부 대림절 묵상집</p>
            <p className="mt-1 opacity-65">
              개역개정 · 새번역 · 공동번역(대한성서공회) · NIV(BibleGateway) · 2026 교회력 나 해(RCL Year B)
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
