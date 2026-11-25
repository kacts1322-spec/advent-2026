'use client';

import { useState } from 'react';
import type { AdventThemeTokens } from '@/lib/theme';
import { BookMarked, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * 대림절·성탄절의 유래 및 전통 성탄목(사과·장미·빵·초) 신앙 교육 안내 아코디언
 *
 * - 기본값은 닫혀 있는 상태(false)로 유지하여 메인 묵상 화면이 간결하게 보이도록 하고,
 *   사용자가 제목 바를 클릭하면 핵심 내용이 짧고 읽기 쉽게 펼쳐집니다.
 */

interface AdventGuideAccordionProps {
  theme: AdventThemeTokens;
}

type TreeSymbolKey = 'apple' | 'rose' | 'bread' | 'candle';

interface TreeEducationSymbol {
  key: TreeSymbolKey;
  weekOrder: string;
  name: string;
  meaning: string;
}

const TREE_EDUCATION_SYMBOLS: TreeEducationSymbol[] = [
  {
    key: 'apple',
    weekOrder: '1주 · 사과',
    name: '창조와 회개, 구원의 약속',
    meaning: '에덴의 선악과와 인간의 연약함을 돌아보며, 우리를 회복하실 구원자를 기다립니다.',
  },
  {
    key: 'rose',
    weekOrder: '2주 · 장미',
    name: '겨울에 피어난 메시아',
    meaning: '이새의 줄기에서 난 한 싹(사 11:1)처럼, 메마른 세상에 생명으로 오신 예수님을 뜻합니다.',
  },
  {
    key: 'bread',
    weekOrder: '3주 · 빵',
    name: '생명의 떡이신 주님',
    meaning: '‘빵의 집’ 베들레헴에 오셔서 자신을 생명의 떡(요 6:35)으로 내어주신 성찬의 은혜입니다.',
  },
  {
    key: 'candle',
    weekOrder: '4주 · 초',
    name: '어둠을 밝히는 참 빛',
    meaning: '어둠 속에 비추는 세상의 빛(요 1:5)으로 오신 예수님과 그 빛을 따르는 삶을 기억합니다.',
  },
];

/** 전통 성탄목 4가지 상징물(사과·장미·빵·초)을 작은 2D 픽셀 아이콘으로 표현 */
function SymbolPixelIcon({ type }: { type: TreeSymbolKey }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="shrink-0"
    >
      {type === 'apple' && (
        <>
          <rect x="6" y="1" width="1" height="2" fill="#854d0e" />
          <rect x="7" y="1" width="2" height="1" fill="#4ade80" />
          <rect x="3" y="3" width="6" height="1" fill="#dc2626" />
          <rect x="2" y="4" width="8" height="4" fill="#dc2626" />
          <rect x="3" y="8" width="6" height="2" fill="#b91c1c" />
          <rect x="3" y="4" width="2" height="2" fill="#fca5a5" />
        </>
      )}
      {type === 'rose' && (
        <>
          <rect x="4" y="2" width="4" height="1" fill="#f43f5e" />
          <rect x="3" y="3" width="6" height="3" fill="#e11d48" />
          <rect x="4" y="3" width="2" height="2" fill="#fda4af" />
          <rect x="4" y="6" width="4" height="1" fill="#be123c" />
          <rect x="5" y="7" width="2" height="4" fill="#15803d" />
          <rect x="3" y="8" width="2" height="1" fill="#4ade80" />
          <rect x="7" y="9" width="2" height="1" fill="#4ade80" />
        </>
      )}
      {type === 'bread' && (
        <>
          <rect x="3" y="3" width="6" height="2" fill="#e8b374" />
          <rect x="2" y="5" width="8" height="4" fill="#d49553" />
          <rect x="2" y="8" width="8" height="1" fill="#9c612c" />
          <rect x="4" y="5" width="4" height="1" fill="#a86d34" />
          <rect x="6" y="4" width="1" height="3" fill="#a86d34" />
        </>
      )}
      {type === 'candle' && (
        <>
          <rect x="5" y="1" width="2" height="2" fill="#fef08a" />
          <rect x="5" y="2" width="2" height="1" fill="#fb923c" />
          <rect x="4" y="4" width="4" height="6" fill="#f8fafc" />
          <rect x="5" y="4" width="1" height="5" fill="#ffffff" />
          <rect x="3" y="10" width="6" height="1" fill="#d9be76" />
        </>
      )}
    </svg>
  );
}

