import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { ADVENT_SCHEDULE, getScheduleByDate } from '@/data/adventSchedule';
import { getDayPassageLabel, isChristmasExportUnlocked } from '@/lib/exportUtils';
import { getAllReflections } from '@/lib/storage';

/**
 * GET /api/export/excel
 * 대림절 기간 동안 등록된 전체 묵상 나눔을 실제 Excel(.xlsx) 워크북으로 내려받습니다.
 *
 * 구성 시트:
 * 1) 전체 묵상 모음: 누락 없이 모든 묵상 댓글 1행씩 정리
 * 2) 일자별 말씀 및 참여현황: 11/29~12/25 전체 본문표와 일별 참여 수·참여자 요약
 */

function formatFullKstTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export async function GET() {
  if (!isChristmasExportUnlocked()) {
    return NextResponse.json(
      { error: '전체 묵상 엑셀 다운로드는 성탄절(12월 25일)부터 이용하실 수 있습니다.' },
      { status: 403 }
    );
  }

  try {
    const allReflections = await getAllReflections();
    const workbook = XLSX.utils.book_new();

    // ---------------- 시트 1: 전체 묵상 모음 ----------------
    const reflectionRows =
      allReflections.length > 0
        ? allReflections.map((item, idx) => {
            const schedule = getScheduleByDate(item.devotionDate);
            const kindLabel =
              schedule?.kind === 'christmas'
                ? '성탄절'
                : schedule?.kind === 'weekend'
                  ? '주말 교회력'
                  : '평일 묵상';

            return {
              번호: idx + 1,
              주차: schedule?.weekLabel ?? '-',
              날짜: item.devotionDate,
              요일: schedule?.dayOfWeek ?? '-',
              구분: kindLabel,
              '오늘의 본문': schedule ? getDayPassageLabel(schedule) : '-',
              작성자: item.authorName,
              '묵상 내용': item.content,
              '아멘 ♥': item.amenCount ?? 0,
              '작성 시각(KST)': formatFullKstTimestamp(item.createdAt),
            };
          })
        : [
            {
              번호: '-',
              주차: '-',
              날짜: '-',
              요일: '-',
              구분: '-',
              '오늘의 본문': '-',
              작성자: '-',
              '묵상 내용': '아직 등록된 묵상이 없습니다.',
              '아멘 ♥': 0,
              '작성 시각(KST)': '-',
            },
          ];

    const reflectionsSheet = XLSX.utils.json_to_sheet(reflectionRows);
    reflectionsSheet['!cols'] = [
      { wch: 6 },
      { wch: 13 },
      { wch: 12 },
      { wch: 6 },
      { wch: 12 },
      { wch: 28 },
      { wch: 14 },
      { wch: 62 },
      { wch: 9 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, reflectionsSheet, '전체 묵상 모음');

    // ---------------- 시트 2: 일자별 말씀 및 참여현황 ----------------
    const reflectionsByDate = new Map<string, typeof allReflections>();
    for (const item of allReflections) {
      const list = reflectionsByDate.get(item.devotionDate) ?? [];
      list.push(item);
      reflectionsByDate.set(item.devotionDate, list);
    }

    const dailySummaryRows = ADVENT_SCHEDULE.map((entry) => {
      const items = reflectionsByDate.get(entry.date) ?? [];
      const participants = Array.from(new Set(items.map((i) => i.authorName.trim()))).join(', ');
      const fullReadings =
        entry.kind === 'weekend' && entry.lectionaryReadings
          ? entry.lectionaryReadings.map((r) => `${r.labelKo}: ${r.spec.shortRefKo}`).join(' / ')
          : entry.mainPassage?.referenceKo ?? '-';

      return {
        Day: `Day ${entry.dayNumber}`,
        주차: entry.weekLabel,
        날짜: entry.date,
        요일: entry.dayOfWeek,
        구분:
          entry.kind === 'christmas'
            ? '성탄절'
            : entry.kind === 'weekend'
              ? '주말 교회력'
              : '평일 묵상',
        '핵심 요절(기존 본문)': entry.keyVerse?.shortRefKo ?? '-',
        '전체 본문 / 교회력': fullReadings,
        '묵상 건수': items.length,
        참여자: participants || '-',
      };
    });

    const summarySheet = XLSX.utils.json_to_sheet(dailySummaryRows);
    summarySheet['!cols'] = [
      { wch: 8 },
      { wch: 13 },
      { wch: 12 },
      { wch: 6 },
      { wch: 12 },
      { wch: 18 },
      { wch: 46 },
      { wch: 10 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, '일자별 말씀 및 참여현황');

    const arrayBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const filename = '2026_대림절_전체묵상집.xlsx';
    const encodedFilename = encodeURIComponent(filename);

    return new NextResponse(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="advent-2026-reflections.xlsx"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[GET /api/export/excel] 오류:', err);
    return NextResponse.json(
      { error: '엑셀 시트를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
