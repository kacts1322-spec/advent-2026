/**
 * 대림절 본문 및 교회력(RCL)에서 사용하는 성경 책 메타데이터
 * 대한성서공회 URL 코드(bskCode)와 BibleGateway 영문명(nameEn)을 매핑합니다.
 */
export interface BibleBookInfo {
  bskCode: string;
  nameKo: string;
  abbrevKo: string;
  nameEn: string;
}

export const BIBLE_BOOKS_BY_CODE: Record<string, BibleBookInfo> = {
  gen: { bskCode: 'gen', nameKo: '창세기', abbrevKo: '창', nameEn: 'Genesis' },
  '1sa': { bskCode: '1sa', nameKo: '사무엘상', abbrevKo: '삼상', nameEn: '1 Samuel' },
  '2sa': { bskCode: '2sa', nameKo: '사무엘하', abbrevKo: '삼하', nameEn: '2 Samuel' },
  psa: { bskCode: 'psa', nameKo: '시편', abbrevKo: '시', nameEn: 'Psalms' },
  isa: { bskCode: 'isa', nameKo: '이사야', abbrevKo: '사', nameEn: 'Isaiah' },
  mat: { bskCode: 'mat', nameKo: '마태복음', abbrevKo: '마', nameEn: 'Matthew' },
  mrk: { bskCode: 'mrk', nameKo: '마가복음', abbrevKo: '막', nameEn: 'Mark' },
  luk: { bskCode: 'luk', nameKo: '누가복음', abbrevKo: '눅', nameEn: 'Luke' },
  jhn: { bskCode: 'jhn', nameKo: '요한복음', abbrevKo: '요', nameEn: 'John' },
  rom: { bskCode: 'rom', nameKo: '로마서', abbrevKo: '롬', nameEn: 'Romans' },
  '1co': { bskCode: '1co', nameKo: '고린도전서', abbrevKo: '고전', nameEn: '1 Corinthians' },
  eph: { bskCode: 'eph', nameKo: '에베소서', abbrevKo: '엡', nameEn: 'Ephesians' },
  '1th': { bskCode: '1th', nameKo: '데살로니가전서', abbrevKo: '살전', nameEn: '1 Thessalonians' },
  heb: { bskCode: 'heb', nameKo: '히브리서', abbrevKo: '히', nameEn: 'Hebrews' },
  '2pe': { bskCode: '2pe', nameKo: '베드로후서', abbrevKo: '벧후', nameEn: '2 Peter' },
};

export function getBookInfo(bookCode: string): BibleBookInfo | undefined {
  return BIBLE_BOOKS_BY_CODE[bookCode.toLowerCase()];
}
