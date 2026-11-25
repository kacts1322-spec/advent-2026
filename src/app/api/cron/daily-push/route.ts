import { NextRequest, NextResponse } from 'next/server';
import * as webpush from 'web-push';
import { CHRISTMAS_MESSAGE, getScheduleByDate } from '@/data/adventSchedule';
import { getAdventPeriodStatus, getTodayKstDateString } from '@/lib/dateUtils';
import { getDayPassageLabel } from '@/lib/exportUtils';
import { getAllPushSubscriptions, removePushSubscription } from '@/lib/storage';

/**
 * 매일 아침 7시(KST, UTC 22:00) 자동 푸시 알림 발송 API
 *
 * 호출 경로:
 * - Vercel Cron (`vercel.json`) 또는 GitHub Actions (`.github/workflows/daily-advent-push.yml`)
 * - 환경변수 CRON_SECRET과 일치하는 `Authorization: Bearer <CRON_SECRET>` 헤더로 인증합니다.
 */

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}

async function handleDailyPush(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@advent2026.local';

  if (!publicKey || !privateKey) {
    return NextResponse.json(
      {
        error:
          'VAPID 키(NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)가 설정되지 않았습니다.',
      },
      { status: 503 }
    );
  }

  const todayKst = getTodayKstDateString();
  const periodStatus = getAdventPeriodStatus(todayKst);

  if (periodStatus !== 'active') {
    return NextResponse.json({
      skipped: true,
      reason: `대림절 기간(${todayKst}, 상태=${periodStatus})이 아니므로 알림을 발송하지 않았습니다.`,
    });
  }

  const entry = getScheduleByDate(todayKst);
  const isChristmas = entry?.kind === 'christmas';

  const title = isChristmas
    ? '메리 크리스마스! 성탄절 말씀묵상 시간입니다'
    : '대림절 말씀묵상 시간입니다';

  const body = isChristmas
    ? CHRISTMAS_MESSAGE
    : entry
      ? `${entry.weekLabel} · 오늘의 말씀(${getDayPassageLabel(entry)})을 열어 묵상해 보세요.`
      : '오늘의 대림절 말씀을 열고 주님과 함께 하루를 시작해 보세요.';

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const subscriptions = await getAllPushSubscriptions();
  const payloadStr = JSON.stringify({
    title,
    body,
    url: '/',
    tag: `advent-2026-${todayKst}`,
  });

  let sent = 0;
  let failed = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr
        );
        sent += 1;
      } catch (err: unknown) {
        const statusCode =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;
        // 404/410은 사용자가 브라우저 알림 권한을 철회했거나 만료된 구독이므로 정리합니다.
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscription(sub.endpoint);
          removed += 1;
        } else {
          failed += 1;
        }
      }
    })
  );

  return NextResponse.json({
    ok: true,
    dateKst: todayKst,
    totalSubscriptions: subscriptions.length,
    sent,
    failed,
    removed,
  });
}

export async function GET(request: NextRequest) {
  return handleDailyPush(request);
}

export async function POST(request: NextRequest) {
  return handleDailyPush(request);
}
