'use client';

import { useState } from 'react';
import {
  TRANSLATION_OPTIONS,
  type BibleVerse,
  type DailyScheduleEntry,
  type LectionarySlotKey,
  type LoadedScriptureBlock,
  type TranslationId,
} from '@/types/advent';
import type { AdventThemeTokens } from '@/lib/theme';
import { ArrowDown, BookOpen, RefreshCw, Sparkles } from 'lucide-react';

/**
 * 오늘의 성경 말씀 패널 (평일 확대 본문 + 핵심 요절 하이라이트 / 토·일 교회력 4본문 탭)
 *
 * - 개역개정, 새번역, 공동번역, NIV 4개 중 하나를 픽셀 체크박스로 전환합니다.
 * - 성경 본문은 장시간 읽어도 눈이 편안하도록 Gowun Batang 명조체와 넉넉한 행간을 적용했습니다.
 */

interface ScripturePanelProps {
  entry: DailyScheduleEntry;
  passages: LoadedScriptureBlock[];
  keyVersePreview?: BibleVerse[];
  translation: TranslationId;
  onChangeTranslation: (next: TranslationId) => void;
  isLoading: boolean;
  onRetry: () => void;
  theme: AdventThemeTokens;
}

export default function ScripturePanel({
  entry,
  passages,
  keyVersePreview,
  translation,
  onChangeTranslation,
  isLoading,
  onRetry,
  theme,
}: ScripturePanelProps) {
  const [activeSlot, setActiveSlot] = useState<LectionarySlotKey>('gospel');

  const isWeekend = entry.kind === 'weekend';
  const activeBlock: LoadedScriptureBlock | undefined = isWeekend
    ? passages.find((p) => p.slot === activeSlot) ?? passages[0]
    : passages[0];

  const highlightedSet = new Set(activeBlock?.highlightedVerses ?? []);
  const isLongPassage = (activeBlock?.verses.length ?? 0) >= 24;

  const scrollToReflections = () => {
    const target = document.getElementById('reflection-section');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="pixel-panel p-4 sm:p-6">
      {/* 패널 상단 제목 + 묵상 바로가기 버튼 */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: 'rgba(217, 190, 118, 0.28)' }}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-pixel inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px]"
              style={{
                borderColor: theme.frameGold,
                backgroundColor: theme.highlightBg,
                color: theme.frameGold,
              }}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {isWeekend ? '주말 교회력 말씀' : entry.kind === 'christmas' ? '성탄절 말씀' : '오늘의 말씀'}
            </span>
            {entry.lectionaryLabel && (
              <span className="font-pixel text-xs" style={{ color: theme.accentPurple }}>
                {entry.lectionaryLabel}
              </span>
            )}
          </div>

          <h2 className="font-pixel mt-2 text-lg sm:text-xl" style={{ color: theme.textPrimary }}>
            {isWeekend
              ? activeBlock?.spec.referenceKo ?? entry.title
              : entry.mainPassage?.referenceKo ?? entry.title}
          </h2>

          {entry.subtitle && (
            <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
              {entry.subtitle}
            </p>
          )}
        </div>

        {/* 12/25 등 본문이 긴 날에 댓글창으로 편하게 이동할 수 있는 버튼 */}
        <button
          type="button"
          onClick={scrollToReflections}
          className="pixel-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          style={{
            backgroundColor: theme.panelBgSoft,
            color: theme.frameGold,
          }}
        >
          <span>묵상 쓰러 가기</span>
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 성경 번역본 4종 단일 선택 체크 UI (개역개정 / 새번역 / 공동번역 / NIV) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex flex-wrap items-center gap-2"
          role="radiogroup"
          aria-label="성경 번역본 선택"
        >
          {TRANSLATION_OPTIONS.map((opt) => {
            const checked = translation === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onChangeTranslation(opt.id)}
                className="font-pixel inline-flex items-center gap-2 border-2 px-3 py-1.5 text-xs transition-colors"
                style={{
                  borderColor: checked ? theme.frameGold : 'rgba(180, 158, 248, 0.3)',
                  backgroundColor: checked ? theme.highlightBg : 'rgba(12, 6, 28, 0.45)',
                  color: checked ? theme.frameGold : theme.textMuted,
                }}
              >
                {/* 픽셀 체크박스 사각형 */}
                <span
                  className="inline-flex h-3.5 w-3.5 items-center justify-center border text-[9px] leading-none"
                  style={{
                    borderColor: checked ? theme.frameGold : '#7866a3',
                    backgroundColor: checked ? theme.frameGold : 'transparent',
                    color: '#160b2e',
                  }}
                >
                  {checked ? '✓' : ''}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {activeBlock && (
          <span className="text-[11px]" style={{ color: theme.textMuted }}>
            출처: {activeBlock.sourceName}
          </span>
        )}
      </div>

      {/* 토요일/주일 교회력 4본문 전환 탭 (구약 · 시편 · 서신서 · 복음서) */}
      {isWeekend && entry.lectionaryReadings && (
        <div
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
          role="tablist"
          aria-label="주일 교회력 4본문 선택"
        >
          {entry.lectionaryReadings.map((reading) => {
            const isActive = (activeBlock?.slot ?? activeSlot) === reading.slot;
            return (
              <button
                key={reading.slot}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSlot(reading.slot)}
                className={`pixel-tab flex flex-col items-start px-3 py-2 text-left ${
                  isActive ? 'pixel-tab-active' : ''
                }`}
              >
                <span className="text-[11px]">{reading.labelKo}</span>
                <span
                  className="mt-0.5 text-[11px] opacity-85"
                  style={{ color: isActive ? theme.textPrimary : theme.textMuted }}
                >
                  {reading.spec.shortRefKo}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 평일/성탄절: 엑셀의 '기존 본문' 핵심 요절 상단 하이라이트 카드 */}
      {!isWeekend && entry.keyVerse && (
        <div
          className="mt-4 border-2 p-3.5 sm:p-4"
          style={{
            borderColor: theme.highlightBorder,
            backgroundColor: theme.highlightBg,
          }}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" style={{ color: theme.frameGold }} />
            <span className="font-pixel text-xs" style={{ color: theme.frameGold }}>
              오늘의 핵심 요절 · {entry.keyVerse.referenceKo}
            </span>
          </div>

          {!isLoading && keyVersePreview && keyVersePreview.length > 0 ? (
            <div className="font-scripture mt-2 space-y-1.5 text-sm leading-relaxed sm:text-[15px]" style={{ color: theme.textPrimary }}>
              {keyVersePreview.map((v) => (
                <p key={v.verse}>
                  <span
                    className="font-pixel mr-2 text-[11px]"
                    style={{ color: theme.frameGold }}
                  >
                    {v.verse}
                  </span>
                  {v.text}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs" style={{ color: theme.textMuted }}>
              {isLoading
                ? '핵심 요절 말씀을 불러오는 중입니다...'
                : '아래 전체 본문에서 하이라이트된 핵심 구절을 함께 묵상해 보세요.'}
            </p>
          )}
        </div>
      )}

      {/* 본문 출력 영역 */}
      <div className="mt-5">
        {!isWeekend && entry.mainPassage && (
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-pixel text-xs" style={{ color: theme.accentPurple }}>
              함께 묵상할 본문 · {entry.mainPassage.referenceKo}
            </span>
            {isLongPassage && (
              <span className="text-[11px]" style={{ color: theme.textMuted }}>
                전체 {activeBlock?.verses.length}절
              </span>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="pixel-panel-soft flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div
              className="font-pixel animate-pulse text-sm"
              style={{ color: theme.frameGold }}
            >
              말씀을 불러오는 중...
            </div>
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {translation === 'NIV' ? 'BibleGateway' : '대한성서공회'}에서 본문을 가져오고 있습니다.
            </p>
          </div>
        ) : activeBlock?.errorMessage ? (
          <div className="pixel-panel-soft flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <p className="text-sm text-rose-200">{activeBlock.errorMessage}</p>
            <button
              type="button"
              onClick={onRetry}
              className="pixel-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
              style={{
                backgroundColor: theme.panelBg,
                color: theme.frameGold,
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              다시 불러오기
            </button>
          </div>
        ) : activeBlock && activeBlock.verses.length > 0 ? (
          <div
            className={`pixel-panel-soft space-y-2.5 p-4 sm:p-5 ${
              isLongPassage ? 'max-h-[540px] overflow-y-auto' : ''
            }`}
          >
            {activeBlock.verses.map((v, idx) => {
              const isHighlighted = highlightedSet.has(v.verse);
              const prevVerse = idx > 0 ? activeBlock.verses[idx - 1].verse : null;
              // 교회력 시편처럼 절이 중간에 건너뛸 때(예: 7절 -> 17절) 구분선 표시
              const hasGap = prevVerse !== null && v.verse - prevVerse > 1;

              return (
                <div key={v.verse}>
                  {hasGap && (
                    <div
                      className="my-3 border-t border-dashed py-1 text-center font-pixel text-[10px]"
                      style={{
                        borderColor: 'rgba(196, 181, 253, 0.25)',
                        color: theme.textMuted,
                      }}
                    >
                      · · ·
                    </div>
                  )}

                  <p
                    className={`font-scripture rounded-xs px-2.5 py-1.5 text-[15px] leading-[1.9] sm:text-base ${
                      isHighlighted ? 'border-l-4 font-medium' : ''
                    }`}
                    style={
                      isHighlighted
                        ? {
                            backgroundColor: theme.highlightBg,
                            borderColor: theme.highlightBorder,
                            color: '#fffdf5',
                          }
                        : { color: theme.textPrimary }
                    }
                  >
                    <span
                      className="font-pixel mr-2.5 inline-block min-w-[1.5rem] text-xs"
                      style={{
                        color: isHighlighted ? theme.frameGold : theme.accentPurple,
                      }}
                    >
                      {v.verse}
                    </span>
                    <span>{v.text}</span>
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pixel-panel-soft py-10 text-center text-sm" style={{ color: theme.textMuted }}>
            표시할 성경 구절이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
