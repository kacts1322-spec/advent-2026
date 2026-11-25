import type { AdventWeek } from '@/types/advent';

/**
 * 대림절 주차별 보라색 팔레트 (주차가 거듭될수록 점점 더 깊은 보라색으로 변화)
 *
 * - 절제된 2D 레트로 RPG 감성을 위해 과도한 채도 대신 차분하고 깊이감 있는 보라색과
 *   앤티크 골드(황금 픽셀 프레임) 조합을 사용합니다.
 */
export interface AdventThemeTokens {
  week: AdventWeek;
  stageName: string;
  skyTop: string;
  skyBottom: string;
  pageBg: string;
  panelBg: string;
  panelBgSoft: string;
  frameGold: string;
  frameGoldDark: string;
  accentPurple: string;
  highlightBg: string;
  highlightBorder: string;
  textPrimary: string;
  textMuted: string;
  groundTop: string;
  groundBottom: string;
}

export const ADVENT_WEEK_THEMES: Record<AdventWeek, AdventThemeTokens> = {
  1: {
    week: 1,
    stageName: 'WEEK 1 · 연보라의 기다림',
    skyTop: '#3e2d68',
    skyBottom: '#5a4390',
    pageBg: '#322457',
    panelBg: '#271b45',
    panelBgSoft: '#34255b',
    frameGold: '#d9be76',
    frameGoldDark: '#8c7235',
    accentPurple: '#c4b5fd',
    highlightBg: 'rgba(217, 190, 118, 0.16)',
    highlightBorder: '#d9be76',
    textPrimary: '#f6f2ff',
    textMuted: '#cdc2e8',
    groundTop: '#4c387a',
    groundBottom: '#2d1f4d',
  },
  2: {
    week: 2,
    stageName: 'WEEK 2 · 짙어지는 보라',
    skyTop: '#302057',
    skyBottom: '#47307c',
    pageBg: '#261847',
    panelBg: '#1e1338',
    panelBgSoft: '#2a1b4d',
    frameGold: '#d8ba6c',
    frameGoldDark: '#856b2e',
    accentPurple: '#b49ef8',
    highlightBg: 'rgba(216, 186, 108, 0.17)',
    highlightBorder: '#d8ba6c',
    textPrimary: '#f5f0ff',
    textMuted: '#c2b4e3',
    groundTop: '#3d2a69',
    groundBottom: '#21143e',
  },
  3: {
    week: 3,
    stageName: 'WEEK 3 · 깊은 로열 퍼플',
    skyTop: '#241547',
    skyBottom: '#39226b',
    pageBg: '#1c1038',
    panelBg: '#160c2d',
    panelBgSoft: '#211442',
    frameGold: '#d7b560',
    frameGoldDark: '#7d6327',
    accentPurple: '#a78bfa',
    highlightBg: 'rgba(215, 181, 96, 0.18)',
    highlightBorder: '#d7b560',
    textPrimary: '#f4eeff',
    textMuted: '#b7a6dc',
    groundTop: '#301e59',
    groundBottom: '#180d32',
  },
  4: {
    week: 4,
    stageName: 'WEEK 4 · 성탄 전야의 깊은 보라',
    skyTop: '#180c33',
    skyBottom: '#291552',
    pageBg: '#130929',
    panelBg: '#0f0721',
    panelBgSoft: '#190e35',
    frameGold: '#dfb95e',
    frameGoldDark: '#7c6023',
    accentPurple: '#9b7ef5',
    highlightBg: 'rgba(223, 185, 94, 0.2)',
    highlightBorder: '#dfb95e',
    textPrimary: '#f5f0ff',
    textMuted: '#ad9cd4',
    groundTop: '#231347',
    groundBottom: '#110824',
  },
  5: {
    week: 5,
    stageName: 'CHRISTMAS · 성탄의 빛',
    skyTop: '#14092b',
    skyBottom: '#28154f',
    pageBg: '#110826',
    panelBg: '#150b2e',
    panelBgSoft: '#211345',
    frameGold: '#f0cf70',
    frameGoldDark: '#947329',
    accentPurple: '#fde68a',
    highlightBg: 'rgba(240, 207, 112, 0.22)',
    highlightBorder: '#f0cf70',
    textPrimary: '#fffdf5',
    textMuted: '#d6c8eb',
    groundTop: '#2b1854',
    groundBottom: '#140929',
  },
};

export function getThemeForWeek(week: AdventWeek): AdventThemeTokens {
  return ADVENT_WEEK_THEMES[week];
}