export default function AdventGuideAccordion({ theme }: AdventGuideAccordionProps) {
  // 처음에는 닫힌 상태로 시작합니다.
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="pixel-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="advent-origins-content"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:brightness-110 sm:px-5"
        style={{ backgroundColor: 'rgba(10, 5, 24, 0.32)' }}
      >
        <div className="flex items-center gap-2.5">
          <BookMarked className="h-4 w-4 shrink-0" style={{ color: theme.frameGold }} />
          <span className="font-pixel text-xs sm:text-sm" style={{ color: theme.frameGold }}>
            대림절·성탄절의 의미와 성탄목 이야기
          </span>
        </div>

        <span
          className="font-pixel inline-flex shrink-0 items-center gap-1 text-[11px]"
          style={{ color: theme.accentPurple }}
        >
          {isOpen ? '닫기' : '펼쳐보기'}
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {isOpen && (
        <div
          id="advent-origins-content"
          className="space-y-4 border-t-2 px-4 py-4 sm:px-5 sm:py-5"
          style={{ borderColor: theme.frameGoldDark }}
        >
          {/* 1) 대림절 유래 & 성탄절 의미 (2컬럼 간결 요약) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="pixel-panel-soft p-3.5">
              <h3 className="font-pixel text-xs" style={{ color: theme.frameGold }}>
                대림절(Advent)의 유래
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed sm:text-[13px]" style={{ color: theme.textPrimary }}>
                라틴어 <em>Adventus</em>(‘오심’)에서 유래한 절기로, 성탄절 전 4주간 지키며 새 교회력을
                엽니다. 이미 오신 아기 예수님을 기억하고, 다시 오실 주님을 기다리며 대림환의 네 초를
                매주 하나씩 밝힙니다.
              </p>
            </div>

            <div className="pixel-panel-soft p-3.5">
              <h3 className="font-pixel text-xs" style={{ color: theme.frameGold }}>
                성탄절(Christmas)의 의미
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed sm:text-[13px]" style={{ color: theme.textPrimary }}>
                하나님께서 인간의 몸을 입고 우리 가운데 거하신 <strong>성육신(임마누엘)</strong>을
                기념하는 날입니다. 가장 낮은 자리로 찾아오셔서 어둠을 밝히신 주님의 사랑과 구원을
                함께 기뻐합니다.
              </p>
            </div>
          </div>

          {/* 2) 전통 성탄목 신앙 교육의 유래 (사과 · 장미 · 빵 · 초) */}
          <div className="pixel-panel-soft p-3.5 sm:p-4">
            <h3 className="font-pixel text-xs sm:text-[13px]" style={{ color: theme.frameGold }}>
              성탄목의 신앙 교육 유래 · 매주 걸었던 4가지 상징
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed sm:text-[13px]" style={{ color: theme.textMuted }}>
              대림절 성탄목은 원래 단순한 장식이 아니라, 겨울에도 푸른 상록수에 성경의 구원 이야기를
              담아 매주 하나씩 상징물을 걸며 복음을 가르치던 <strong>신앙 교육의 나무</strong>에서
              비롯되었습니다.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {TREE_EDUCATION_SYMBOLS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start gap-2.5 border p-2.5"
                  style={{
                    borderColor: 'rgba(217, 190, 118, 0.25)',
                    backgroundColor: 'rgba(12, 6, 28, 0.45)',
                  }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center border"
                    style={{
                      borderColor: theme.frameGoldDark,
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <SymbolPixelIcon type={item.key} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-pixel text-[11px]" style={{ color: theme.frameGold }}>
                        {item.weekOrder}
                      </span>
                      <span className="font-pixel text-[11px]" style={{ color: theme.textPrimary }}>
                        · {item.name}
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: theme.textMuted }}>
                      {item.meaning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
