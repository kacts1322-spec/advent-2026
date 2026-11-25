import { NextRequest, NextResponse } from 'next/server';
import { removePushSubscription, savePushSubscription } from '@/lib/storage';

/**
 * Web Push 구독 관리 API
 * - GET    /api/push/subscribe : VAPID 공개키 설정 여부 및 공개키 반환
 * - POST   /api/push/subscribe : 기기의 PushSubscription 등록
 * - DELETE /api/push/subscribe : 기기의 PushSubscription 해제
 */

export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || '';
  const hasPrivateKey = Boolean(process.env.VAPID_PRIVATE_KEY?.trim());

  return NextResponse.json({
    configured: Boolean(vapidPublicKey && hasPrivateKey),
    vapidPublicKey: vapidPublicKey || null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    } | null;

    const endpoint = body?.endpoint?.trim();
    const p256dh = body?.keys?.p256dh?.trim();
    const auth = body?.keys?.auth?.trim();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: '유효한 푸시 구독 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    await savePushSubscription({ endpoint, p256dh, auth });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/push/subscribe] 오류:', err);
    return NextResponse.json(
      { error: '푸시 알림 구독을 저장하지 못했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
    const endpoint = body?.endpoint?.trim();

    if (!endpoint) {
      return NextResponse.json({ error: '해제할 endpoint가 필요합니다.' }, { status: 400 });
    }

    await removePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/push/subscribe] 오류:', err);
    return NextResponse.json(
      { error: '푸시 알림 구독을 해제하지 못했습니다.' },
      { status: 500 }
    );
  }
}
