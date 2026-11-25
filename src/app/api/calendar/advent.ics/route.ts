import { NextRequest, NextResponse } from 'next/server';
import { ADVENT_SCHEDULE, CHRISTMAS_MESSAGE } from '@/data/adventSchedule';
import { getDayPassageLabel } from '@/lib/exportUtils';

/**
 * GET /api/calendar/advent.ics
 * 2026년 11월 29일 ~ 12월 25일(27일 전체) 매일 오전 7시(KST) 정시 알림이 담긴
 * 표준 iCalendar(.ics) 파일을 생성해 내려받습니다.
 *
 * 왜 함께 제공하나:
 * - 아이폰(iOS) 홈 화면 추가나 카카오톡 인앱 브라우저 제약 없이도, 파일 한 번만 열면
 *   기본 캘린더 앱(Apple Calendar / Google Calendar / 삼성 캘린더)에 매일 오전 7시 정시 알림이 등록됩니다.
 */

function escapeIcsText(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || origin;
  const dtStamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Youth Advent 2026//Daily Devotion Alarm//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:2026 대림절 말씀 묵상 (아침 7시)',
    'X-WR-TIMEZONE:Asia/Seoul',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Seoul',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0900',
    'TZOFFSETTO:+0900',
    'TZNAME:KST',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  for (const entry of ADVENT_SCHEDULE) {
    const compactDate = entry.date.replace(/-/g, '');
    const isChristmas = entry.kind === 'christmas';
    const summary = isChristmas
      ? '대림절 말씀묵상 시간입니다 (성탄절)'
      : `대림절 말씀묵상 시간입니다 (${entry.weekLabel})`;

    const passageInfo = getDayPassageLabel(entry);
    const descLines = [
      isChristmas ? CHRISTMAS_MESSAGE : `${entry.weekLabel} · 오늘의 말씀: ${passageInfo}`,
      `오늘의 말씀 바로가기: ${appUrl}`,
    ];

    lines.push(
      'BEGIN:VEVENT',
      `UID:advent-2026-${entry.date}@youth-devotion`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=Asia/Seoul:${compactDate}T070000`,
      `DTEND;TZID=Asia/Seoul:${compactDate}T071500`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(descLines.join('\n'))}`,
      `URL:${appUrl}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText('대림절 말씀묵상 시간입니다.')}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR', '');

  const icsContent = lines.join('\r\n');
  const encodedName = encodeURIComponent('2026_대림절_아침7시_묵상알림.ics');

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="advent-2026-7am-alarm.ics"; filename*=UTF-8''${encodedName}`,
      'Cache-Control': 'no-store',
    },
  });
}
