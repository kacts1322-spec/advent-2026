'use client';

import { useEffect, useState } from 'react';
import { TREE_ORNAMENTS, type OrnamentConfig, type OrnamentIconType } from '@/data/ornaments';
import type { AdventThemeTokens } from '@/lib/theme';
import type { AdventWeek } from '@/types/advent';

/**
 * 2D 레트로 픽셀 크리스마스 트리 · 트리 주위 대림초 4개(개별 대림환) & 오너먼트 도감 씬
 *
 * 구성 의도:
 * - 정중앙: 귀여운 2D 픽셀 크리스마스 트리 + 주차별 오너먼트(1~4주 + 성탄절 별)
 * - 트리 주위 좌·우 대칭 반원 구도: 왼쪽부터 진보라(1주) - 연보라(2주) - [트리] - 분홍(3주) - 흰색(4주)
 *   각 대림초는 초록 상록수 대림환에 감싸져 있으며, 주차가 올라갈수록 하나씩 촛불이 점등됩니다.
 */

interface AdventTreeSceneProps {
  currentWeek: AdventWeek;
  /** 대림절 시작 전(before_advent)일 때는 0, 1~4주차는 1~4, 성탄절은 5 */
  unlockedCountWeek: number;
  theme: AdventThemeTokens;
  isChristmas: boolean;
  dayNumber?: number;
  dateLabel: string;
  weekLabel: string;
}

interface AdventCandleSpec {
  week: number;
  label: string;
  cx: number;
  /** 2D 횡스크롤 지면 라인에 맞춰 모든 초를 동일한 수평선(baseY=138)에 배치 */
  baseY: number;
  body: string;
  highlight: string;
  shadow: string;
  gaugeColor: string;
}

/**
 * 왼쪽부터 진보라 → 연보라 → (정중앙 트리) → 분홍 → 흰색 순서의 아담한 대림초 4개
 */
const ADVENT_CANDLES: AdventCandleSpec[] = [
  {
    week: 1,
    label: '1주차 진보라 초',
    cx: 56,
    baseY: 138,
    body: '#5b21b6',
    highlight: '#7c3aed',
    shadow: '#3b0764',
    gaugeColor: '#6d28d9',
  },
  {
    week: 2,
    label: '2주차 연보라 초',
    cx: 76,
    baseY: 138,
    body: '#a78bfa',
    highlight: '#ddd6fe',
    shadow: '#7c5cd6',
    gaugeColor: '#a78bfa',
  },
  {
    week: 3,
    label: '3주차 분홍 초',
    cx: 164,
    baseY: 138,
    body: '#ec70a4',
    highlight: '#fbcfe8',
    shadow: '#be3b73',
    gaugeColor: '#f472b6',
  },
  {
    week: 4,
    label: '4주차 흰색 초',
    cx: 184,
    baseY: 138,
    body: '#f1f5f9',
    highlight: '#ffffff',
    shadow: '#cbd5e1',
    gaugeColor: '#f8fafc',
  },
];

