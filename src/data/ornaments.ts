import type { AdventWeek } from '@/types/advent';

/**
 * 주차별 크리스마스 트리 오너먼트 설정
 *
 * 왜 별도 데이터 파일로 분리했나:
 * - 사용자가 추후 각 주차별 오너먼트의 이름/의미/모양을 구체적으로 알려줄 예정이므로,
 *   이 파일의 배열만 수정하면 트리 위 오너먼트와 하단 도감 슬롯이 동시에 갱신되도록 구성했습니다.
 */
export type OrnamentIconType = 'candle' | 'bell' | 'bauble' | 'heart' | 'star';

export interface OrnamentConfig {
  id: string;
  unlockWeek: AdventWeek;
  weekLabel: string;
  name: string;
  description: string;
  iconType: OrnamentIconType;
  /** 트리 SVG(좌표계 160x180) 위 중심 위치 */
  treeX: number;
  treeY: number;
  primaryColor: string;
  accentColor: string;
}

export const TREE_ORNAMENTS: OrnamentConfig[] = [
  {
    id: 'ornament-week-1',
    unlockWeek: 1,
    weekLabel: '1주차',
    name: '소망의 등불',
    description: '어둠 속에 비추는 첫 번째 소망의 빛',
    iconType: 'candle',
    treeX: 67,
    treeY: 118,
    primaryColor: '#f6d365',
    accentColor: '#fff4c2',
  },
  {
    id: 'ornament-week-2',
    unlockWeek: 2,
    weekLabel: '2주차',
    name: '평화의 종',
    description: '나그네를 환대하는 평화의 울림',
    iconType: 'bell',
    treeX: 98,
    treeY: 100,
    primaryColor: '#c4b5fd',
    accentColor: '#ede9fe',
  },
  {
    id: 'ornament-week-3',
    unlockWeek: 3,
    weekLabel: '3주차',
    name: '기쁨의 방울',
    description: '오시는 주님을 맞이하는 기쁨의 노래',
    iconType: 'bauble',
    treeX: 66,
    treeY: 82,
    primaryColor: '#f48fb1',
    accentColor: '#fce4ec',
  },
  {
    id: 'ornament-week-4',
    unlockWeek: 4,
    weekLabel: '4주차',
    name: '사랑의 마음',
    description: '우리 가운데 거하시는 임마누엘의 사랑',
    iconType: 'heart',
    treeX: 93,
    treeY: 66,
    primaryColor: '#fb7185',
    accentColor: '#ffe4e6',
  },
  {
    id: 'ornament-christmas',
    unlockWeek: 5,
    weekLabel: '성탄절',
    name: '성탄의 큰 별',
    description: '우리 안에 성탄하신 하나님과 함께 빛나는 별',
    iconType: 'star',
    treeX: 80,
    treeY: 22,
    primaryColor: '#fde047',
    accentColor: '#fef9c3',
  },
];
