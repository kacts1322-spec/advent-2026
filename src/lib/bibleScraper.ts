import { getBookInfo } from '@/lib/bibleBooks';
import { getCachedChapter, saveCachedChapter } from '@/lib/storage';
import type { BibleVerse, ScriptureSpec, TranslationId, VerseRange } from '@/types/advent';

/**
 * 성경 본문 스크래퍼 및 캐시 조회 모듈
 *
 * - 개역개정(GAE), 새번역(SAE), 공동번역(COG): 대한성서공회(bskorea.or.kr)에서 장 본문 추출
 * - NIV: 대한성서공회에 NIV가 없으므로 BibleGateway(biblegateway.com)에서 추출
 * - 매 요청마다 외부 사이트에 부하를 주지 않도록 장 단위로 캐시(Supabase 또는 로컬 .data/)합니다.
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** HTML 엔티티(&nbsp;, &ldquo; 등)를 일반 문자로 복원합니다. */
function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '“')
    .replace(/&lsquo;|&rsquo;/gi, '‘')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/\u00a0/g, ' ');
}

/**
 * 대한성서공회(`bskorea.or.kr/bible/korbibReadpage.php`) HTML에서 절 번호와 본문을 추출합니다.
 */
export function parseBskoreaChapterHtml(html: string): BibleVerse[] {
  // 각주 팝업(div.D2), 각주 번호 링크(a.comment), 소제목(font.smallTitle) 제거
  const cleanedHtml = html
    .replace(/<div[^>]*\bclass\s*=\s*['"]?D2\b[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<a[^>]*\bclass\s*=\s*['"]?comment\b[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<font[^>]*\bclass\s*=\s*['"]?smallTitle\b[^>]*>[\s\S]*?<\/font>/gi, '');

  const numberRegex = /<span\s+class=["']?number["']?\s*>\s*(\d+)(?:&nbsp;|\s)*<\/span>/gi;
  const matches: Array<{ verse: number; matchStart: number; textStart: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = numberRegex.exec(cleanedHtml)) !== null) {
    matches.push({
      verse: Number(m[1]),
      matchStart: m.index,
      textStart: m.index + m[0].length,
    });
  }

  const verseMap = new Map<number, string>();
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextStart =
      i + 1 < matches.length
        ? matches[i + 1].matchStart
        : cleanedHtml.indexOf('</div>', cur.textStart);

    const sliceEnd = nextStart > cur.textStart ? nextStart : cur.textStart + 1600;
    let rawSegment = cleanedHtml.slice(cur.textStart, sliceEnd);

    // 줄바꿈(<br />) 이후에 붙은 불필요한 HTML 꼬리 절단
    const brIdx = rawSegment.search(/<br\s*\/?>/i);
    if (brIdx !== -1) {
      rawSegment = rawSegment.slice(0, brIdx);
    }

    const plainText = decodeHtmlEntities(rawSegment.replace(/<[^>]+>/g, ''))
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText && !Number.isNaN(cur.verse)) {
      const prev = verseMap.get(cur.verse);
      verseMap.set(cur.verse, prev ? `${prev} ${plainText}` : plainText);
    }
  }

  return Array.from(verseMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([verse, text]) => ({ verse, text }));
}

/**
 * BibleGateway(`biblegateway.com/passage/?search=...&version=NIV`) HTML에서 절 번호와 본문을 추출합니다.
 */