/** 트리 위 또는 슬롯 내부에 그려지는 2D 픽셀 오너먼트 아이콘 */
function PixelOrnamentGlyph({
  type,
  primary,
  accent,
  locked = false,
  size = 18,
}: {
  type: OrnamentIconType;
  primary: string;
  accent: string;
  locked?: boolean;
  size?: number;
}) {
  const fillMain = locked ? '#0e081c' : primary;
  const fillAccent = locked ? '#1c1236' : accent;
  const outline = locked ? '#2b1d4d' : '#180d2c';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="shrink-0"
    >
      {type === 'candle' && (
        <>
          <rect x="5" y="1" width="2" height="2" fill={locked ? fillAccent : '#fef08a'} />
          <rect x="5" y="2" width="2" height="1" fill={locked ? fillMain : '#fb923c'} />
          <rect x="4" y="4" width="4" height="6" fill={fillMain} />
          <rect x="5" y="4" width="1" height="5" fill={fillAccent} />
          <rect x="3" y="10" width="6" height="1" fill={outline} />
        </>
      )}

      {type === 'bell' && (
        <>
          <rect x="5" y="1" width="2" height="1" fill={fillAccent} />
          <rect x="4" y="2" width="4" height="2" fill={fillMain} />
          <rect x="3" y="4" width="6" height="4" fill={fillMain} />
          <rect x="4" y="4" width="1" height="3" fill={fillAccent} />
          <rect x="2" y="8" width="8" height="2" fill={fillMain} />
          <rect x="5" y="10" width="2" height="1" fill={fillAccent} />
        </>
      )}

      {type === 'bauble' && (
        <>
          <rect x="5" y="1" width="2" height="2" fill={fillAccent} />
          <rect x="3" y="3" width="6" height="1" fill={fillMain} />
          <rect x="2" y="4" width="8" height="4" fill={fillMain} />
          <rect x="3" y="8" width="6" height="2" fill={fillMain} />
          <rect x="3" y="4" width="2" height="2" fill={fillAccent} />
          <rect x="2" y="6" width="8" height="1" fill={outline} opacity="0.35" />
        </>
      )}

      {type === 'heart' && (
        <>
          <rect x="2" y="3" width="3" height="2" fill={fillMain} />
          <rect x="7" y="3" width="3" height="2" fill={fillMain} />
          <rect x="1" y="4" width="10" height="3" fill={fillMain} />
          <rect x="2" y="7" width="8" height="2" fill={fillMain} />
          <rect x="4" y="9" width="4" height="1" fill={fillMain} />
          <rect x="5" y="10" width="2" height="1" fill={fillMain} />
          <rect x="3" y="4" width="1" height="2" fill={fillAccent} />
        </>
      )}

      {type === 'star' && (
        <>
          <rect x="5" y="0" width="2" height="3" fill={fillMain} />
          <rect x="4" y="3" width="4" height="2" fill={fillMain} />
          <rect x="1" y="4" width="10" height="2" fill={fillMain} />
          <rect x="3" y="6" width="6" height="2" fill={fillMain} />
          <rect x="2" y="8" width="3" height="2" fill={fillMain} />
          <rect x="7" y="8" width="3" height="2" fill={fillMain} />
          <rect x="5" y="4" width="2" height="2" fill={fillAccent} />
        </>
      )}
    </svg>
  );
}

/** SVG 내부 트리 좌표계에 직접 배치하는 픽셀 오너먼트 */
function TreePlacedOrnament({
  ornament,
  isSelected,
  onClick,
}: {
  ornament: OrnamentConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  const x = ornament.treeX - 6;
  const y = ornament.treeY - 6;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      className="cursor-pointer"
      role="button"
      aria-label={`${ornament.weekLabel} 오너먼트 ${ornament.name}`}
    >
      <rect
        x="-1"
        y="-1"
        width="14"
        height="14"
        fill={ornament.primaryColor}
        opacity={isSelected ? 0.35 : 0.16}
      />
      <rect x="0" y="0" width="12" height="12" fill="transparent" />

      {ornament.iconType === 'candle' && (
        <>
          <rect x="5" y="0" width="2" height="2" fill="#fef08a" className="animate-twinkle" />
          <rect x="5" y="2" width="2" height="1" fill="#fb923c" />
          <rect x="4" y="3" width="4" height="7" fill={ornament.primaryColor} />
          <rect x="5" y="3" width="1" height="6" fill={ornament.accentColor} />
          <rect x="3" y="10" width="6" height="1" fill="#6b4e1e" />
        </>
      )}

      {ornament.iconType === 'bell' && (
        <>
          <rect x="5" y="1" width="2" height="1" fill={ornament.accentColor} />
          <rect x="4" y="2" width="4" height="2" fill={ornament.primaryColor} />
          <rect x="3" y="4" width="6" height="4" fill={ornament.primaryColor} />
          <rect x="4" y="4" width="1" height="3" fill={ornament.accentColor} />
          <rect x="2" y="8" width="8" height="2" fill={ornament.primaryColor} />
          <rect x="5" y="10" width="2" height="1" fill="#fde047" />
        </>
      )}

      {ornament.iconType === 'bauble' && (
        <>
          <rect x="5" y="1" width="2" height="2" fill="#e2c675" />
          <rect x="3" y="3" width="6" height="1" fill={ornament.primaryColor} />
          <rect x="2" y="4" width="8" height="4" fill={ornament.primaryColor} />
          <rect x="3" y="8" width="6" height="2" fill={ornament.primaryColor} />
          <rect x="3" y="4" width="2" height="2" fill={ornament.accentColor} />
        </>
      )}

      {ornament.iconType === 'heart' && (
        <>
          <rect x="2" y="3" width="3" height="2" fill={ornament.primaryColor} />
          <rect x="7" y="3" width="3" height="2" fill={ornament.primaryColor} />
          <rect x="1" y="4" width="10" height="3" fill={ornament.primaryColor} />
          <rect x="2" y="7" width="8" height="2" fill={ornament.primaryColor} />
          <rect x="4" y="9" width="4" height="1" fill={ornament.primaryColor} />
          <rect x="5" y="10" width="2" height="1" fill={ornament.primaryColor} />
          <rect x="3" y="4" width="1" height="2" fill={ornament.accentColor} />
        </>
      )}

      {ornament.iconType === 'star' && (
        <g className="animate-twinkle-slow">
          <rect x="5" y="-2" width="2" height="4" fill={ornament.primaryColor} />
          <rect x="4" y="2" width="4" height="2" fill={ornament.primaryColor} />
          <rect x="0" y="4" width="12" height="2" fill={ornament.primaryColor} />
          <rect x="3" y="6" width="6" height="2" fill={ornament.primaryColor} />
          <rect x="2" y="8" width="3" height="2" fill={ornament.primaryColor} />
          <rect x="7" y="8" width="3" height="2" fill={ornament.primaryColor} />
          <rect x="5" y="4" width="2" height="2" fill="#ffffff" />
        </g>
      )}
    </g>
  );
}

