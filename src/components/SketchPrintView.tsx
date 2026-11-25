'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CHRISTMAS_MESSAGE } from '@/data/adventSchedule';
import type {
  SketchExportPayload,
  WeeklySketchBundle,
  WeeklySketchDayBundle,
} from '@/lib/exportUtils';
import {
  ArrowLeft,
  FileSpreadsheet,
  Heart,
  Printer,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react';

/**
 * 아기자기한 2D 픽셀 다이어리 스타일 — 2026 대림절 4페이지 묵상 스케치
 *
 * 구성 특징:
 * - 정확히 A4 4페이지 (1~3주차 각 1장, 4주차+성탄절 1장)
 * - 상단: 주차별 미니 2D 픽셀 트리·오너먼트 + 점등된 4색 대림초·대림환 일러스트
 * - 본문: 하루 1칸 픽셀 다이어리 카드 (아멘 ♥ + 중복 작성자 배려 자동 선정)
 * - 인쇄 전 편집: 댓글이 2건 이상인 날짜는 인도자가 [↻ 다른 글] 버튼으로 즉시 교체 가능 (인쇄 시 버튼 자동 숨김)
 * - 하단: '이번 주 함께 걸은 사람들' 전체 참여자 이름 배지 + 4페이지 성탄 축하 메시지
 */

interface SketchPrintViewProps {
  payload: SketchExportPayload;
}

const MAX_SKETCH_CHARS = 132;

function truncateForSketch(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1)}…`;
}

function formatShortMonthDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/** 주차 헤더 우측에 아기자기하게 들어가는 미니 2D 픽셀 트리 + 4색 대림초 일러스트 */
function MiniPixelTreeBanner({ weekNumber }: { weekNumber: 1 | 2 | 3 | 4 }) {
  const isFinal = weekNumber === 4;
  const skyBg =
    weekNumber === 1
      ? '#433070'
      : weekNumber === 2
        ? '#35225e'
        : weekNumber === 3
          ? '#29174f'
          : '#1e0f3f';

  const candles = [
    { week: 1, cx: 14, color: '#6d28d9', hi: '#8b5cf6' },
    { week: 2, cx: 26, color: '#a78bfa', hi: '#ddd6fe' },
    { week: 3, cx: 82, color: '#f472b6', hi: '#fbcfe8' },
    { week: 4, cx: 94, color: '#f1f5f9', hi: '#ffffff' },
  ];

  return (
    <div
      className="shrink-0 overflow-hidden border-2 p-1"
      style={{
        borderColor: isFinal ? '#d97706' : '#8b5cf6',
        backgroundColor: skyBg,
      }}
      aria-hidden="true"
    >
      <svg
        width="108"
        height="58"
        viewBox="0 0 108 58"
        shapeRendering="crispEdges"
        className="block"
      >
        {/* 별빛 & 초승달 */}
        <rect x="8" y="6" width="2" height="2" fill="#fde68a" />
        <rect x="26" y="10" width="2" height="2" fill="#e9d5ff" />
        <rect x="80" y="7" width="2" height="2" fill="#e9d5ff" />
        <rect x="96" y="12" width="2" height="2" fill="#fde68a" />
        <rect x="13" y="12" width="3" height="2" fill="#fef3c7" />
        <rect x="11" y="14" width="2" height="4" fill="#fef3c7" />
        <rect x="13" y="18" width="3" height="2" fill="#fef3c7" />

        {/* 지면 */}
        <rect x="0" y="50" width="108" height="3" fill="#4c387a" />
        <rect x="0" y="53" width="108" height="5" fill="#271a47" />

        {/* 정중앙 미니 픽셀 트리 */}
        <rect x="51" y="45" width="6" height="6" fill="#78492a" />
        <rect x="38" y="40" width="32" height="5" fill="#1e5645" />
        <rect x="41" y="34" width="26" height="6" fill="#256d57" />
        <rect x="44" y="28" width="20" height="6" fill="#2c8066" />
        <rect x="47" y="22" width="14" height="6" fill="#329173" />
        <rect x="50" y="17" width="8" height="5" fill="#3ca685" />
        <rect x="53" y="14" width="2" height="3" fill="#47b895" />

        {/* 주차별 오너먼트 도트 */}
        {weekNumber >= 1 && <rect x="45" y="41" width="3" height="3" fill="#fde047" />}
        {weekNumber >= 2 && <rect x="59" y="36" width="3" height="3" fill="#c4b5fd" />}
        {weekNumber >= 3 && <rect x="47" y="30" width="3" height="3" fill="#f472b6" />}
        {weekNumber >= 4 && (
          <>
            <rect x="57" y="24" width="3" height="3" fill="#fb7185" />
            {/* 성탄 큰 별 */}
            <rect x="53" y="6" width="2" height="6" fill="#fde047" />
            <rect x="50" y="8" width="8" height="2" fill="#fde047" />
            <rect x="53" y="8" width="2" height="2" fill="#ffffff" />
          </>
        )}

        {/* 미니 4색 대림초 + 대림환 (수평 일직선) */}
        {candles.map((c) => {
          const lit = c.week <= weekNumber;
          return (
            <g key={c.week}>
              <rect x={c.cx - 2} y="41" width="4" height="8" fill={c.color} />
              <rect x={c.cx - 2} y="41" width="1" height="7" fill={c.hi} />
              {lit && (
                <>
                  <rect x={c.cx - 1} y="37" width="3" height="3" fill="#fb923c" />
                  <rect x={c.cx} y="36" width="1" height="3" fill="#fef08a" />
                </>
              )}
              <rect x={c.cx - 4} y="48" width="8" height="3" fill="#15803d" />
              <rect x={c.cx - 2} y="48" width="1" height="1" fill="#ef4444" />
              <rect x={c.cx + 1} y="49" width="1" height="1" fill="#fde047" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** 하루 1칸 아기자기한 2D 픽셀 다이어리 카드 */
function DailySketchCard({
  day,
  week,
  selectedId,
  onCycleNext,
  isWide,
}: {
  day: WeeklySketchDayBundle;
  week: WeeklySketchBundle;
  selectedId?: string;
  onCycleNext: () => void;
  isWide?: boolean;
}) {
  const isChristmasDay = day.kind === 'christmas';
  const isWeekend = day.kind === 'weekend';

  const currentIdx = day.reflections.findIndex((r) => r.id === selectedId);
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;
  const featured = day.reflections[activeIndex];
  const totalInDay = day.reflections.length;

  const cardBorder = isChristmasDay ? '#d97706' : week.borderColor;
  const cardBg = isChristmasDay ? '#fffdf2' : week.cardBg;
  const badgeBg = isChristmasDay
    ? '#d97706'
    : isWeekend
      ? week.accentDark
      : week.accentColor;

  return (
    <div
      className={`relative flex flex-col justify-between border-2 p-2.5 ${
        isWide ? 'col-span-2 min-h-[34mm]' : 'min-h-[41mm]'
      }`}
      style={{
        borderColor: cardBorder,
        backgroundColor: cardBg,
      }}
    >
      {/* 픽셀 코너 포인트 도트 4개 */}
      <span
        className="pointer-events-none absolute -top-0.5 -left-0.5 h-1.5 w-1.5"
        style={{ backgroundColor: isChristmasDay ? '#b45309' : week.accentColor }}
      />
      <span
        className="pointer-events-none absolute -top-0.5 -right-0.5 h-1.5 w-1.5"
        style={{ backgroundColor: isChristmasDay ? '#b45309' : week.accentColor }}
      />
      <span
        className="pointer-events-none absolute -bottom-0.5 -left-0.5 h-1.5 w-1.5"
        style={{ backgroundColor: isChristmasDay ? '#b45309' : week.accentColor }}
      />
      <span
        className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5"
        style={{ backgroundColor: isChristmasDay ? '#b45309' : week.accentColor }}
      />

      {/* 카드 상단: 날짜 배지 + 말씀 칩 + 인도자 교체 버튼(인쇄 숨김) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-purple-200/70 pb-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="font-pixel shrink-0 px-1.5 py-0.5 text-[9.5px] text-white"
              style={{ backgroundColor: badgeBg }}
            >
              {formatShortMonthDay(day.date)}({day.dayOfWeek})
            </span>
            <span
              className="font-pixel truncate text-[9.5px]"
              style={{ color: isChristmasDay ? '#b45309' : week.accentDark }}
            >
              {isChristmasDay ? '★ 성탄절 · 요 6:35' : day.shortPassageLabel}
            </span>
          </div>

          {/* 댓글이 2건 이상일 때만 표시되는 인도자 교체 버튼 (인쇄 시 자동 숨김) */}
          {totalInDay > 1 && (
            <button
              type="button"
              onClick={onCycleNext}
              title="이 날 올라온 다른 묵상으로 교체하기"
              className="font-pixel inline-flex shrink-0 items-center gap-1 border border-purple-300 bg-purple-50 px-1.5 py-0.5 text-[9px] text-purple-800 hover:border-purple-600 hover:bg-purple-100 print:hidden"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              다른 글 ({activeIndex + 1}/{totalInDay})
            </button>
          )}
        </div>

        {/* 카드 본문: 대표 묵상 또는 아기자기한 손글씨 빈칸 */}
        {featured ? (
          <p className="font-scripture mt-2 text-[10.8px] leading-[1.6] text-slate-800">
            “{truncateForSketch(featured.content, isWide ? 190 : MAX_SKETCH_CHARS)}”
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-[9.5px] text-slate-400">
              {day.passageSummary}
            </p>
            <div className="border-b border-dashed border-purple-200 pt-2.5" />
            <div className="border-b border-dashed border-purple-200 pt-2.5" />
          </div>
        )}
      </div>

      {/* 카드 하단: 작성자 아바타 + 이름 + 아멘 ♥ 배지 */}
      <div className="mt-2 flex items-center justify-between gap-2 pt-1 text-[9.5px]">
        {featured ? (
          <>
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="font-pixel inline-flex h-4 w-4 shrink-0 items-center justify-center border text-[8.5px] font-bold"
                style={{
                  borderColor: badgeBg,
                  backgroundColor: week.tintBg,
                  color: badgeBg,
                }}
              >
                {featured.authorName.trim().slice(0, 1)}
              </span>
              <span
                className="font-pixel truncate font-bold"
                style={{ color: isChristmasDay ? '#92400e' : week.accentDark }}
              >
                {featured.authorName}
              </span>
              {totalInDay > 1 && (
                <span className="shrink-0 text-[8.5px] text-slate-400">
                  외 {totalInDay - 1}건
                </span>
              )}
            </div>

            <span
              className="font-pixel inline-flex shrink-0 items-center gap-0.5 rounded-xs border px-1.5 py-0.5 text-[9px]"
              style={{
                borderColor: '#f9a8d4',
                backgroundColor: '#fdf2f8',
                color: '#be185d',
              }}
            >
              <Heart className="h-2.5 w-2.5 fill-pink-500 text-pink-500" />
              <span>{featured.amenCount ?? 0}</span>
            </span>
          </>
        ) : (
          <span className="font-pixel text-[8.5px] text-purple-300">
            ✦ 오늘의 한 줄 묵상 스케치
          </span>
        )}
      </div>
    </div>
  );
}

function WeeklySketchPage({
  week,
  isLastPage,
  selectedIdsByDate,
  onCycleDayReflection,
}: {
  week: WeeklySketchBundle;
  isLastPage: boolean;
  selectedIdsByDate: Record<string, string>;
  onCycleDayReflection: (day: WeeklySketchDayBundle) => void;
}) {
  // 1~3주차(7일)는 첫째 날(주일 교회력)을 상단 와이드 카드로 두고 나머지 6일(월~토)을 2x3 대칭 배치!
  const hasWideSunday = week.days.length === 7;

  return (
    <article
      className={`sketch-page relative mx-auto flex flex-col justify-between bg-white text-slate-900 shadow-2xl print:shadow-none ${
        isLastPage ? '' : 'sketch-page-break'
      }`}
      style={{
        border: `2px solid ${week.accentColor}`,
      }}
    >
      {/* 상단: 아기자기한 2D 픽셀 일러스트 + 주차 타이틀 헤더 */}
      <div>
        <header
          className="flex items-center justify-between gap-3 border-2 p-3"
          style={{
            backgroundColor: week.tintBg,
            borderColor: week.borderColor,
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="font-pixel inline-block px-2 py-0.5 text-[9.5px] text-white"
                style={{ backgroundColor: week.accentColor }}
              >
                WEEK {week.pageNumber} / 4
              </span>
              <span className="font-pixel text-[10px]" style={{ color: week.accentDark }}>
                ✦ 2026 청년부 대림절 묵상 스케치
              </span>
            </div>

            <h1
              className="font-pixel mt-1.5 text-lg font-bold tracking-tight"
              style={{ color: week.accentDark }}
            >
              {week.weekTitle}
            </h1>
            <p className="mt-0.5 text-[10.5px] text-slate-600">{week.weekSubtitle}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9.5px] text-slate-500">
              <span className="font-pixel">{week.periodLabel}</span>
              <span>·</span>
              <span>
                묵상 <strong style={{ color: week.accentDark }}>{week.reflections.length}건</strong> ·
                참여 <strong style={{ color: week.accentDark }}>{week.uniqueAuthorCount}명</strong>
              </span>
            </div>
          </div>

          <MiniPixelTreeBanner weekNumber={week.pageNumber} />
        </header>

        {/* 본문: 하루 1칸 아기자기한 2D 픽셀 다이어리 카드 그리드 */}
        <section className="mt-3 grid grid-cols-2 gap-2.5">
          {week.days.map((day, idx) => (
            <DailySketchCard
              key={day.date}
              day={day}
              week={week}
              selectedId={selectedIdsByDate[day.date] ?? day.defaultFeaturedId}
              onCycleNext={() => onCycleDayReflection(day)}
              isWide={hasWideSunday && idx === 0}
            />
          ))}
        </section>
      </div>

      {/* 하단: 이번 주 함께 걸은 사람들(전원) + 성탄 축하 배너(4p) + 푸터 */}
      <footer className="mt-3 space-y-2">
        {/* 함께 참여한 모든 지체 이름 배지 (소외감 방지) */}
        <div
          className="border px-3 py-2"
          style={{
            backgroundColor: week.tintBg,
            borderColor: week.borderColor,
          }}
        >
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3" style={{ color: week.accentColor }} />
            <span className="font-pixel text-[9.5px]" style={{ color: week.accentDark }}>
              이번 주 함께 걸은 사람들 ({week.participants.length}명)
            </span>
          </div>

          {week.participants.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {week.participants.map((name) => (
                <span
                  key={name}
                  className="font-pixel inline-block border bg-white px-1.5 py-0.5 text-[9px]"
                  style={{
                    borderColor: week.borderColor,
                    color: week.accentDark,
                  }}
                >
                  ★ {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[9.5px] text-slate-500">
              말씀을 따라 대림절 {week.pageNumber}주차를 함께 걸어가는 청년부 공동체 · 전체 묵상은 엑셀 시트에 보존됩니다.
            </p>
          )}
        </div>

        {/* 4페이지 성탄절 축하 배너 */}
        {isLastPage && (
          <div
            className="border-2 px-4 py-2 text-center"
            style={{
              borderColor: '#d97706',
              backgroundColor: '#fffbeb',
            }}
          >
            <p className="font-pixel text-[9.5px] text-amber-700">
              ★ MERRY CHRISTMAS · 2026.12.25 ★
            </p>
            <p className="font-pixel mt-0.5 text-[11.5px] text-slate-900">{CHRISTMAS_MESSAGE}</p>
          </div>
        )}

        <div
          className="flex items-center justify-between border-t pt-1.5 text-[9.5px] text-slate-500"
          style={{ borderColor: week.borderColor }}
        >
          <span className="font-pixel">2026 청년부 대림절 말씀 묵상집</span>
          <span className="font-pixel font-bold" style={{ color: week.accentDark }}>
            Page {week.pageNumber} / 4
          </span>
        </div>
      </footer>
    </article>
  );
}

export default function SketchPrintView({ payload }: SketchPrintViewProps) {
  // 초기값: 중복 작성자 배려 + 아멘 수 기반으로 자동 추천된 날짜별 대표 묵상 ID
  const buildDefaultSelection = () => {
    const initial: Record<string, string> = {};
    for (const week of payload.weeks) {
      for (const day of week.days) {
        if (day.defaultFeaturedId) {
          initial[day.date] = day.defaultFeaturedId;
        }
      }
    }
    return initial;
  };

  const [selectedIdsByDate, setSelectedIdsByDate] = useState<Record<string, string>>(
    buildDefaultSelection
  );

  const handleCycleDayReflection = (day: WeeklySketchDayBundle) => {
    if (day.reflections.length <= 1) return;
    setSelectedIdsByDate((prev) => {
      const currentId = prev[day.date] ?? day.defaultFeaturedId;
      const currentIdx = day.reflections.findIndex((r) => r.id === currentId);
      const nextIdx = (currentIdx + 1) % day.reflections.length;
      return {
        ...prev,
        [day.date]: day.reflections[nextIdx].id,
      };
    });
  };

  const handleResetDefaults = () => {
    setSelectedIdsByDate(buildDefaultSelection());
  };

  return (
    <div className="min-h-screen bg-[#1a1033] pb-12 print:min-h-0 print:bg-white print:pb-0">
      {/* 화면 전용 상단 출력 툴바 (인쇄 시 자동 숨김) */}
      <div className="sticky top-0 z-20 border-b-2 border-[#d9be76]/60 bg-[#120926]/95 px-4 py-3 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-pixel inline-flex items-center gap-1.5 border border-[#8c7235] bg-[#211442] px-3 py-1.5 text-xs text-purple-100 hover:border-[#d9be76]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              돌아가기
            </Link>
            <div>
              <h1 className="font-pixel flex items-center gap-1.5 text-sm text-[#f0cf70]">
                <Sparkles className="h-3.5 w-3.5" />
                2026 대림절 묵상 스케치 (총 4페이지)
              </h1>
              <p className="text-[11px] text-purple-200/80">
                전체 묵상 {payload.totalReflections}건 · 참여 {payload.totalParticipants}명 ·
                생성 {payload.generatedAtKst}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="font-pixel inline-flex items-center gap-1 border border-purple-400/40 bg-[#211442] px-2.5 py-1.5 text-[11px] text-purple-200 hover:border-[#d9be76]"
            >
              <RotateCcw className="h-3 w-3" />
              추천 초기화
            </button>
            <a
              href="/api/export/excel"
              className="pixel-btn inline-flex items-center gap-1.5 bg-[#211442] px-3 py-1.5 text-xs text-emerald-200"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              전체 묵상 엑셀 (.xlsx)
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="pixel-btn inline-flex items-center gap-1.5 bg-[#311f5e] px-3.5 py-1.5 text-xs text-[#f0cf70]"
            >
              <Printer className="h-3.5 w-3.5" />
              4페이지 인쇄 / PDF 저장
            </button>
          </div>
        </div>
      </div>

      {/* 안내 한 줄 (화면 전용) */}
      <p className="mx-auto mt-5 max-w-[210mm] px-4 text-center text-xs text-purple-200/85 print:hidden">
        댓글이 여러 건인 날은 카드 우측의 <strong>[↻ 다른 글]</strong> 버튼으로 대표 묵상을 바꿀 수 있습니다.
        인쇄 시 <strong>배경 그래픽 켜기 · 여백 없음</strong>으로 저장하시면 정확히 4장으로 출력됩니다.
      </p>

      {/* 정확히 4장의 아기자기한 A4 묵상 스케치 페이지 */}
      <main className="mt-5 space-y-8 px-4 print:m-0 print:space-y-0 print:p-0">
        {payload.weeks.map((week, idx) => (
          <WeeklySketchPage
            key={week.pageNumber}
            week={week}
            isLastPage={idx === payload.weeks.length - 1}
            selectedIdsByDate={selectedIdsByDate}
            onCycleDayReflection={handleCycleDayReflection}
          />
        ))}
      </main>
    </div>
  );
}