export function parseBibleGatewayHtml(html: string, targetChapter: number): BibleVerse[] {
  const startIdx = html.indexOf('passage-content');
  if (startIdx === -1) return [];

  const footnotesIdx = html.indexOf('class="footnotes"', startIdx);
  const crossrefsIdx = html.indexOf('class="crossrefs"', startIdx);
  const endCandidates = [footnotesIdx, crossrefsIdx, startIdx + 160000].filter(
    (n) => n > startIdx
  );
  const endIdx = Math.min(...endCandidates);

  const contentHtml = html
    .slice(startIdx, endIdx)
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '')
    .replace(
      /<sup[^>]*\bclass\s*=\s*['"][^'"]*(?:crossreference|footnote)[^'"]*['"][^>]*>[\s\S]*?<\/sup>/gi,
      ''
    )
    .replace(/<sup[^>]*\bclass\s*=\s*['"][^'"]*versenum[^'"]*['"][^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(
      /<span[^>]*\bclass\s*=\s*['"][^'"]*chapternum[^'"]*['"][^>]*>[\s\S]*?<\/span>/gi,
      ''
    );

  // 중첩된 <span> (예: <span class="small-caps">Lord</span>, <span class="woj">예수님 말씀</span>)을
  // 누락하지 않도록 depth 카운팅으로 닫는 </span> 위치를 정확히 찾습니다.
  const openSpanRegex =
    /<span[^>]*\bclass=["'][^"']*\btext\s+[A-Za-z0-9]+-(\d+)-(\d+)[^"']*["'][^>]*>/gi;
  const spanTagRegex = /<\/?span\b[^>]*>/gi;
  const verseTextMap = new Map<number, string[]>();

  let m: RegExpExecArray | null;
  while ((m = openSpanRegex.exec(contentHtml)) !== null) {
    const chapNum = Number(m[1]);
    const verseNum = Number(m[2]);
    if (chapNum !== targetChapter || Number.isNaN(verseNum)) continue;

    const innerStart = m.index + m[0].length;
    spanTagRegex.lastIndex = innerStart;
    let depth = 1;
    let innerEnd = -1;
    let tagMatch: RegExpExecArray | null;

    while ((tagMatch = spanTagRegex.exec(contentHtml)) !== null) {
      if (tagMatch[0].startsWith('</')) {
        depth -= 1;
        if (depth === 0) {
          innerEnd = tagMatch.index;
          break;
        }
      } else {
        depth += 1;
      }
    }

    if (innerEnd === -1) continue;

    const innerHtml = contentHtml.slice(innerStart, innerEnd);
    const cleaned = decodeHtmlEntities(innerHtml.replace(/<[^>]+>/g, ''))
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned) {
      const list = verseTextMap.get(verseNum) ?? [];
      list.push(cleaned);
      verseTextMap.set(verseNum, list);
    }
  }

  return Array.from(verseTextMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([verse, parts]) => ({ verse, text: parts.join(' ') }));
}

/** 절 구간 배열(ranges)에 포함되는 구절만 필터링합니다. */
export function filterVersesByRanges(verses: BibleVerse[], ranges: VerseRange[]): BibleVerse[] {
  return verses.filter((v) => ranges.some((r) => v.verse >= r.start && v.verse <= r.end));
}

/** 절 구간 배열에 포함된 모든 절 번호 목록을 펼쳐 반환합니다 (하이라이트 계산용). */
export function expandRangesToVerseNumbers(ranges: VerseRange[]): number[] {
  const result: number[] = [];
  for (const r of ranges) {
    for (let v = r.start; v <= r.end; v++) {
      result.push(v);
    }
  }
  return result;
}

/** 지정된 번역본과 성경 명세(ScriptureSpec)의 구절들을 캐시 또는 웹에서 가져옵니다. */
export async function fetchScripturePassage(
  spec: ScriptureSpec,
  translation: TranslationId
): Promise<{ verses: BibleVerse[]; sourceName: string; errorMessage?: string }> {
  const sourceName = translation === 'NIV' ? 'BibleGateway (NIV)' : '대한성서공회';
  const book = getBookInfo(spec.bookCode);

  if (!book) {
    return {
      verses: [],
      sourceName,
      errorMessage: `성경 책 정보를 찾을 수 없습니다 (${spec.bookCode}).`,
    };
  }

  // 1) 캐시 우선 확인
  const cachedChapter = await getCachedChapter(translation, spec.bookCode, spec.chapter);
  if (cachedChapter && cachedChapter.length > 0) {
    return {
      verses: filterVersesByRanges(cachedChapter, spec.ranges),
      sourceName,
    };
  }

  // 2) 캐시 미스 시 외부 사이트에서 해당 장(Chapter) 1회 가져오기
  const url =
    translation === 'NIV'
      ? `https://www.biblegateway.com/passage/?search=${encodeURIComponent(
          `${book.nameEn} ${spec.chapter}`
        )}&version=NIV`
      : `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=${translation}&book=${book.bskCode}&chap=${spec.chapter}&sec=1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        verses: [],
        sourceName,
        errorMessage: `${sourceName} 응답 오류 (HTTP ${response.status})`,
      };
    }

    const html = await response.text();
    const parsedChapter =
      translation === 'NIV'
        ? parseBibleGatewayHtml(html, spec.chapter)
        : parseBskoreaChapterHtml(html);

    if (parsedChapter.length === 0) {
      return {
        verses: [],
        sourceName,
        errorMessage: `${sourceName} 페이지에서 본문 구절을 추출하지 못했습니다.`,
      };
    }

    // 장 전체를 캐시해 두면 같은 장의 다른 절·재방문 시 즉시 응답
    await saveCachedChapter(translation, spec.bookCode, spec.chapter, parsedChapter);

    return {
      verses: filterVersesByRanges(parsedChapter, spec.ranges),
      sourceName,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      verses: [],
      sourceName,
      errorMessage: `${sourceName}에서 말씀을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (${reason})`,
    };
  }
}