/** 트리 주위를 은은하게 밝히는 아담한 2D 픽셀 대림초 1개 + 개별 대림환 */
function AdventCandleWithWreath({
  candle,
  lit,
}: {
  candle: AdventCandleSpec;
  lit: boolean;
}) {
  const { cx, baseY } = candle;
  const bodyTop = baseY - 11;

  return (
    <g aria-label={`${candle.label} (${lit ? '켜짐' : '꺼짐'})`}>
      {/* 지면 그림자 */}
      <rect x={cx - 5} y={baseY + 1} width="10" height="2" fill="#0d061f" opacity="0.45" />

      {/* 대림환 뒤쪽 잎 */}
      <rect x={cx - 4} y={baseY - 3} width="8" height="2" fill="#14532d" />

      {/* 아담한 대림초 몸통 (폭 4px, 높이 10px) */}
      <rect x={cx - 2} y={bodyTop} width="4" height="10" fill={candle.body} />
      <rect x={cx - 2} y={bodyTop} width="1" height="9" fill={candle.highlight} />
      <rect x={cx + 1} y={bodyTop} width="1" height="10" fill={candle.shadow} />

      {/* 심지 */}
      <rect x={cx} y={bodyTop - 1} width="1" height="1" fill="#1e1b4b" />

      {/* 주차가 되면 켜지는 작고 은은한 픽셀 촛불 */}
      {lit && (
        <g>
          {/* 네모나지 않게 십자 형태로 퍼지는 은은한 픽셀 빛 */}
          <rect
            x={cx - 2}
            y={bodyTop - 6}
            width="5"
            height="5"
            fill="#fde047"
            opacity="0.16"
            className="animate-twinkle"
          />
          <rect
            x={cx - 1}
            y={bodyTop - 7}
            width="3"
            height="7"
            fill="#fde047"
            opacity="0.14"
            className="animate-twinkle"
          />
          {/* 아담한 불꽃 */}
          <rect x={cx} y={bodyTop - 6} width="1" height="1" fill="#facc15" className="animate-twinkle" />
          <rect x={cx - 1} y={bodyTop - 5} width="3" height="3" fill="#fb923c" />
          <rect x={cx} y={bodyTop - 2} width="1" height="1" fill="#f97316" />
          {/* 불꽃 중심 밝은 점 */}
          <rect x={cx} y={bodyTop - 4} width="1" height="2" fill="#fef9c3" />
        </g>
      )}

      {/* 초 밑둥을 감싸는 아담한 개별 대림환 */}
      <rect x={cx - 5} y={baseY - 2} width="10" height="3" fill="#166534" />
      <rect x={cx - 4} y={baseY - 3} width="8" height="2" fill="#15803d" />
      <rect x={cx - 3} y={baseY} width="6" height="1" fill="#0f3d21" />
      {/* 밝은 솔잎 포인트 */}
      <rect x={cx - 4} y={baseY - 2} width="2" height="1" fill="#4ade80" opacity="0.75" />
      <rect x={cx + 2} y={baseY - 3} width="2" height="1" fill="#4ade80" opacity="0.75" />
      {/* 대림환 작은 열매 도트 */}
      <rect x={cx - 2} y={baseY - 2} width="1" height="1" fill="#ef4444" />
      <rect x={cx + 2} y={baseY - 1} width="1" height="1" fill="#fde047" />
    </g>
  );
}

export default function AdventTreeScene({
  currentWeek,
  unlockedCountWeek,
  theme,
  isChristmas,
  dayNumber,
  dateLabel,
  weekLabel,
}: AdventTreeSceneProps) {
  const latestUnlockedOrnament =
    TREE_ORNAMENTS.filter((o) => o.unlockWeek <= unlockedCountWeek).at(-1) ?? TREE_ORNAMENTS[0];
  const [selectedId, setSelectedId] = useState<string>(latestUnlockedOrnament.id);

  useEffect(() => {
    setSelectedId(latestUnlockedOrnament.id);
  }, [latestUnlockedOrnament.id]);

  const selectedOrnament =
    TREE_ORNAMENTS.find((o) => o.id === selectedId) ?? latestUnlockedOrnament;
  const isSelectedUnlocked = selectedOrnament.unlockWeek <= unlockedCountWeek;

  const unlockedOrnaments = TREE_ORNAMENTS.filter((o) => o.unlockWeek <= unlockedCountWeek);
  const litCandleCount = Math.min(4, Math.max(0, unlockedCountWeek));

  return (
    <section className="pixel-panel overflow-hidden">
      {/* 2D 게임 상단 스테이지 헤더 바 */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b-2 px-4 py-2.5"
        style={{
          borderColor: theme.frameGoldDark,
          backgroundColor: 'rgba(10, 5, 24, 0.45)',
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* 대림초 4색(진보라·연보라·분홍·흰색)과 일치하는 주차 점등 게이지 */}
          <div className="flex items-center gap-1" aria-label={`대림초 ${litCandleCount}개 점등`}>
            {ADVENT_CANDLES.map((candle) => {
              const lit = candle.week <= unlockedCountWeek;
              return (
                <span
                  key={candle.week}
                  title={candle.label}
                  className="inline-block h-3.5 w-2.5 border"
                  style={{
                    borderColor: lit ? theme.frameGold : '#4a3875',
                    backgroundColor: lit ? candle.gaugeColor : 'rgba(20, 11, 41, 0.7)',
                  }}
                />
              );
            })}
          </div>
          <span
            className="font-pixel text-xs sm:text-sm"
            style={{ color: theme.frameGold }}
          >
            {weekLabel}
          </span>
        </div>

        <div className="font-pixel flex items-center gap-3 text-[11px] sm:text-xs">
          {dayNumber && (
            <span style={{ color: theme.accentPurple }}>DAY {dayNumber} / 27</span>
          )}
          <span style={{ color: theme.textMuted }}>{dateLabel}</span>
        </div>
      </div>

      {/* 메인 2D 횡스크롤 씬 (정중앙 트리 + 주위를 감싸는 4대림초) + 오너먼트 도감 슬롯 */}
      <div className="grid grid-cols-1 md:grid-cols-12">
        <div
          className="relative flex flex-col items-center justify-center border-b-2 md:col-span-7 md:border-r-2 md:border-b-0"
          style={{
            borderColor: theme.frameGoldDark,
            background: `linear-gradient(180deg, ${theme.skyTop} 0%, ${theme.skyBottom} 76%, ${theme.groundTop} 76%)`,
          }}
        >
          {/* 절제된 게임 타이틀 오버레이 */}
          <div className="z-10 pt-4 text-center">
            <p
              className="font-pixel text-[10px] tracking-[0.2em] uppercase"
              style={{ color: theme.accentPurple }}
            >
              2026 YOUTH ADVENT DEVOTION
            </p>
            <h1
              className="font-pixel mt-1 text-xl sm:text-2xl"
              style={{
                color: theme.frameGold,
                textShadow: '2px 2px 0px #120826',
              }}
            >
              대림절 말씀 묵상
            </h1>
          </div>

          {/* 2D 픽셀 스테이지 SVG (정중앙 크리스마스 트리 + 양옆 4개의 대림초와 개별 대림환) */}
          <div className="w-full max-w-[390px] px-2 pt-1 pb-2">
            <svg
              viewBox="0 0 240 168"
              className="h-auto w-full select-none"
              shapeRendering="crispEdges"
              role="img"
              aria-label={`대림절 ${weekLabel} 2D 씬: 정중앙 크리스마스 트리(오너먼트 ${unlockedOrnaments.length}개)와 주위를 감싼 4개의 대림초(${litCandleCount}개 점등)`}
            >
              {/* 밤하늘 별빛 */}
              <rect x="22" y="16" width="2" height="2" fill="#e9ddff" className="animate-twinkle" />
              <rect x="52" y="28" width="2" height="2" fill="#fde68a" className="animate-twinkle-slow" />
              <rect x="190" y="18" width="2" height="2" fill="#e9ddff" className="animate-twinkle" />
              <rect x="214" y="34" width="2" height="2" fill="#fde68a" className="animate-twinkle-slow" />
              <rect x="158" y="14" width="2" height="2" fill="#ddd6fe" opacity="0.6" />
              <rect x="78" y="12" width="2" height="2" fill="#ddd6fe" opacity="0.6" />

              {/* 좌측 상단 픽셀 초승달 */}
              <g transform="translate(24, 24)">
                <rect x="4" y="0" width="6" height="2" fill="#f3e8c0" />
                <rect x="2" y="2" width="4" height="2" fill="#f3e8c0" />
                <rect x="0" y="4" width="4" height="6" fill="#f3e8c0" />
                <rect x="2" y="10" width="4" height="2" fill="#f3e8c0" />
                <rect x="4" y="12" width="6" height="2" fill="#f3e8c0" />
              </g>

              {/* 절제된 픽셀 구름 */}
              <g opacity="0.14" fill="#e9ddff">
                <rect x="12" y="84" width="36" height="7" />
                <rect x="20" y="79" width="20" height="5" />
                <rect x="188" y="82" width="40" height="7" />
                <rect x="196" y="77" width="22" height="5" />
              </g>

              {/* 잔잔하게 내리는 픽셀 눈송이 */}
              <rect x="46" y="4" width="2" height="2" fill="#f5f3ff" className="animate-snow-1" />
              <rect x="148" y="2" width="2" height="2" fill="#f5f3ff" className="animate-snow-2" />
              <rect x="200" y="8" width="2" height="2" fill="#f5f3ff" className="animate-snow-3" />

              {/* 원경 작은 픽셀 나무 실루엣 (양쪽 끝) */}
              <g fill="#1c1138" opacity="0.65">
                <rect x="14" y="114" width="4" height="4" />
                <rect x="10" y="118" width="12" height="6" />
                <rect x="6" y="124" width="20" height="8" />
                <rect x="14" y="132" width="4" height="6" />

                <rect x="222" y="114" width="4" height="4" />
                <rect x="218" y="118" width="12" height="6" />
                <rect x="214" y="124" width="20" height="8" />
                <rect x="222" y="132" width="4" height="6" />
              </g>

              {/* 2D 횡스크롤 바닥 지면 */}
              <rect x="0" y="136" width="240" height="5" fill={theme.groundTop} />
              <rect x="0" y="141" width="240" height="27" fill={theme.groundBottom} />
              <g fill="#ffffff" opacity="0.14">
                <rect x="10" y="136" width="12" height="2" />
                <rect x="96" y="136" width="48" height="2" />
                <rect x="218" y="136" width="12" height="2" />
              </g>
              <g fill="#0b0518" opacity="0.45">
                <rect x="18" y="149" width="6" height="3" />
                <rect x="54" y="155" width="8" height="3" />
                <rect x="114" y="151" width="12" height="3" />
                <rect x="176" y="155" width="8" height="3" />
                <rect x="214" y="149" width="7" height="3" />
              </g>

              {/* ============ 정중앙: 2D 픽셀 크리스마스 트리 (중심 X = 120) ============ */}
              <g transform="translate(40, 0)">
                {/* 트리 아래 그림자 */}
                <rect x="52" y="137" width="56" height="4" fill="#0d061f" opacity="0.55" />

                {/* 성탄절 후광 */}
                {isChristmas && (
                  <g opacity="0.18">
                    <rect x="64" y="8" width="32" height="32" fill="#fde047" />
                    <rect x="56" y="16" width="48" height="16" fill="#fde047" />
                  </g>
                )}

                {/* 나무 기둥 */}
                <rect x="73" y="122" width="14" height="16" fill="#6b4226" />
                <rect x="73" y="122" width="4" height="16" fill="#825333" />
                <rect x="84" y="122" width="3" height="16" fill="#4a2b17" />

                {/* 3단 트리 하단 */}
                <rect x="44" y="114" width="72" height="10" fill="#1e5645" />
                <rect x="48" y="106" width="64" height="8" fill="#236551" />
                <rect x="54" y="98" width="52" height="8" fill="#28735c" />
                <rect x="44" y="122" width="72" height="2" fill="#143c30" />
                <rect x="46" y="114" width="10" height="3" fill="#d8e7ef" opacity="0.7" />
                <rect x="104" y="114" width="10" height="3" fill="#d8e7ef" opacity="0.55" />

                {/* 2단 트리 중단 */}
                <rect x="52" y="90" width="56" height="10" fill="#236551" />
                <rect x="58" y="80" width="44" height="10" fill="#29775f" />
                <rect x="64" y="72" width="32" height="8" fill="#2f856a" />
                <rect x="52" y="98" width="56" height="2" fill="#184a3b" />
                <rect x="54" y="90" width="8" height="3" fill="#d8e7ef" opacity="0.7" />
                <rect x="98" y="90" width="8" height="3" fill="#d8e7ef" opacity="0.55" />

                {/* 1단 트리 상단 */}
                <rect x="60" y="64" width="40" height="10" fill="#29775f" />
                <rect x="66" y="54" width="28" height="10" fill="#318a6f" />
                <rect x="72" y="44" width="16" height="10" fill="#37987a" />
                <rect x="76" y="36" width="8" height="8" fill="#3fa686" />
                <rect x="78" y="32" width="4" height="4" fill="#46b392" />
                <rect x="60" y="72" width="40" height="2" fill="#1b5342" />
                <rect x="62" y="64" width="6" height="2" fill="#e2eef5" opacity="0.75" />

                {/* 은은한 픽셀 전구 도트 */}
                <rect x="74" y="50" width="2" height="2" fill="#fef08a" opacity="0.8" />
                <rect x="86" y="84" width="2" height="2" fill="#fde68a" opacity="0.75" />
                <rect x="58" y="108" width="2" height="2" fill="#e9d5ff" opacity="0.75" />
                <rect x="102" y="110" width="2" height="2" fill="#fef08a" opacity="0.75" />

                {/* 꼭대기 미점등 별자리 */}
                {!isChristmas && (
                  <g opacity="0.32" fill="#d9be76">
                    <rect x="79" y="16" width="2" height="2" />
                    <rect x="77" y="20" width="6" height="2" />
                    <rect x="79" y="24" width="2" height="2" />
                  </g>
                )}

                {/* 트리 밑둥 바로 아래 작은 선물 상자 2개 */}
                <g transform="translate(56, 126)">
                  <rect x="0" y="2" width="14" height="10" fill="#7c56b8" />
                  <rect x="6" y="2" width="2" height="10" fill="#e2c675" />
                  <rect x="0" y="6" width="14" height="2" fill="#e2c675" />
                  <rect x="4" y="0" width="6" height="2" fill="#e2c675" />
                </g>
                <g transform="translate(91, 128)">
                  <rect x="0" y="2" width="12" height="8" fill="#a8557a" />
                  <rect x="5" y="2" width="2" height="8" fill="#f3e8c0" />
                  <rect x="3" y="0" width="6" height="2" fill="#f3e8c0" />
                </g>

                {/* 주차별로 잠금 해제된 오너먼트들 */}
                {unlockedOrnaments.map((ornament) => (
                  <TreePlacedOrnament
                    key={ornament.id}
                    ornament={ornament}
                    isSelected={selectedOrnament.id === ornament.id}
                    onClick={() => setSelectedId(ornament.id)}
                  />
                ))}
              </g>

              {/* ============ 트리 주위 대림초 4개 (왼쪽→오른쪽: 진보라·연보라·분홍·흰색) ============ */}
              <g aria-label="트리 주위를 감싼 4개의 대림초와 개별 대림환">
                {ADVENT_CANDLES.map((candle) => (
                  <AdventCandleWithWreath
                    key={candle.week}
                    candle={candle}
                    lit={candle.week <= unlockedCountWeek}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* 우측(또는 하단): RPG 아이템 슬롯 스타일의 주차별 오너먼트 도감 */}
        <div
          className="flex flex-col justify-between p-4 md:col-span-5"
          style={{ backgroundColor: theme.panelBg }}
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="font-pixel text-xs sm:text-sm"
                style={{ color: theme.frameGold }}
              >
                - 트리 오너먼트 -
              </h2>
              <span
                className="font-pixel text-[11px]"
                style={{ color: theme.accentPurple }}
              >
                {unlockedOrnaments.length} / {TREE_ORNAMENTS.length} 획득
              </span>
            </div>

            <div className="space-y-2">
              {TREE_ORNAMENTS.map((ornament) => {
                const unlocked = ornament.unlockWeek <= unlockedCountWeek;
                const isSelected = selectedOrnament.id === ornament.id;

                return (
                  <button
                    key={ornament.id}
                    type="button"
                    onClick={() => setSelectedId(ornament.id)}
                    className="flex w-full items-center gap-3 border-2 px-2.5 py-2 text-left transition-colors"
                    style={{
                      borderColor: isSelected
                        ? theme.frameGold
                        : unlocked
                          ? theme.frameGoldDark
                          : 'rgba(130, 108, 175, 0.25)',
                      backgroundColor: isSelected
                        ? theme.panelBgSoft
                        : unlocked
                          ? 'rgba(20, 11, 42, 0.45)'
                          : 'rgba(10, 5, 22, 0.45)',
                    }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center border"
                      style={{
                        borderColor: unlocked ? theme.frameGoldDark : '#332357',
                        backgroundColor: unlocked ? 'rgba(255,255,255,0.05)' : '#120924',
                      }}
                    >
                      <PixelOrnamentGlyph
                        type={ornament.iconType}
                        primary={ornament.primaryColor}
                        accent={ornament.accentColor}
                        locked={!unlocked}
                        size={18}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-pixel truncate text-xs"
                          style={{
                            color: unlocked ? theme.textPrimary : '#7c6aa3',
                          }}
                        >
                          {unlocked ? ornament.name : '미획득'}
                        </span>
                        <span
                          className="font-pixel shrink-0 text-[10px]"
                          style={{
                            color: unlocked ? theme.frameGold : '#645487',
                          }}
                        >
                          {ornament.weekLabel}
                        </span>
                      </div>
                      <p
                        className="mt-0.5 truncate text-[11px]"
                        style={{ color: unlocked ? theme.textMuted : '#5c4d7d' }}
                      >
                        {unlocked
                          ? ornament.description
                          : ornament.unlockWeek === 5
                            ? '성탄절이 되면 트리에 달립니다'
                            : `${ornament.weekLabel}가 되면 트리에 달립니다`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 하단 선택된 오너먼트 상세 안내 한 줄 */}
          <div
            className="mt-3 border-t pt-2.5 text-[11px]"
            style={{
              borderColor: 'rgba(217, 190, 118, 0.25)',
              color: theme.textMuted,
            }}
          >
            <span className="font-pixel mr-1.5" style={{ color: theme.frameGold }}>
              [{selectedOrnament.weekLabel}]
            </span>
            {isSelectedUnlocked
              ? selectedOrnament.description
              : '해당 주차가 열리면 새로운 오너먼트가 트리에 추가됩니다.'}
          </div>
        </div>
      </div>

      {/* 하단 주차 테마 단계 표시 바 */}
      <div
        className="font-pixel flex flex-wrap items-center justify-between gap-2 border-t-2 px-4 py-1.5 text-[10px]"
        style={{
          borderColor: theme.frameGoldDark,
          backgroundColor: 'rgba(10, 5, 24, 0.35)',
          color: theme.textMuted,
        }}
      >
        <span>{theme.stageName}</span>
        <span>대림초 {litCandleCount} / 4 점등 · 보라빛 단계 {currentWeek} / 5</span>
      </div>
    </section>
  );
}
